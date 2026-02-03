import { Request, Response } from "express";
import { plannerService } from "../services/planner.service";
import { ClerkRequest } from "../../../types/express";
import { TripPreferencesSchema } from "../schemas/trip-request.schema";
import { logger } from "../../../lib/logger";

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

    // Create job (with CFO validation)
    const result = await plannerService.createTripGenerationJob({
      userId,
      preferences,
    });

    res.status(202).json({
      success: true,
      message: "Trip generation started",
      ...result,
    });
  } catch (error: any) {
    logger.error(
      { error, userId: req.auth?.userId },
      "Failed to generate trip",
    );

    // Return user-friendly error
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

    res.json({
      success: true,
      trip,
    });
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

    res.json({
      success: true,
      trips,
      count: trips.length,
    });
  } catch (error: any) {
    logger.error(
      { error, userId: req.auth?.userId },
      "Failed to get user trips",
    );
    res.status(500).json({ message: "Failed to retrieve trips" });
  }
};
