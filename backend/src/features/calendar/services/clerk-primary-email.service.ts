/**
 * Fetch Clerk user's primary email via Clerk REST API (server-side).
 */

import axios from "axios";
import { env } from "../../../config/env";
import { logger } from "../../../lib/logger";

const CLERK_API = "https://api.clerk.com/v1";

type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkUserResponse = {
  primary_email_address_id?: string | null;
  email_addresses?: ClerkEmailAddress[];
};

/**
 * Returns lowercased primary email, or first verified email, or null.
 */
export async function getClerkUserPrimaryEmail(
  clerkUserId: string,
): Promise<string | null> {
  try {
    const res = await axios.get<ClerkUserResponse>(
      `${CLERK_API}/users/${clerkUserId}`,
      {
        headers: {
          Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
        },
      },
    );

    const emails = res.data?.email_addresses ?? [];
    if (emails.length === 0) {
      return null;
    }

    const primaryId = res.data?.primary_email_address_id;
    const primary = primaryId
      ? emails.find((e) => e.id === primaryId)
      : undefined;
    const chosen = primary ?? emails[0];
    return chosen?.email_address?.trim().toLowerCase() ?? null;
  } catch (err: unknown) {
    logger.error(
      { err, clerkUserId },
      "Failed to fetch Clerk user email for calendar VIP check",
    );
    return null;
  }
}
