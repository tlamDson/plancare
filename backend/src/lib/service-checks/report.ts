import type { CheckResult } from "./types";

export type RequiredEnvState = Record<
  string,
  { present: boolean; source: string | null }
>;

export type Summary = {
  ok: number;
  failed: number;
  skipped: number;
  total: number;
};

export function summarise(results: CheckResult[]): Summary {
  return {
    ok: results.filter((r) => r.status === "OK").length,
    failed: results.filter((r) => r.status === "FAIL").length,
    skipped: results.filter((r) => r.status === "SKIP").length,
    total: results.length,
  };
}

/**
 * Returns the rendered table rather than printing it — the `console` call
 * belongs to the script, not to a module under `src/`.
 */
export function formatResultsTable(results: CheckResult[]): string {
  if (results.length === 0) return "(no checks ran)";

  const nameWidth = Math.max(7, ...results.map((r) => r.name.length));
  const statusWidth = 4;

  const header = `${"SERVICE".padEnd(nameWidth)}  ${"STAT".padEnd(statusWidth)}  DETAIL`;
  const rule = "-".repeat(header.length);

  const rows = results.map((r) => {
    const latency = r.latencyMs === undefined ? "" : `  (${r.latencyMs}ms)`;
    return `${r.name.padEnd(nameWidth)}  ${r.status.padEnd(statusWidth)}  ${r.detail}${latency}`;
  });

  return [header, rule, ...rows].join("\n");
}

export function formatRequiredEnvSection(state: RequiredEnvState): string {
  const lines = Object.entries(state).map(([name, info]) =>
    info.present
      ? `  [set]     ${name}  (from ${info.source ?? "environment"})`
      : `  [MISSING] ${name}`,
  );

  const missing = Object.entries(state)
    .filter(([, info]) => !info.present)
    .map(([name]) => name);

  if (missing.length > 0) {
    lines.push(
      "",
      `  ! ${missing.join(", ")} required by backend/src/config/env.ts (envalid).`,
      "  ! The API and worker will crash at boot until these are set.",
    );
  }

  return lines.join("\n");
}
