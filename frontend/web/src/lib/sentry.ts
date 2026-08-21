import * as Sentry from "@sentry/react";
import { SENTRY_DSN, ENV } from "@/config/env";

/**
 * Initializes Sentry for the browser, tagged `service: "web"` — same
 * `service` convention as backend's Pino logs and Sentry wiring (api/worker).
 * No-ops when VITE_SENTRY_DSN is unset (every environment today) so this is
 * safe to call unconditionally at app startup.
 */
export function initSentry(): void {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENV,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    initialScope: { tags: { service: "web" } },
  });
}

export { Sentry };
