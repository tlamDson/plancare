import { createQueue } from "../../../lib/queue";
import { logger } from "../../../lib/logger";
import { tripRepository } from "../repositories/trip.repository";
import { TripPreferences } from "../schemas/trip-request.schema";

const tripQueue = createQueue("trip-generation");

type JobStatus = "IDLE" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

const JOB_STATE_TO_STATUS: Record<string, JobStatus> = {
  completed: "COMPLETED",
  failed: "FAILED",
  active: "PROCESSING",
  waiting: "QUEUED",
  delayed: "QUEUED",
  paused: "QUEUED",
  "waiting-children": "QUEUED",
  prioritized: "QUEUED",
};

export function mapJobState(state: string): JobStatus {
  return JOB_STATE_TO_STATUS[state] ?? "IDLE";
}

export function normalizeProgress(progress: unknown): {
  percent: number;
  currentStep?: string;
} {
  if (typeof progress === "number") {
    return { percent: progress };
  }

  if (progress && typeof progress === "object") {
    const data = progress as { percent?: number; currentStep?: string };
    const percent = typeof data.percent === "number" ? data.percent : 0;
    if (typeof data.currentStep === "string") {
      return { percent, currentStep: data.currentStep };
    }
    return { percent };
  }

  return { percent: 0 };
}

/**
 * Get job status (for polling)
 */
export async function getJobStatusForUser(jobId: string, userId: string) {
  const job = await tripQueue.getJob(jobId);
  if (!job) {
    // If the job is missing from BullMQ (e.g. cancelled/discarded), check DB
    // We assume the caller knows the trip ID, or we fall back to searching by agentJobId
    const trip = await tripRepository.findByJobId(jobId);
    if (trip && trip.userId === userId && trip.status === "CANCELLED") {
      return {
        jobId,
        status: "CANCELLED",
        progress: 0,
        currentStep: "User cancelled the request",
        result: null,
        error: null,
        createdAt: trip.createdAt.toISOString(),
        updatedAt: trip.updatedAt.toISOString(),
      };
    }
    return null;
  }

  const jobUserId = (job.data as { userId?: string })?.userId;
  if (jobUserId && jobUserId !== userId) {
    throw new Error("FORBIDDEN_JOB_ACCESS");
  }

  const state = await job.getState();
  const { percent, currentStep } = normalizeProgress(job.progress);
  const status = mapJobState(state);
  const error =
    state === "failed" ? job.failedReason || "Job failed" : undefined;
  const result = state === "completed" ? job.returnvalue : undefined;

  return {
    jobId: String(job.id),
    status,
    progress: percent,
    currentStep,
    result,
    error,
    createdAt: new Date(job.timestamp).toISOString(),
    updatedAt: new Date(
      job.finishedOn ?? job.processedOn ?? job.timestamp,
    ).toISOString(),
  };
}

/**
 * Retry a failed job
 */
export async function retryTripJobForUser(jobId: string, userId: string) {
  const job = await tripQueue.getJob(jobId);
  if (!job) return null;

  const jobUserId = (job.data as { userId?: string })?.userId;
  if (jobUserId && jobUserId !== userId) {
    throw new Error("FORBIDDEN_JOB_ACCESS");
  }

  const state = await job.getState();
  if (state !== "failed") {
    throw new Error("JOB_NOT_FAILED");
  }

  const { tripId, preferences, language } = job.data as {
    tripId?: string;
    preferences?: TripPreferences;
    language?: string;
  };

  if (!tripId || !preferences) {
    throw new Error("JOB_DATA_INVALID");
  }

  const trip = await tripRepository.findById(tripId);
  if (!trip) {
    throw new Error("TRIP_NOT_FOUND");
  }

  const newJob = await tripQueue.add(job.name, {
    userId,
    tripId,
    preferences,
    language,
  });

  // forceAcquireLock: overwrite stale lock from previous failed job
  const lockedTrip = await tripRepository.forceAcquireLock(
    trip._id,
    newJob.id as string,
  );
  if (!lockedTrip) {
    throw new Error("TRIP_LOCKED");
  }

  await tripRepository.updateStatus(trip._id, "QUEUED");

  logger.info(
    { jobId: newJob.id, tripId: trip._id, userId },
    "Trip retry job queued",
  );

  return {
    jobId: newJob.id as string,
    tripId: trip._id.toString(),
  };
}

/**
 * Cancel a pending/processing job
 */
export async function cancelTripJobForUser(jobId: string, userId: string) {
  const job = await tripQueue.getJob(jobId);

  if (job) {
    const jobUserId = (job.data as { userId?: string })?.userId;
    if (jobUserId && jobUserId !== userId) {
      throw new Error("FORBIDDEN_JOB_ACCESS");
    }

    const state = await job.getState();
    if (state === "completed" || state === "failed") {
      throw new Error("JOB_ALREADY_FINISHED");
    }

    const { tripId } = job.data as { tripId?: string };

    // Attempt to discard/remove the job from BullMQ
    try {
      await job.remove();
    } catch (e) {
      logger.warn(
        { jobId, error: e },
        "Failed to remove job from queue, attempting to discard",
      );
      await job.discard();
    }

    if (tripId) {
      const trip = await tripRepository.findById(tripId);
      if (trip && trip.userId === userId) {
        await tripRepository.updateStatus(trip._id, "CANCELLED");
        await tripRepository.releaseLock(trip._id, jobId);
        logger.info({ jobId, tripId }, "Trip generation cancelled via job");
        return { success: true };
      }
    }
  } else {
    // If job isn't in queue but is still locked in DB, unlock and cancel
    const trip = await tripRepository.findByJobId(jobId);
    if (trip && trip.userId === userId) {
      await tripRepository.updateStatus(trip._id, "CANCELLED");
      await tripRepository.releaseLock(trip._id, jobId);
      logger.info(
        { jobId, tripId: trip._id },
        "Trip generation cancelled via fallback DB lookup",
      );
      return { success: true };
    }
  }

  throw new Error("JOB_NOT_FOUND");
}

/**
 * Cancel a pending/processing trip by tripId
 */
export async function cancelTripForUser(tripId: string, userId: string) {
  const trip = await tripRepository.findById(tripId);
  if (!trip) {
    throw new Error("TRIP_NOT_FOUND");
  }
  if (trip.userId !== userId) {
    throw new Error("FORBIDDEN_TRIP_ACCESS");
  }
  if (!trip.isAgentProcessing) {
    throw new Error("TRIP_NOT_PROCESSING");
  }

  // If there's an agentJobId, try to remove from BullMQ
  if (trip.agentJobId) {
    const job = await tripQueue.getJob(trip.agentJobId);
    if (job) {
      try {
        await job.remove();
      } catch (e) {
        logger.warn(
          { jobId: trip.agentJobId, error: e },
          "Failed to remove job from queue, attempting to discard",
        );
        await job.discard();
      }
    }
  }

  // Update trip status to CANCELLED and release lock
  await tripRepository.updateStatus(trip._id, "CANCELLED");
  await tripRepository.releaseLock(trip._id, trip.agentJobId || "");
  logger.info(
    { tripId, agentJobId: trip.agentJobId },
    "Trip generation cancelled via tripId fallback",
  );

  return { success: true };
}

/**
 * Get trip by ID (for polling)
 */
export async function getTripByIdFromRepo(tripId: string) {
  return tripRepository.findById(tripId);
}

/**
 * Get user's trips
 */
export async function getUserTripsList(
  userId: string,
  options?: { status?: string; limit?: number },
) {
  return tripRepository.findByUserId(userId, options);
}
