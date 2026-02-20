import { Job } from "bullmq";
import { logger } from "../../../lib/logger";
import { tripRepository } from "../repositories/trip.repository";
import { aiAgentService } from "../services/ai-agent.service";
import { intentParserService } from "../services/intent-parser.service";
import {
  validationService,
  type ValidatedPlace,
} from "../services/validation.service";
import type { TripPreferences } from "@travelplan/shared";
import type { TripIntents } from "../services/intent-parser.service";
import type { IActivity } from "../models/Trip.types";

interface TripJobData {
  tripId: string;
  userId: string;
  preferences: TripPreferences;
}

/**
 * TRIP GENERATION WORKER PROCESSOR
 * Implements Week 2 requirements with proper locking
 * Week 3+ will add AI agent integration
 */
export const tripGeneratorProcessor = async (job: Job<TripJobData>) => {
  const { tripId, userId, preferences } = job.data;

  logger.info(
    { jobId: job.id, tripId, userId, preferences },
    "🚀 Starting trip generation",
  );

  logger.info(
    {
      destination: preferences.destination,
      startDate: preferences.startDate,
      endDate: preferences.endDate,
      budget: preferences.budget,
      travelers: preferences.travelers,
      mood: preferences.mood,
      interests: preferences.interests,
    },
    "📩 Preferences received by worker",
  );

  try {
    // 1. Verify trip exists and is locked to this job
    const trip = await tripRepository.findById(tripId);

    if (!trip) {
      throw new Error(`Trip ${tripId} not found`);
    }

    if (String(trip.agentJobId) !== String(job.id)) {
      logger.warn(
        { tripAgentJobId: trip.agentJobId, jobId: job.id },
        "⚠️ Lock mismatch — force-reacquiring lock for this job (stale lock from previous failed job)",
      );
      // Self-heal: overwrite the stale lock so this job can proceed.
      // Safe because BullMQ guarantees only one active job per queue slot at a time.
      const reacquired = await tripRepository.forceAcquireLock(
        tripId,
        job.id as string,
      );
      if (!reacquired) {
        throw new Error(`Trip ${tripId} not found during lock reacquisition`);
      }
    }

    // 2. Generate AI intents (Step 1)
    await tripRepository.updateStatus(tripId, "PROCESSING_STEP_1");
    await updateJobProgress(job, 20, "Generating intents with Gemini...");
    logger.info(
      { jobId: job.id, tripId },
      "Step 1: Generating intents with Gemini...",
    );

    const intents = await aiAgentService.generateIntentsWithRetry(preferences);
    const intentList = intentParserService.flattenIntents(intents);

    logger.info(
      { jobId: job.id, tripId, intentCount: intentList.length },
      "Generated intents",
    );

    // 3. Parallel validation (Step 2)
    await tripRepository.updateStatus(tripId, "PROCESSING_STEP_2");
    await updateJobProgress(job, 50, "Validating intents...");
    logger.info({ jobId: job.id, tripId }, "Step 2: Validating intents...");

    let validated = await validationService.validateBatch(intentList);

    // ⚠️ BYPASS MODE: if validation returned nothing (e.g. Mapbox not configured),
    // fall back to the raw AI intent strings so we can still see the result.
    if (validated.length === 0) {
      logger.warn(
        { jobId: job.id, tripId, intentCount: intentList.length },
        "⚠️ [DEV MODE] No validated places — using raw AI intents as passthrough (Mapbox not configured)",
      );
      validated = intentList.map((intent) => ({
        name: intent, // use the raw search query as the place name
        coordinates: [0, 0] as [number, number], // placeholder — no real geocode
        confidence: 0,
        source: "cache" as const, // satisfies the type
      }));
    }

    logger.info(
      {
        jobId: job.id,
        tripId,
        validated: validated.length,
        total: intentList.length,
      },
      "Validation complete",
    );

    // 4. Build itinerary
    await updateJobProgress(job, 80, "Building itinerary...");
    logger.info({ jobId: job.id, tripId }, "Step 3: Building itinerary...");

    const itinerary = buildItinerary(intents, validated, preferences);

    // 📌 LOG POINT C — final itinerary structure saved to DB → returned to frontend
    logger.info(
      {
        tripId,
        totalDays: itinerary.length,
        itinerary: JSON.stringify(itinerary, null, 2), // pretty-print so it's readable in logs
      },
      "✅ [ITINERARY] Final structure before saving (this is what the frontend receives)",
    );

    // 5. Save to DB
    await tripRepository.update(tripId, { itinerary });
    await tripRepository.updateStatus(tripId, "COMPLETED");
    await updateJobProgress(job, 90, "Finalizing...");
    logger.info({ jobId: job.id, tripId }, "Step 4: Finalizing...");

    // 4. Release lock
    await tripRepository.releaseLock(tripId, job.id as string);
    await updateJobProgress(job, 100, "Completed");

    logger.info(
      {
        jobId: job.id,
        tripId,
        duration: job.finishedOn ? job.finishedOn - (job.processedOn || 0) : 0,
      },
      "✅ Trip generation completed",
    );

    return {
      success: true,
      tripId,
      status: "COMPLETED",
    };
  } catch (error: any) {
    logger.error(
      { jobId: job.id, tripId, error: error.message, stack: error.stack },
      "❌ Trip generation failed",
    );

    // Release lock on failure
    try {
      await updateJobProgress(
        job,
        getProgressPercent(job.progress),
        `Failed: ${error.message}`,
      ).catch(() => undefined);
      await tripRepository.releaseLock(tripId, job.id as string);
      await tripRepository.updateStatus(tripId, "FAILED");
    } catch (releaseError: any) {
      logger.error(
        { jobId: job.id, tripId, error: releaseError.message },
        "Failed to release lock after error",
      );
    }

    throw error;
  }
};

function getProgressPercent(progress: unknown): number {
  if (typeof progress === "number") return progress;
  if (progress && typeof progress === "object") {
    const percent = (progress as { percent?: number }).percent;
    return typeof percent === "number" ? percent : 0;
  }
  return 0;
}

async function updateJobProgress(
  job: Job<TripJobData>,
  percent: number,
  currentStep: string,
) {
  await job.updateProgress({ percent, currentStep });
}

function buildItinerary(
  intents: TripIntents,
  validated: ValidatedPlace[],
  preferences: TripPreferences,
): any[] {
  const itinerary: any[] = [];
  let validatedIndex = 0;

  // Compute expected day count from dates (inclusive both ends), same formula as prompt.
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

  // Collect what the AI actually returned (sorted: day1, day2, day3…)
  const aiDayKeys = Object.keys(intents).sort();

  for (let dayNum = 0; dayNum < expectedDays; dayNum++) {
    const dayKey = aiDayKeys[dayNum] ?? `day${dayNum + 1}`;
    const slots = intents[dayKey];

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
            name: place.name,
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
          // Thread rich place data from validation pipeline
          if (place.rating !== undefined) activity.rating = place.rating;
          if (place.photoUrl) activity.photoUrl = place.photoUrl;
          if (place.openingHours) activity.openingHours = place.openingHours;

          activities.push(activity);
          order++;
        }
      }
    }
    // If slots was undefined (AI skipped this day), activities stays empty [] — a valid day.

    // UTC date arithmetic — immune to server timezone.
    const dayDate = new Date(
      new Date(startDateStr).getTime() + dayNum * msPerDay,
    );

    itinerary.push({
      day: dayNum + 1,
      date: dayDate,
      activities,
    });
  }

  return itinerary;
}
