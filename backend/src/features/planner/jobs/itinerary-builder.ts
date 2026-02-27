import { Job } from "bullmq";
import sanitizeHtml from "sanitize-html";
import type { TripIntents } from "../services/intent-parser.service";
import type { ValidatedPlace } from "../services/validation.service";
import type { TripPreferences } from "@travelplan/shared";
import type { IActivity } from "../models/Trip.types";
import { geoValidatorService } from "../services/geo-validator.service";
import { nearbyFoodService } from "../services/nearby-food.service";
import type { TransportMode } from "../services/geo-validator.service";

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

// ─── Dynamic time slots based on activitiesPerDay ─────────────────────────
// Generates slot names for 2–6 activities per day.
function generateTimeSlots(count: number): string[] {
  const allSlots = [
    "morning",
    "late morning",
    "afternoon",
    "late afternoon",
    "evening",
    "night",
  ];
  // Always start from "morning", take `count` evenly spaced slots
  if (count <= 2) return ["morning", "evening"];
  if (count === 3) return ["morning", "afternoon", "evening"];
  if (count === 4) return ["morning", "late morning", "afternoon", "evening"];
  if (count === 5)
    return [
      "morning",
      "late morning",
      "afternoon",
      "late afternoon",
      "evening",
    ];
  return allSlots; // 6
}

// Default start times mapped to slot names
const SLOT_START_TIMES: Record<string, string> = {
  morning: "09:00",
  "late morning": "11:30",
  afternoon: "14:00",
  "late afternoon": "16:30",
  evening: "19:00",
  night: "21:00",
};

export async function buildItinerary(
  intents: TripIntents,
  validated: ValidatedPlace[],
  preferences: TripPreferences,
): Promise<any[]> {
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

  const activitiesPerDay = preferences.activitiesPerDay ?? 3;
  const transportMode: TransportMode =
    (preferences.transportMode as TransportMode) ?? "walking";
  const timeSlots = generateTimeSlots(activitiesPerDay);

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
      // Use dynamic slot list — falls back to available intent keys
      const slotKeys = Object.keys(slots);

      for (const slot of timeSlots) {
        // Map custom slot names to the AI's keys (morning/afternoon/evening)
        const aiSlotKey =
          slot === "morning" || slot === "late morning"
            ? "morning"
            : slot === "afternoon" || slot === "late afternoon"
              ? "afternoon"
              : "evening";

        const query = slots[aiSlotKey as keyof typeof slots];
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
            time: SLOT_START_TIMES[slot] ?? "09:00",
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

          // ─── Nearby food suggestions ─────────────────────────────────────
          // Fire-and-forget with cache: costs 0 API calls on cache hit
          try {
            const anchorArg: {
              coordinates: [number, number];
              name: string;
              googlePlaceId?: string;
            } = {
              coordinates: place.coordinates,
              name: place.name,
            };
            if (place.googlePlaceId)
              anchorArg.googlePlaceId = place.googlePlaceId;

            const food = await nearbyFoodService.getNearbyFood(
              anchorArg,
              transportMode,
            );
            if (food.length > 0) {
              (activity as any).nearbySuggestions = food;
            }
          } catch {
            // Non-blocking: nearby food suggestions are best-effort
          }

          activities.push(activity);
          order++;
        }
      }
    }

    // ─── Distance validation between consecutive activities ───────────────
    // Flags activities that are too far apart for the chosen transport mode
    for (let i = 1; i < activities.length; i++) {
      const prev = activities[i - 1];
      const curr = activities[i];
      if (!prev || !curr) continue;
      const prevCoords = prev.location?.coordinates;
      const currCoords = curr.location?.coordinates;
      if (
        prevCoords?.length === 2 &&
        currCoords?.length === 2 &&
        (prevCoords[0] !== 0 || prevCoords[1] !== 0) &&
        (currCoords[0] !== 0 || currCoords[1] !== 0)
      ) {
        const { requiresTransport } = geoValidatorService.validateDistance(
          prevCoords as [number, number],
          currCoords as [number, number],
          transportMode,
        );
        (curr as any).requiresTransport = requiresTransport;
      }
    }

    itinerary.push({ day: dayNum + 1, date: dayDate, activities });
  }

  return itinerary;
}
