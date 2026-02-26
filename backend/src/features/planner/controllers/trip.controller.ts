import { Response } from "express";
import { plannerService } from "../services/planner.service";
import { ClerkRequest } from "../../../types/express";
import { TripPreferencesSchema } from "../schemas/trip-request.schema";
import { logger } from "../../../lib/logger";
import { userQuotaService } from "../services/user-quota.service";
import { tripRepository } from "../repositories/trip.repository";

/**
 * POST /api/trips - Generate new trip
 */
export const generateTrip = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Check quota (database-level fallback)
    const quota = await userQuotaService.canCreateTrip(userId);
    if (!quota.allowed) {
      res.status(429).json({
        error: "Daily trip limit exceeded",
        message: "Free tier users can create 10 trips per day.",
        remaining: quota.remaining,
        resetAt: quota.resetAt,
      });
      return;
    }

    // Validate request with Zod
    const validation = TripPreferencesSchema.safeParse(req.body.preferences);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid trip preferences",
        errors: validation.error.issues,
      });
      return;
    }

    const preferences = validation.data;
    const { language, title } = req.body;

    // Create job (with CFO validation)
    const result = await plannerService.createTripGenerationJob({
      userId,
      preferences,
      language,
      title,
    });

    res.status(202).json({
      success: true,
      message: "Trip generation started",
      ...result,
      quota: {
        remaining: quota.remaining - 1,
        resetAt: quota.resetAt,
      },
    });
  } catch (error: any) {
    const userId: string = req.auth?.userId ?? "";
    logger.error({ error, userId }, "Failed to generate trip");
    res.status(400).json({
      success: false,
      message: error.message || "Failed to start trip generation",
    });
  }
};

/**
 * GET /api/trips/:tripId - Get trip by ID (polling)
 */
export const getTripById = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const tripId = req.params.tripId;
    if (!tripId) {
      res.status(400).json({ message: "Trip ID is required" });
      return;
    }

    const trip = await plannerService.getTripById(tripId);

    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    // Verify ownership
    if (trip.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    res.json({ success: true, trip });
  } catch (error: any) {
    logger.error({ error, tripId: req.params.tripId }, "Failed to get trip");
    res.status(500).json({ message: "Failed to retrieve trip" });
  }
};

/**
 * GET /api/trips - Get user's trips
 */
export const getUserTrips = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { status, limit } = req.query;

    const trips = await plannerService.getUserTrips(userId, {
      status: status as string,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({ success: true, trips, count: trips.length });
  } catch (error: any) {
    const userId: string = req.auth?.userId ?? "";
    logger.error({ error, userId }, "Failed to get user trips");
    res.status(500).json({ message: "Failed to retrieve trips" });
  }
};

/**
 * DELETE /api/trips/:tripId - Delete a trip
 */
export const deleteTripById = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { tripId } = req.params;
    if (!tripId) {
      res.status(400).json({ message: "Trip ID is required" });
      return;
    }

    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    // Verify ownership
    if (trip.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await tripRepository.delete(tripId);
    logger.info({ tripId, userId }, "Trip deleted");

    res.status(200).json({ success: true, message: "Trip deleted" });
  } catch (error: any) {
    logger.error({ error, tripId: req.params.tripId }, "Failed to delete trip");
    res.status(500).json({ message: "Failed to delete trip" });
  }
};
