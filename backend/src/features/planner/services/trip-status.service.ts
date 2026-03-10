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
  if (!job) return null;

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
