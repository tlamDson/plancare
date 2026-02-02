import { createQueue } from "../../../lib/queue";
import { Job } from "bullmq";
import { logger } from "../../../lib/logger";
import { tripRepository } from "../repositories/trip.repository";
import { budgetValidatorService } from "./budget-validator.service";
import { TripPreferences } from "../schemas/trip-request.schema";

const tripQueue = createQueue("trip-generation");

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
      const durationCheck = budgetValidatorService.validateDuration(startDate, endDate);
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
      const trip = await tripRepository.create({
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
      });

      // 5. Queue the job
      const job: Job = await tripQueue.add("generate-trip", {
        userId,
        tripId: trip._id.toString(),
        preferences,
      });

      // 6. Lock the trip with the job ID
      await tripRepository.acquireLock(trip._id, job.id as string);

      logger.info(
        { jobId: job.id, tripId: trip._id, userId, budgetPerDay: budgetCheck.dailyBudgetPerPerson },
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
   * Get job status
   */
  async getJobStatus(jobId: string) {
    const job = await tripQueue.getJob(jobId);
    if (!job) return null;
    
    const state = await job.getState();
    const progress = job.progress;
    
    return {
      state,
      progress,
      data: job.data,
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
  async getUserTrips(userId: string, options?: { status?: string; limit?: number }) {
    return tripRepository.findByUserId(userId, options);
  }
}

export const plannerService = new PlannerService();
