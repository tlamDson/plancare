import { Job } from "bullmq";
import sanitizeHtml from "sanitize-html";
import type { TripIntents } from "../services/intent-parser.service";
import type { ValidatedPlace } from "../services/validation.service";
import type { TripPreferences } from "@travelplan/shared";
import type { IActivity } from "../models/Trip.types";

interface TripJobData {
  tripId: string;
  userId: string;
  preferences: TripPreferences;
  language?: string;
}

export function getProgressPercent(progress: unknown): number {
  if (typeof progress === "number") return progress;
  if (progress && typeof progress === "object") {
    const percent = (progress as { percent?: number }).percent;
    return typeof percent === "number" ? percent : 0;
  }
  return 0;
}

export async function updateJobProgress(
  job: Job<TripJobData>,
  percent: number,
  currentStep: string,
) {
  await job.updateProgress({ percent, currentStep });
}

export function buildItinerary(
  intents: TripIntents,
  validated: ValidatedPlace[],
  preferences: TripPreferences,
): any[] {
  const itinerary: any[] = [];
  let validatedIndex = 0;

  const startDateStr = new Date(preferences.startDate)
    .toISOString()
    .slice(0, 10);
  const endDateStr = new Date(preferences.endDate).toISOString().slice(0, 10);
  const msPerDay = 1000 * 60 * 60 * 24;
  const expectedDays =
    Math.round(
      (new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) /
        msPerDay,
    ) + 1;

  const aiDayKeys = Object.keys(intents).sort();

  for (let dayNum = 0; dayNum < expectedDays; dayNum++) {
    const dayKey = aiDayKeys[dayNum] ?? `day${dayNum + 1}`;
    const slots = intents[dayKey];

    const dayDate = new Date(
      new Date(startDateStr).getTime() + dayNum * msPerDay,
    );

    const activities: IActivity[] = [];
    let order = 0;

    if (slots) {
      for (const slot of ["morning", "afternoon", "evening"] as const) {
        const query = slots[slot as keyof typeof slots];
        if (!query) continue;

        const place = validated[validatedIndex];
        validatedIndex = (validatedIndex + 1) % Math.max(validated.length, 1);

        if (place) {
          const activity: IActivity = {
            type: "poi",
            name: sanitizeHtml(place.name, {
              allowedTags: [],
              allowedAttributes: {},
            }),
            location: {
              type: "Point",
              coordinates: place.coordinates,
            },
            time:
              slot === "morning"
                ? "09:00"
                : slot === "afternoon"
                  ? "14:00"
                  : "19:00",
            status: "planned",
            order,
          };
          if (place.googlePlaceId) {
            activity.location!.googlePlaceId = place.googlePlaceId;
          }
          if (place.rating !== undefined) activity.rating = place.rating;
          if (place.priceLevel !== undefined)
            activity.priceLevel = place.priceLevel;
          if (place.photoUrl) activity.photoUrl = place.photoUrl;

          if (place.openingHoursArray && place.openingHoursArray.length > 0) {
            const dayJs = dayDate.getDay();
            const googleIdx = dayJs === 0 ? 6 : dayJs - 1;
            const entry = place.openingHoursArray[googleIdx];
            if (entry) {
              const colonIdx = entry.indexOf(":");
              activity.openingHours =
                colonIdx !== -1 ? entry.slice(colonIdx + 1).trim() : entry;
            }
          } else if (place.openingHours) {
            activity.openingHours = place.openingHours;
          }

          activities.push(activity);
          order++;
        }
      }
    }
    itinerary.push({ day: dayNum + 1, date: dayDate, activities });
  }

  return itinerary;
}
