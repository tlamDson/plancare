import {
  runHttpCheck,
  skipped,
  truncate,
  type HttpVerdict,
} from "./http-check";
import type { CheckResult, ServiceEnv } from "./types";

const CLERK_USERS_URL = "https://api.clerk.com/v1/users?limit=1";

export type PublishableKeyInfo = {
  instanceType: "test" | "live";
  frontendApi: string;
};

/**
 * A Clerk publishable key is `pk_<test|live>_<base64 of "<frontend-api-host>$">`.
 * Decoding it tells you which Clerk instance the frontend will actually talk to.
 */
export function parsePublishableKey(
  pk: string | undefined,
): PublishableKeyInfo | null {
  if (!pk) return null;
  const match = /^pk_(test|live)_(.+)$/.exec(pk.trim());
  if (!match) return null;

  const instanceType = match[1] === "live" ? "live" : "test";
  const encoded = match[2];
  if (!encoded) return null;

  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const frontendApi = decoded.replace(/\$$/, "").trim();
    if (!frontendApi || !frontendApi.includes(".")) return null;
    return { instanceType, frontendApi };
  } catch {
    return null;
  }
}

/**
 * A `pk_live_` frontend paired with an `sk_test_` backend (or vice versa) fails
 * silently at runtime — sessions minted by one instance are rejected by the
 * other — so it is worth calling out even when both keys are individually valid.
 */
export function detectClerkInstanceMismatch(
  publishableKey: string | undefined,
  secretKey: string | undefined,
): string | null {
  const pk = parsePublishableKey(publishableKey);
  const secretMatch = /^sk_(test|live)_/.exec(secretKey?.trim() ?? "");
  if (!pk || !secretMatch) return null;

  const secretType = secretMatch[1] === "live" ? "live" : "test";
  if (secretType === pk.instanceType) return null;
  return `instance mismatch: publishable=${pk.instanceType} secret=${secretType}`;
}

export function interpretClerkResponse({
  ok,
  httpStatus,
  body,
}: {
  ok: boolean;
  httpStatus: number;
  body: string;
}): HttpVerdict {
  if (ok) return { status: "OK", detail: `HTTP ${httpStatus}` };
  if (httpStatus === 401) {
    return {
      status: "FAIL",
      detail: "HTTP 401 — secret key rejected (revoked or wrong instance)",
    };
  }
  return {
    status: "FAIL",
    detail: `HTTP ${httpStatus} ${truncate(body, 80)}`.trim(),
  };
}

export async function checkClerk(env: ServiceEnv): Promise<CheckResult> {
  const secretKey = env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) return skipped("Clerk", "CLERK_SECRET_KEY not set");

  const publishableKey =
    env.VITE_CLERK_PUBLISHABLE_KEY?.trim() || env.CLERK_PUBLISHABLE_KEY?.trim();
  const pkInfo = parsePublishableKey(publishableKey);
  const mismatch = detectClerkInstanceMismatch(publishableKey, secretKey);

  const result = await runHttpCheck({
    name: "Clerk",
    url: CLERK_USERS_URL,
    init: { headers: { Authorization: `Bearer ${secretKey}` } },
    interpret: interpretClerkResponse,
  });

  const extras = [
    pkInfo ? `instance=${pkInfo.instanceType}` : null,
    pkInfo ? `frontendApi=${pkInfo.frontendApi}` : null,
    mismatch,
  ].filter(Boolean);

  return extras.length
    ? { ...result, detail: [result.detail, ...extras].join(" · ") }
    : result;
}
