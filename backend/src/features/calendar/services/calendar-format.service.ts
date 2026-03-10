/**
 * Calendar Format Service
 *
 * Converts TravelPlan IItineraryDay[] into Google Calendar event format.
 * Uses activity._id as the idempotency key (Entity ID, not index) to avoid
 * Index Shifting issues when the user reorders activities.
 */

import type { IItineraryDay } from "../../planner/models/Trip.types";
import { getTimezoneForDestination } from "../data/destination-timezone";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { Types } from "mongoose";

const APP_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export interface GoogleCalendarEventInput {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: string;
}

export interface EventWithKey {
  /** activity._id.toString() — Entity ID, not index. Reorder-safe. */
  key: string;
  event: GoogleCalendarEventInput;
}

/**
 * Parse "HH:MM" or "H:MM" string into [hour, minute] tuple
 */
function parseTime(s: string): [number, number] {
  const m = s.match(/(\d{1,2}):(\d{2})/);
  return m ? [parseInt(m[1]!, 10), parseInt(m[2]!, 10)] : [9, 0];
}

/**
 * Convert the entire itinerary into a flat list of Google Calendar events,
 * each tagged with its activity._id as the idempotency key.
 */
export function itineraryToGoogleEvents(
  itinerary: IItineraryDay[],
  tripId: string,
  destination?: string,
  tripTitle?: string,
): EventWithKey[] {
  const tz = getTimezoneForDestination(destination);
  const events: EventWithKey[] = [];
  const tripLink = `${APP_URL}/trips/${tripId}`;
  const footer = `\n\n✨ Xem chi tiết chuyến đi: ${tripLink}`;

  for (let dayIdx = 0; dayIdx < itinerary.length; dayIdx++) {
    const day = itinerary[dayIdx]!;
    const dayDate = new Date(day.date);
    const y = dayDate.getUTCFullYear();
    const m = dayDate.getUTCMonth();
    const d = dayDate.getUTCDate();

    for (let actIdx = 0; actIdx < day.activities.length; actIdx++) {
      const act = day.activities[actIdx]!;

      // ✅ Entity ID as key — bất biến khi user reorder activities
      const actWithId = act as IItineraryDay["activities"][0] & {
        _id?: Types.ObjectId;
      };
      const key = actWithId._id?.toString();
      if (!key) {
        throw new Error(
          `Activity at day ${dayIdx} idx ${actIdx} is missing _id — cannot generate idempotency key`,
        );
      }

      const [startHour, startMin] = parseTime(act.time ?? "09:00");
      const [endHour, endMin] = act.endTime
        ? parseTime(act.endTime)
        : [startHour + 1, startMin];

      // Build a "local" Date in the destination timezone using date-fns-tz
      const startLocal = new Date(y, m, d, startHour, startMin, 0);
      const endLocal = new Date(y, m, d, endHour, endMin, 0);

      // Convert zoned "local" time → UTC instant → format back in tz for Google API
      const startUtc = fromZonedTime(startLocal, tz);
      const endUtc = fromZonedTime(endLocal, tz);

      const startStr = formatInTimeZone(startUtc, tz, "yyyy-MM-dd'T'HH:mm:ss");
      const endStr = formatInTimeZone(endUtc, tz, "yyyy-MM-dd'T'HH:mm:ss");

      const description = (act.notes ?? "") + footer;
      const location = act.location?.coordinates
        ? `${act.location.coordinates[1]},${act.location.coordinates[0]}`
        : undefined;

      events.push({
        key,
        event: {
          summary: act.name,
          description,
          start: { dateTime: startStr, timeZone: tz },
          end: { dateTime: endStr, timeZone: tz },
          ...(location && { location }),
        },
      });
    }
  }

  return events;
}
