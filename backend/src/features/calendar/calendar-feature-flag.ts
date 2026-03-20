import { env } from "../../config/env";

/**
 * Calendar sync API + worker jobs.
 * - `ENABLE_GOOGLE_CALENDAR_SYNC=true` → always on.
 * - `ENABLE_GOOGLE_CALENDAR_SYNC=false` → always off.
 * - Unset → on in development only (local convenience); off in production.
 */
export function isCalendarSyncEnabled(): boolean {
  const v = env.ENABLE_GOOGLE_CALENDAR_SYNC.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return env.NODE_ENV === "development";
}
