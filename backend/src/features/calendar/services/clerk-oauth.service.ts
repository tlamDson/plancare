/**
 * Clerk OAuth Service
 *
 * Retrieves Google access tokens from Clerk API for a given user.
 * Requires user to have signed in with Google OAuth.
 */

import axios from "axios";
import { env } from "../../../config/env";
import { logger } from "../../../lib/logger";

const CLERK_API = "https://api.clerk.com/v1";
// Clerk provider name for Google OAuth
const GOOGLE_PROVIDER = "oauth_google";

export interface ClerkOAuthToken {
  token: string;
  strategy: string;
  provider: string;
  scopes: string[];
}

/**
 * Get Google OAuth access token from Clerk for a given Clerk user ID.
 * Returns null if the user has not connected their Google account.
 */
export async function getGoogleAccessToken(
  clerkUserId: string,
): Promise<string | null> {
  try {
    const res = await axios.get(
      `${CLERK_API}/users/${clerkUserId}/oauth_access_tokens/${GOOGLE_PROVIDER}`,
      {
        headers: {
          Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
        },
      },
    );

    const tokens: ClerkOAuthToken[] = res.data;
    if (!tokens?.length) {
      logger.warn(
        { clerkUserId },
        "No Google OAuth token found for user — not connected",
      );
      return null;
    }

    return tokens[0]!.token;
  } catch (err: any) {
    // 404 = user hasn't connected Google, not an error we need to alert on
    if (err?.response?.status === 404) {
      logger.info(
        { clerkUserId },
        "User has not connected Google account to Clerk",
      );
      return null;
    }
    logger.error(
      { err: err.message, clerkUserId },
      "Failed to get Google OAuth token from Clerk",
    );
    return null;
  }
}
