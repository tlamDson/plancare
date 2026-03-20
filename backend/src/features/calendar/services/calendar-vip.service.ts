/**
 * VIP allowlist for Google Calendar sync (internal testers).
 * Backend source of truth — must match operational intent for VIP_EMAILS.
 */

import { env } from "../../../config/env";

function parseVipEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Empty list in production → nobody passes (forces explicit allowlist).
 * Empty list in development → allow all (local convenience).
 */
export function isVipEmailForCalendarSync(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const list = parseVipEmails(env.VIP_EMAILS);
  if (list.length === 0) {
    return env.NODE_ENV !== "production";
  }
  return list.includes(normalized);
}
