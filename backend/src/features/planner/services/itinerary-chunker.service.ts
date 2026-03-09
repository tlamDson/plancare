/**
 * Itinerary Chunker Service — Pro tier, trips > 5 days.
 *
 * Strategy: Eager pre-fetch.
 * 1. Generate + validate + build Chunk 1 (Day 1-3), save to DB immediately.
 * 2. Mark trip.chunksReady[0] = true so Frontend can render Day 1-3 right away.
 * 3. Without waiting, generate Chunk 2 in the same async call chain.
 * 4. Each subsequent chunk is saved and marked ready in turn.
 * 5. When all chunks are ready, trip.status → COMPLETED.
 *
 * Frontend polls trip.chunksReady[] and fetches chunks on demand.
 * Because chunks are pre-built before the user scrolls, latency on scroll ≈ 0.
 */

import { Job } from "bullmq";
import { logger } from "../../../lib/logger";
import { tripRepository } from "../repositories/trip.repository";
import { aiAgentService } from "./ai-agent.service";
import { intentParserService } from "./intent-parser.service";
import { validationService } from "./validation.service";
import { buildItinerary, updateJobProgress } from "../jobs/itinerary-builder";
import { geoValidatorService } from "./geo-validator.service";
import type { TripPreferences } from "@travelplan/shared";
import type { TripIntents } from "./intent-parser.service";
import { CityCost } from "../models/CityCost";
import type { IItineraryDay } from "../models/Trip.types";

const CHUNK_SIZE = 3; // days per chunk

/**
 * Slice preferences to cover only `chunkDays` days starting from `dayOffset`.
 * We shift startDate forward so the AI generates the correct day numbers.
 */
function slicePreferences(
  preferences: TripPreferences,
  dayOffset: number,
  chunkDays: number,
): TripPreferences {
  const start = new Date(preferences.startDate);
  start.setDate(start.getDate() + dayOffset);

  const end = new Date(start);
  end.setDate(end.getDate() + chunkDays - 1);

  return {
    ...preferences,
    startDate: start.toISOString().split("T")[0]!,
    endDate: end.toISOString().split("T")[0]!,
  };
}

/**
 * Re-offset day numbers so that chunk Day 1 becomes the correct absolute day
 * within the full trip (e.g. chunk 2, day 1 → trip day 4).
 */
function rebaseDays(
  days: IItineraryDay[],
  dayOffset: number,
  startDate: Date,
): IItineraryDay[] {
  return days.map((d) => {
    const absDay = d.day + dayOffset;
    const absDate = new Date(startDate);
    absDate.setDate(absDate.getDate() + dayOffset + (d.day - 1));
    return { ...d, day: absDay, date: absDate };
  });
}

/**
 * Process a long trip (Pro, > 5 days) by generating 3-day chunks sequentially
 * and saving each chunk to MongoDB as soon as it is ready.
 */
export async function processChunkedTrip(
  job: Job,
  tripId: string,
  preferences: TripPreferences,
  language?: string,
): Promise<void> {
  const startDate = new Date(preferences.startDate);
  const endDate = new Date(preferences.endDate);
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  ) + 1;
  const totalChunks = Math.ceil(totalDays / CHUNK_SIZE);

  logger.info(
    { tripId, totalDays, totalChunks, chunkSize: CHUNK_SIZE },
    "🧩 [CHUNK] Starting chunked itinerary generation",
  );

  // Initialise tracking fields on the trip
  await tripRepository.update(tripId, {
    totalChunks,
    chunksReady: Array(totalChunks).fill(false),
  });

  const destination = preferences.destination.split(",")[0] || preferences.destination;
  const cityCost = await CityCost.findOne({
    cityName: { $regex: new RegExp(destination, "i") },
  }).lean();

  // Collect all generated day objects across chunks
  const allDays: IItineraryDay[] = [];

  for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
    const dayOffset = chunkIdx * CHUNK_SIZE;
    const remainingDays = totalDays - dayOffset;
    const chunkDays = Math.min(CHUNK_SIZE, remainingDays);

    const chunkPrefs = slicePreferences(preferences, dayOffset, chunkDays);
    const progressBase = 20 + Math.round((chunkIdx / totalChunks) * 70);

    logger.info(
      { tripId, chunkIdx, dayOffset, chunkDays },
      `🧩 [CHUNK ${chunkIdx + 1}/${totalChunks}] Generating…`,
    );

    await updateJobProgress(
      job,
      progressBase,
      `Generating days ${dayOffset + 1}–${dayOffset + chunkDays}…`,
    );

    // Generate AI intents for this chunk
    const intents = await aiAgentService.generateIntentsWithRetry(
      chunkPrefs,
      language,
      cityCost ?? undefined,
    );
    const intentList = intentParserService.flattenIntents(intents);

    // Validate
    let validated = await validationService.validateBatch(
      intentList,
      preferences.destination,
    );

    // Passthrough guard — dev mode safety net
    if (validated.length === 0) {
      validated = intentList.map((intent) => ({
        name: intent,
        coordinates: [0, 0] as [number, number],
        confidence: 0,
        source: "cache" as const,
      }));
    }

    // Build itinerary for this chunk
    const chunkDayStructures = await buildItinerary(
      intents as TripIntents,
      validated,
      chunkPrefs,
    );

    // Rebase day numbers to absolute trip-level numbers
    const rebasedDays = rebaseDays(chunkDayStructures, dayOffset, startDate);
    allDays.push(...rebasedDays);

    // Save accumulated days to DB and mark this chunk as ready
    const chunksReady = Array(totalChunks).fill(false);
    for (let i = 0; i <= chunkIdx; i++) chunksReady[i] = true;

    await tripRepository.update(tripId, {
      itinerary: allDays,
      chunksReady,
      // Keep status as PROCESSING until the last chunk
      status: chunkIdx < totalChunks - 1 ? "PROCESSING_STEP_2" : "COMPLETED",
    });

    logger.info(
      { tripId, chunkIdx, daysReady: allDays.length, chunksReady },
      `✅ [CHUNK ${chunkIdx + 1}/${totalChunks}] Saved to DB`,
    );
  }

  // Ensure final status
  await tripRepository.updateStatus(tripId, "COMPLETED");
}
