import { Job } from "bullmq";
import { logger } from "../../../lib/logger";
import { tripRepository } from "../repositories/trip.repository";

interface TripJobData {
  tripId: string;
  userId: string;
  preferences: any;
}

/**
 * TRIP GENERATION WORKER PROCESSOR
 * Implements Week 2 requirements with proper locking
 * Week 3+ will add AI agent integration
 */
export const tripGeneratorProcessor = async (job: Job<TripJobData>) => {
  const { tripId, userId, preferences } = job.data;
  
  logger.info(
    { jobId: job.id, tripId, userId },
    "🚀 Starting trip generation"
  );

  try {
    // 1. Verify trip exists and is locked to this job
    const trip = await tripRepository.findById(tripId);
    
    if (!trip) {
      throw new Error(`Trip ${tripId} not found`);
    }
    
    if (trip.agentJobId !== job.id) {
      throw new Error(`Trip ${tripId} is not locked to this job`);
    }

    // 2. Update status to PROCESSING_STEP_1
    await tripRepository.updateStatus(tripId, "PROCESSING_STEP_1");
    await job.updateProgress(10);
    
    logger.info({ jobId: job.id, tripId }, "Step 1: Initializing...");

    // ============================================
    // WEEK 3+: AI AGENT INTEGRATION GOES HERE
    // ============================================
    // TODO: Week 3 - Add Mapbox geocoding
    // TODO: Week 4 - Add AI intent generation
    // TODO: Week 4 - Add parallel validation
    
    // Placeholder: Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    await job.updateProgress(50);
    await tripRepository.updateStatus(tripId, "PROCESSING_STEP_2");
    
    logger.info({ jobId: job.id, tripId }, "Step 2: AI generation (placeholder)...");

    // Simulate more work
    await new Promise(resolve => setTimeout(resolve, 1000));
    await job.updateProgress(75);

    // 3. Finalize: Update trip status
    await tripRepository.updateStatus(tripId, "COMPLETED");
    await job.updateProgress(90);
    
    logger.info({ jobId: job.id, tripId }, "Step 3: Finalizing...");

    // 4. Release lock
    await tripRepository.releaseLock(tripId, job.id as string);
    await job.updateProgress(100);

    logger.info(
      { jobId: job.id, tripId, duration: job.finishedOn ? job.finishedOn - (job.processedOn || 0) : 0 },
      "✅ Trip generation completed"
    );

    return {
      success: true,
      tripId,
      status: "COMPLETED",
    };

  } catch (error: any) {
    logger.error(
      { jobId: job.id, tripId, error: error.message, stack: error.stack },
      "❌ Trip generation failed"
    );

    // Release lock on failure
    try {
      await tripRepository.releaseLock(tripId, job.id as string);
      await tripRepository.updateStatus(tripId, "FAILED");
    } catch (releaseError: any) {
      logger.error(
        { jobId: job.id, tripId, error: releaseError.message },
        "Failed to release lock after error"
      );
    }

    throw error;
  }
};
