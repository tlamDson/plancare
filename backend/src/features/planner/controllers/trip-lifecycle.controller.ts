import { Response } from "express";
import { z } from "zod";
import { TripLifecycleValues } from "@travelplan/shared";
import { plannerService } from "../services/planner.service";
import { ClerkRequest } from "../../../types/express";
import { logger } from "../../../lib/logger";

/**
 * PATCH /api/trips/:tripId/lifecycle — Update the user-managed trip status
 */
export const updateTripLifecycle = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.()?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { tripId } = req.params;
    if (!tripId) {
      res.status(400).json({ message: "Trip ID required" });
      return;
    }

    logger.info(
      { tripId, userId, body: req.body },
      "[lifecycle] PATCH request received",
    );

    // Strictly validate the payload
    const lifecycleSchema = z.object({
      lifecycle: z.enum(TripLifecycleValues),
    });

    const validation = lifecycleSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid lifecycle status",
        errors: validation.error.issues,
      });
      return;
    }

    const { lifecycle } = validation.data;

    // Delegate to service
    const updatedTrip = await plannerService.updateTripLifecycle(
      tripId,
      userId,
      lifecycle,
    );

    logger.info({ tripId, userId, lifecycle }, "Trip lifecycle updated");
    res.json({ success: true, trip: updatedTrip });
  } catch (error: any) {
    if (error.message === "Trip not found") {
      res.status(404).json({ message: "Trip not found" });
      return;
    }
    if (error.message === "Forbidden") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    logger.error(
      { error, tripId: req.params.tripId },
      "Failed to update trip lifecycle",
    );
    res.status(500).json({ message: "Failed to update trip lifecycle" });
  }
};

/**
 * POST /api/trips/:tripId/cancel - Cancel a trip generation
 */
export const cancelTrip = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.()?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { tripId } = req.params;
    if (!tripId) {
      res.status(400).json({ message: "Trip ID is required" });
      return;
    }

    const result = await plannerService.cancelTripForUser(tripId, userId);
    res.status(200).json({
      message: "Trip cancelled successfully",
      ...result,
    });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN_TRIP_ACCESS") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    if (error?.message === "TRIP_NOT_FOUND") {
      res.status(404).json({ message: "Trip not found" });
      return;
    }
    if (error?.message === "TRIP_NOT_PROCESSING") {
      res.status(400).json({ message: "Trip is not currently processing" });
      return;
    }

    logger.error({ error, tripId: req.params.tripId }, "Failed to cancel trip");
    res.status(500).json({ message: "Failed to cancel trip" });
  }
};
