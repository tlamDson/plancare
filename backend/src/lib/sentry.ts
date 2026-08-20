import * as Sentry from "@sentry/node";
import { env, appEnv } from "../config/env";

/**
 * Initializes Sentry for this process, tagged `service` so API and worker
 * errors can be told apart in the dashboard — same convention as the
 * `service` field on Pino log lines (see lib/logger.ts). No-ops when
 * SENTRY_DSN is unset (every environment today) so this is safe to call
 * unconditionally at boot.
 */
export function initSentry(service: "api" | "worker"): void {
  if (!env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: appEnv,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    initialScope: { tags: { service } },
  });
}

export { Sentry };
