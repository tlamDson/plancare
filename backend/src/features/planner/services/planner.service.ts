import { createQueue } from "../../../lib/queue";
import { Job } from "bullmq";
import { logger } from "../../../lib/logger";
import { tripRepository } from "../repositories/trip.repository";
import { budgetValidatorService } from "./budget-validator.service";
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
};

function mapJobState(state: string): JobStatus {
  return JOB_STATE_TO_STATUS[state] ?? "IDLE";
}

function normalizeProgress(progress: unknown): {
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

interface GenerateTripParams {
  userId: string;
  preferences: TripPreferences;
}

export class PlannerService {
  /**
   * Create trip generation job with CFO validation
   */
  async createTripGenerationJob(
    params: GenerateTripParams,
  ): Promise<{ jobId: string; tripId: string }> {
    const { userId, preferences } = params;

    try {
      // 1. Parse dates
      const startDate = new Date(preferences.startDate);
      const endDate = new Date(preferences.endDate);

      // 2. VALIDATE DURATION (CFO Logic)
      const durationCheck = budgetValidatorService.validateDuration(
        startDate,
        endDate,
      );
      if (!durationCheck.isValid) {
        throw new Error(durationCheck.reason);
      }

      const tripDays = durationCheck.days!;

      // 3. VALIDATE BUDGET (CFO Logic)
      const budgetCheck = budgetValidatorService.validate({
        totalBudget: preferences.budget.total,
        currency: preferences.budget.currency,
        tripDays,
        travelers: preferences.travelers,
      });

      if (!budgetCheck.isValid) {
        logger.warn(
          { userId, reason: budgetCheck.reason },
          "Budget validation failed - rejecting request",
        );
        throw new Error(budgetCheck.reason || "Budget validation failed");
      }

      // 4. DB-FIRST PATTERN: Create trip record BEFORE queueing
      const tripData: any = {
        userId,
        title: `Trip to ${preferences.destination}`,
        description: `${tripDays}-day trip`,
        startDate,
        endDate,
        budget: {
          currency: preferences.budget.currency,
          totalLimit: preferences.budget.total,
          totalSpent: 0,
          breakdown: [],
        },
        itinerary: [],
        cities: [],
        status: "QUEUED",
      };

      if (preferences.purpose) tripData.purpose = preferences.purpose;
      if (preferences.groupType) tripData.groupType = preferences.groupType;
      if (preferences.priorities) tripData.priorities = preferences.priorities;
      if (preferences.mood) tripData.mood = preferences.mood;
      if (preferences.dealBreakers)
        tripData.dealBreakers = preferences.dealBreakers;

      const trip = await tripRepository.create(tripData);

      // 5. Queue the job
      const job: Job = await tripQueue.add("generate-trip", {
        userId,
        tripId: trip._id.toString(),
        preferences,
      });

      // 6. Lock the trip with the job ID
      await tripRepository.acquireLock(trip._id, job.id as string);

      logger.info(
        {
          jobId: job.id,
          tripId: trip._id,
          userId,
          budgetPerDay: budgetCheck.dailyBudgetPerPerson,
        },
        "Trip generation job queued (CFO validation passed)",
      );

      return {
        jobId: job.id as string,
        tripId: trip._id.toString(),
      };
    } catch (error: any) {
      logger.error({ error, userId }, "Failed to create trip generation job");
      throw error;
    }
  }

  /**
   * Get job status (for polling)
   */
  async getJobStatusForUser(jobId: string, userId: string) {
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
  async retryTripJobForUser(jobId: string, userId: string) {
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

    const { tripId, preferences } = job.data as {
      tripId?: string;
      preferences?: TripPreferences;
    };

    if (!tripId || !preferences) {
      throw new Error("JOB_DATA_INVALID");
    }

    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw new Error("TRIP_NOT_FOUND");
    }

    const newJob: Job = await tripQueue.add(job.name, {
      userId,
      tripId,
      preferences,
    });

    // forceAcquireLock: the failed job may have left isAgentProcessing=true,
    // so we must unconditionally overwrite the lock with the new job's ID.
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
  async getTripById(tripId: string) {
    return tripRepository.findById(tripId);
  }

  /**
   * Get user's trips
   */
  async getUserTrips(
    userId: string,
    options?: { status?: string; limit?: number },
  ) {
    return tripRepository.findByUserId(userId, options);
  }
}

export const plannerService = new PlannerService();
