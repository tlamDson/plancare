import { env } from "../../config/env";

/**
 * Dev-only admin endpoints (`/api/dev/toggle-pro`, `/api/dev/scrape-insights`)
 * are mounted only in local development — never reachable in test, staging,
 * or production, even before each controller's own
 * `env.NODE_ENV !== "development"` guard runs. Mirrors
 * `isCalendarSyncEnabled()` in features/calendar/calendar-feature-flag.ts.
 */
export function isDevRoutesEnabled(): boolean {
  return env.NODE_ENV === "development";
}
