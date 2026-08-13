import type { CheckResult, CheckStatus } from "./types";

const DEFAULT_TIMEOUT_MS = 10_000;

export const skipped = (name: string, detail: string): CheckResult => ({
  name,
  status: "SKIP",
  detail,
});

export type HttpVerdict = { status: CheckStatus; detail: string };

export type HttpCheckSpec = {
  name: string;
  url: string;
  init?: RequestInit;
  timeoutMs?: number;
  interpret: (response: {
    ok: boolean;
    httpStatus: number;
    body: string;
  }) => HttpVerdict;
};

/**
 * `fetch` hides DNS/TCP failures behind a generic `TypeError: fetch failed`;
 * the useful code lives on `error.cause`.
 */
export function describeNetworkError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  if (error.name === "TimeoutError" || error.name === "AbortError")
    return "timeout";

  const cause = (error as { cause?: { code?: string; message?: string } })
    .cause;
  if (cause?.code)
    return `${cause.code}${cause.message ? ` (${cause.message})` : ""}`;
  return error.message;
}

export async function runHttpCheck(spec: HttpCheckSpec): Promise<CheckResult> {
  const startedAt = Date.now();
  try {
    const response = await fetch(spec.url, {
      ...spec.init,
      signal: AbortSignal.timeout(spec.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
    const body = await response.text();
    const verdict = spec.interpret({
      ok: response.ok,
      httpStatus: response.status,
      body,
    });
    return {
      name: spec.name,
      status: verdict.status,
      detail: verdict.detail,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      name: spec.name,
      status: "FAIL",
      detail: describeNetworkError(error),
      latencyMs: Date.now() - startedAt,
    };
  }
}

/** Keeps one API's error prose from blowing out the report table. */
export function truncate(text: string, max = 120): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/** Generic pass/fail used by the simpler token checks. */
export function interpretByStatus(unauthorizedHint: string) {
  return ({
    ok,
    httpStatus,
    body,
  }: {
    ok: boolean;
    httpStatus: number;
    body: string;
  }): HttpVerdict => {
    if (ok) return { status: "OK", detail: `HTTP ${httpStatus}` };
    if (httpStatus === 401 || httpStatus === 403) {
      return {
        status: "FAIL",
        detail: `HTTP ${httpStatus} — ${unauthorizedHint}`,
      };
    }
    return {
      status: "FAIL",
      detail: `HTTP ${httpStatus} ${truncate(body, 80)}`.trim(),
    };
  };
}
