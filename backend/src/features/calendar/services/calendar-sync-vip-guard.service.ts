/**
 * Decides whether a Clerk user may call calendar sync (VIP allowlist).
 */

import { getClerkUserPrimaryEmail } from "./clerk-primary-email.service";
import { isVipEmailForCalendarSync } from "./calendar-vip.service";

export type CalendarVipGuardResult =
  | { ok: true; email: string }
  | { ok: false; reason: "no_email" | "not_vip" };

export async function assertCalendarSyncVip(
  clerkUserId: string,
): Promise<CalendarVipGuardResult> {
  const email = await getClerkUserPrimaryEmail(clerkUserId);
  if (!email) {
    return { ok: false, reason: "no_email" };
  }
  if (!isVipEmailForCalendarSync(email)) {
    return { ok: false, reason: "not_vip" };
  }
  return { ok: true, email };
}
