/** Shared vocabulary for the external-service connectivity checks. */

export type CheckStatus = "OK" | "FAIL" | "SKIP";

export type CheckResult = {
  name: string;
  status: CheckStatus;
  /** Short, human-readable outcome. Must never contain a secret. */
  detail: string;
  latencyMs?: number;
};

/**
 * Raw environment as read from `process.env` — deliberately NOT the envalid
 * `env` object, so a missing key is reported rather than crashing the process.
 */
export type ServiceEnv = Record<string, string | undefined>;

export type Checker = (env: ServiceEnv) => Promise<CheckResult>;
