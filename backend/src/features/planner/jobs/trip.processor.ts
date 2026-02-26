import { Job } from "bullmq";
import { logger } from "../../../lib/logger";
import { tripRepository } from "../repositories/trip.repository";
import { aiAgentService } from "../services/ai-agent.service";
import { intentParserService } from "../services/intent-parser.service";
import { validationService } from "../services/validation.service";
import type { TripPreferences } from "@travelplan/shared";
import type { TripIntents } from "../services/intent-parser.service";
import { CityCost } from "../models/CityCost";
import {
  buildItinerary,
  getProgressPercent,
  updateJobProgress,
} from "./itinerary-builder";

interface TripJobData {
  tripId: string;
  userId: string;
  preferences: TripPreferences;
  language?: string;
}

/**
 * TRIP GENERATION WORKER PROCESSOR
 * Fire-and-listen architecture: processes BullMQ jobs async.
 * Progress: 20% → 50% → 80% → 90% → 100%
 */
export const tripGeneratorProcessor = async (job: Job<TripJobData>) => {
  const { tripId, userId, preferences, language } = job.data;

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
        "⚠️ Lock mismatch — force-reacquiring lock",
      );
      const reacquired = await tripRepository.forceAcquireLock(
        tripId,
        job.id as string,
      );
      if (!reacquired) {
        throw new Error(`Trip ${tripId} not found during lock reacquisition`);
      }
    }

    // 2. Generate AI intents — Step 1 (20%)
    await tripRepository.updateStatus(tripId, "PROCESSING_STEP_1");
    await updateJobProgress(job, 20, "Generating intents with Gemini...");
    logger.info({ jobId: job.id, tripId }, "Step 1: Generating intents...");

    const destName =
      preferences.destination.split(",")[0] || preferences.destination;
    const cityCost = await CityCost.findOne({
      cityName: { $regex: new RegExp(destName, "i") },
    }).lean();

    if (cityCost) {
      logger.info(
        { cityId: cityCost.cityId, minFoodUSD: cityCost.minFoodUSD },
        "💰 Found Base Costs for destination",
      );
    }

    const intents = await aiAgentService.generateIntentsWithRetry(
      preferences,
      language,
      cityCost || undefined,
    );
    const intentList = intentParserService.flattenIntents(intents);
    logger.info(
      { jobId: job.id, tripId, intentCount: intentList.length },
      "Generated intents",
    );

    // 3. Parallel validation — Step 2 (50%)
    await tripRepository.updateStatus(tripId, "PROCESSING_STEP_2");
    await updateJobProgress(job, 50, "Validating intents...");
    logger.info({ jobId: job.id, tripId }, "Step 2: Validating intents...");

    let validated = await validationService.validateBatch(intentList);

    if (validated.length === 0) {
      logger.warn(
        { jobId: job.id, tripId, intentCount: intentList.length },
        "⚠️ [DEV MODE] No validated places — using raw AI intents as passthrough",
      );
      validated = intentList.map((intent) => ({
        name: intent,
        coordinates: [0, 0] as [number, number],
        confidence: 0,
        source: "cache" as const,
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

    // 4. Build itinerary (80%)
    await updateJobProgress(job, 80, "Building itinerary...");
    logger.info({ jobId: job.id, tripId }, "Step 3: Building itinerary...");

    const itinerary = buildItinerary(
      intents as TripIntents,
      validated,
      preferences,
    );
    logger.info(
      { tripId, totalDays: itinerary.length },
      "✅ [ITINERARY] Final structure before saving",
    );

    // 5. Save & complete (90% → 100%)
    await tripRepository.update(tripId, { itinerary });
    await tripRepository.updateStatus(tripId, "COMPLETED");
    await updateJobProgress(job, 90, "Finalizing...");
    logger.info({ jobId: job.id, tripId }, "Step 4: Finalizing...");

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

    return { success: true, tripId, status: "COMPLETED" };
  } catch (error: any) {
    logger.error(
      { jobId: job.id, tripId, error: error.message, stack: error.stack },
      "❌ Trip generation failed",
    );

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
