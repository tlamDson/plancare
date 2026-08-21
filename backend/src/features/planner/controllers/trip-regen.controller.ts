import { Response } from "express";
import { tripRepository } from "../repositories/trip.repository";
import { userRepository } from "../../user/repositories/user.repository";
import { ClerkRequest } from "../../../types/express";
import { logger } from "../../../lib/logger";

/**
 * POST /api/trips/:tripId/regen-activity
 * Regenerates a single activity with a new AI-suggested place.
 * Body: { dayIndex: number, activityId: string }
 */
export const regenActivity = async (
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

    const { dayIndex, activityId } = req.body;

    if (typeof dayIndex !== "number" || typeof activityId !== "string") {
      res.status(400).json({
        message: "dayIndex (number) and activityId (string) are required",
      });
      return;
    }

    const user = await userRepository.findByClerkId(userId);

    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    if (trip.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    if (trip.isAgentProcessing) {
      res
        .status(409)
        .json({ message: "Trip is being processed by AI — try again shortly" });
      return;
    }

    const regenCount = trip.regenCount ?? 0;
    if (user?.tier !== "pro" && regenCount >= 5) {
      res.status(402).json({
        message:
          "Free plan includes up to 5 regenerations per trip. Upgrade to Pro for unlimited regenerations.",
        regenCount,
        regenLimit: 5,
      });
      return;
    }

    const day = trip.itinerary[dayIndex];
    if (!day) {
      res.status(400).json({ message: `Day index ${dayIndex} not found` });
      return;
    }

    const activityIdx = day.activities.findIndex(
      (a) => a._id!.toString() === activityId,
    );
    if (activityIdx === -1) {
      res.status(404).json({ message: "Activity not found in specified day" });
      return;
    }

    // Collect all existing place names across the entire trip for dedup
    const existingNames = trip.itinerary.flatMap((d) =>
      d.activities.map((a) => a.name),
    );

    const destination = trip.destination ?? "";

    const hint: string | undefined =
      typeof req.body.hint === "string" && req.body.hint.trim().length > 0
        ? req.body.hint.trim()
        : undefined;

    const { activityRegenService, recalcDayDistances } =
      await import("../services/activity-regen.service");

    const newActivity = await activityRegenService.regenOne({
      target: day.activities[activityIdx]!,
      destination,
      existingNames,
      ...(hint !== undefined && { hint }),
    });

    // Snapshot before mutation
    await tripRepository.saveSnapshot(tripId);

    trip.itinerary[dayIndex]!.activities[activityIdx] = newActivity;

    // Recalculate distanceFromPrevious + requiresTransport for the whole day
    recalcDayDistances(trip.itinerary[dayIndex]!.activities);

    trip.markModified("itinerary");
    trip.regenCount = (trip.regenCount ?? 0) + 1;
    await trip.save();

    logger.info(
      {
        tripId,
        userId,
        dayIndex,
        activityId,
        newName: newActivity.name,
        hint: !!hint,
      },
      "✅ Activity regenerated",
    );
    res.json({
      success: true,
      activity: newActivity,
      itinerary: trip.itinerary,
      regenCount: trip.regenCount ?? 1,
      regenLimit: user?.tier === "pro" ? -1 : 5,
      tier: user?.tier ?? "free",
    });
  } catch (error: any) {
    // Pino serializes Error objects under 'err', not 'error'
    logger.error(
      { err: error, errMessage: error?.message, tripId: req.params.tripId },
      "Failed to regen activity",
    );
    if (error.message === "NO_ALTERNATIVE_FOUND") {
      res.status(422).json({
        message: "Could not find a unique alternative activity. Try again.",
      });
      return;
    }
    res.status(500).json({ message: "Failed to regenerate activity" });
  }
};
