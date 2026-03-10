/**
 * Google Calendar Service
 *
 * Handles the actual sync of TravelPlan events to Google Calendar.
 * Implements:
 *   - Idempotency: POST if new, PUT if exists
 *   - Orphan cleanup: DELETE events removed from the trip
 *   - Partial failure resistance: saves DB state after each chunk
 *   - Rate limit avoidance: processes in chunks of 10
 */

import { logger } from "../../../lib/logger";
import type { EventWithKey } from "./calendar-format.service";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary";
const CHUNK_SIZE = 10;

export interface SyncOptions {
  onChunkComplete?: (partialIds: Record<string, string>) => Promise<void>;
}

/**
 * Sync the full set of trip events to Google Calendar.
 * Returns the updated googleEventIds map (key = activity._id, value = Google eventId).
 */
export async function syncEventsToGoogle(
  accessToken: string,
  eventsWithKeys: EventWithKey[],
  existingIds: Record<string, string> | undefined,
  options?: SyncOptions,
): Promise<Record<string, string>> {
  const result: Record<string, string> = { ...(existingIds ?? {}) };
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // ── Step 1: DELETE orphaned events ─────────────────────────────────────────
  // Events present in existingIds but no longer in the payload (user deleted activity)
  const newKeys = new Set(eventsWithKeys.map((e) => e.key));
  const keysToDelete = Object.keys(existingIds ?? {}).filter(
    (k) => !newKeys.has(k),
  );

  if (keysToDelete.length > 0) {
    logger.info(
      { count: keysToDelete.length },
      "Deleting orphaned Google Calendar events",
    );

    for (const key of keysToDelete) {
      const googleEventId = existingIds![key]!;
      try {
        const deleteRes = await fetch(
          `${CALENDAR_API}/events/${googleEventId}`,
          {
            method: "DELETE",
            headers,
          },
        );
        if (!deleteRes.ok && deleteRes.status !== 410) {
          // 410 = already deleted on Google's side, safe to ignore
          logger.warn(
            { key, googleEventId, status: deleteRes.status },
            "Failed to delete orphaned event",
          );
        }
      } catch (err) {
        logger.warn(
          { err, key, googleEventId },
          "Error deleting orphaned event",
        );
      }
      delete result[key];
    }

    // Persist immediately after DELETE phase
    if (options?.onChunkComplete) {
      await options.onChunkComplete({ ...result });
    }
  }

  // ── Step 2: POST (create) or PUT (update) events in chunks ──────────────────
  for (let i = 0; i < eventsWithKeys.length; i += CHUNK_SIZE) {
    const chunk = eventsWithKeys.slice(i, i + CHUNK_SIZE);

    await Promise.all(
      chunk.map(async ({ key, event }) => {
        const existingGoogleId = existingIds?.[key];
        try {
          if (existingGoogleId) {
            // PUT — update existing event
            const res = await fetch(
              `${CALENDAR_API}/events/${existingGoogleId}`,
              {
                method: "PUT",
                headers,
                body: JSON.stringify(event),
              },
            );
            if (res.ok) {
              result[key] = existingGoogleId;
            } else {
              const errText = await res.text();
              logger.warn(
                { key, existingGoogleId, status: res.status, errText },
                "Failed to update Google Calendar event",
              );
            }
          } else {
            // POST — create new event
            const res = await fetch(`${CALENDAR_API}/events`, {
              method: "POST",
              headers,
              body: JSON.stringify(event),
            });
            if (res.ok) {
              const data = (await res.json()) as { id: string };
              result[key] = data.id;
            } else {
              const errText = await res.text();
              logger.warn(
                { key, status: res.status, errText },
                "Failed to create Google Calendar event",
              );
            }
          }
        } catch (err) {
          logger.error(
            { err, key },
            "Network error when syncing event to Google Calendar",
          );
        }
      }),
    );

    // Persist after every chunk — prevents duplicate creation on retry
    if (options?.onChunkComplete) {
      await options.onChunkComplete({ ...result });
    }
  }

  return result;
}
