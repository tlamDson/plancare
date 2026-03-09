import { Response } from "express";
import { plannerService } from "../services/planner.service";
import { ClerkRequest } from "../../../types/express";
import { TripPreferencesSchema } from "../schemas/trip-request.schema";
import { logger } from "../../../lib/logger";
import { userQuotaService } from "../services/user-quota.service";
import { tripRepository } from "../repositories/trip.repository";
import { userRepository } from "../../user/repositories/user.repository";
import IdempotencyLog from "../../user/models/IdempotencyLog";

/**
 * POST /api/trips - Generate new trip
 */
export const generateTrip = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.()?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Check quota (database-level fallback)
    const quota = await userQuotaService.canCreateTrip(userId);
    if (!quota.allowed) {
      res.status(429).json({
        error: "Monthly trip limit exceeded",
        message: "Free tier users can create up to 10 trips per billing cycle.",
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
    const idempotencyKey = req.headers["x-idempotency-key"] as
      | string
      | undefined;

    const user = await userRepository.findByClerkId(userId);

    // Create job (with CFO validation)
    const result = await plannerService.createTripGenerationJob({
      userId,
      preferences,
      language,
      title,
    });

    // Persist idempotency log so duplicate requests return the same result
    if (idempotencyKey) {
      try {
        await IdempotencyLog.create({
          key: idempotencyKey,
          userId,
          tripId: result.tripId,
          jobId: result.jobId,
        });
      } catch {
        // Unique constraint violation = race condition — safe to ignore
      }
    }

    res.status(202).json({
      success: true,
      message: "Trip generation started",
      ...result,
      tier: user?.tier ?? "free",
      quota: {
        remaining:
          quota.limit === Number.MAX_SAFE_INTEGER
            ? Number.MAX_SAFE_INTEGER
            : Math.max(0, quota.remaining - 1),
        limit: quota.limit,
        tripsUsedThisCycle:
          quota.limit === Number.MAX_SAFE_INTEGER
            ? 0
            : Math.max(0, quota.limit - quota.remaining + 1),
        resetAt: quota.resetAt,
      },
    });
  } catch (error: any) {
    const userId: string = req.auth?.()?.userId ?? "";
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
    const userId = req.auth?.()?.userId;
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
    const userId = req.auth?.()?.userId;
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
    const userId: string = req.auth?.()?.userId ?? "";
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

/**
 * PATCH /api/trips/:tripId - Update trip fields (e.g. title)
 */
export const updateTripById = async (
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

    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    if (trip.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Only allow updating specific fields for safety
    const allowedUpdates = ["title", "description"];
    const updateData: any = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: "No valid fields to update" });
      return;
    }

    const updatedTrip = await tripRepository.update(tripId, updateData);
    logger.info({ tripId, userId, updateData }, "Trip updated");

    res.json({ success: true, data: updatedTrip });
  } catch (error: any) {
    logger.error({ error, tripId: req.params.tripId }, "Failed to update trip");
    res.status(500).json({ message: "Failed to update trip" });
  }
};

/**
 * PATCH /api/trips/:tripId/undo — Undo the last itinerary change
 * Restores the most recent snapshot from itineraryHistory.
 */
export const undoTrip = async (
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

    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }
    if (trip.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const restored = await tripRepository.undoLastChange(tripId);
    if (!restored) {
      res.status(409).json({ message: "No undo history available" });
      return;
    }

    logger.info({ tripId, userId }, "↩ Undo applied — itinerary restored");
    res.json({ success: true, itinerary: restored });
  } catch (error: any) {
    logger.error({ error, tripId: req.params.tripId }, "Failed to undo trip");
    res.status(500).json({ message: "Failed to undo" });
  }
};

/**
 * PATCH /api/trips/:tripId/reorder-activities
 * Reorders activities within a single day (drag-and-drop support).
 * Body: { dayIndex: number, orderedActivityIds: string[] }
 */
export const reorderActivities = async (
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

    const { dayIndex, orderedActivityIds } = req.body;

    if (
      typeof dayIndex !== "number" ||
      !Array.isArray(orderedActivityIds) ||
      orderedActivityIds.length === 0
    ) {
      res
        .status(400)
        .json({ message: "dayIndex (number) and orderedActivityIds (string[]) are required" });
      return;
    }

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
      res.status(409).json({ message: "Trip is being processed by AI — try again shortly" });
      return;
    }

    const day = trip.itinerary[dayIndex];
    if (!day) {
      res.status(400).json({ message: `Day index ${dayIndex} not found in itinerary` });
      return;
    }

    // Build id→activity map from the target day
    const activityMap = new Map(
      day.activities.map((a: any) => [a._id.toString(), a]),
    );

    // Verify every supplied ID belongs to this day
    for (const id of orderedActivityIds) {
      if (!activityMap.has(id)) {
        res.status(400).json({ message: `Activity ${id} not found in day ${dayIndex}` });
        return;
      }
    }

    // Guard: if the supplied order matches the current order, skip the DB write
    const currentIds = day.activities.map((a: any) => a._id.toString());
    const isSameOrder = currentIds.every(
      (id: string, idx: number) => id === orderedActivityIds[idx],
    );
    if (isSameOrder && currentIds.length === orderedActivityIds.length) {
      res.json({ success: true, itinerary: trip.itinerary });
      return;
    }

    // Re-assign `order` field to match the new sequence
    const reordered = orderedActivityIds.map((id, idx) => {
      const act = activityMap.get(id) as any;
      return { ...act.toObject(), order: idx };
    });

    // Snapshot current itinerary for undo before mutation
    await tripRepository.saveSnapshot(tripId);

    const { recalcDayDistances } = await import(
      "../services/activity-regen.service"
    );

    trip.itinerary[dayIndex]!.activities = reordered;
    recalcDayDistances(trip.itinerary[dayIndex]!.activities as any[]);
    trip.markModified("itinerary");
    await trip.save();

    logger.info(
      { tripId, userId, dayIndex, count: reordered.length },
      "✅ Activities reordered",
    );
    res.json({ success: true, itinerary: trip.itinerary });
  } catch (error: any) {
    logger.error({ error, tripId: req.params.tripId }, "Failed to reorder activities");
    res.status(500).json({ message: "Failed to reorder activities" });
  }
};

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
      res.status(400).json({ message: "dayIndex (number) and activityId (string) are required" });
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
      res.status(409).json({ message: "Trip is being processed by AI — try again shortly" });
      return;
    }

    const regenCount = (trip as any).regenCount ?? 0;
    if (user?.tier !== "pro" && regenCount >= 5) {
      res.status(402).json({
        message: "Free plan includes up to 5 regenerations per trip. Upgrade to Pro for unlimited regenerations.",
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
      (a: any) => a._id.toString() === activityId,
    );
    if (activityIdx === -1) {
      res.status(404).json({ message: "Activity not found in specified day" });
      return;
    }

    // Collect all existing place names across the entire trip for dedup
    const existingNames = trip.itinerary
      .flatMap((d: any) => d.activities.map((a: any) => a.name as string));

    const destination =
      (trip as any).preferences?.destination ??
      (trip as any).destination ??
      "";

    const hint: string | undefined =
      typeof req.body.hint === "string" && req.body.hint.trim().length > 0
        ? req.body.hint.trim()
        : undefined;

    const { activityRegenService, recalcDayDistances } = await import(
      "../services/activity-regen.service"
    );

    const newActivity = await activityRegenService.regenOne({
      target: day.activities[activityIdx] as any,
      destination,
      existingNames,
      ...(hint !== undefined && { hint }),
    });

    // Snapshot before mutation
    await tripRepository.saveSnapshot(tripId);

    trip.itinerary[dayIndex]!.activities[activityIdx] = newActivity as any;

    // Recalculate distanceFromPrevious + requiresTransport for the whole day
    recalcDayDistances(trip.itinerary[dayIndex]!.activities as any[]);

    trip.markModified("itinerary");
    (trip as any).regenCount = ((trip as any).regenCount ?? 0) + 1;
    await trip.save();

    logger.info(
      { tripId, userId, dayIndex, activityId, newName: newActivity.name, hint: !!hint },
      "✅ Activity regenerated",
    );
    res.json({
      success: true,
      activity: newActivity,
      itinerary: trip.itinerary,
      regenCount: (trip as any).regenCount ?? 1,
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
      res.status(422).json({ message: "Could not find a unique alternative activity. Try again." });
      return;
    }
    res.status(500).json({ message: "Failed to regenerate activity" });
  }
};

import { z } from "zod";
import { TripLifecycleValues } from "@travelplan/shared";

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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/trips/:tripId/regeocode
// Re-validates coordinates for all activities in an existing trip.
// Useful when a trip was generated before API keys were configured.
// ─────────────────────────────────────────────────────────────────────────────

import { validationService } from "../services/validation.service";

/**
 * GET /api/trips/:tripId/chunks/:chunkIndex
 * Returns the days belonging to a specific 3-day chunk (for chunked Pro trips).
 * If the chunk is not yet ready, returns 202 (still generating).
 */
export const getTripChunk = async (
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
    const chunkIndex = parseInt(req.params.chunkIndex ?? "0", 10);

    if (!tripId || isNaN(chunkIndex) || chunkIndex < 0) {
      res.status(400).json({ message: "Valid tripId and chunkIndex are required" });
      return;
    }

    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }
    if (trip.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const chunksReady = (trip as any).chunksReady as boolean[] | undefined;
    const totalChunks = (trip as any).totalChunks as number | undefined;

    if (!chunksReady || !totalChunks) {
      res.status(400).json({ message: "This trip does not use chunked generation" });
      return;
    }

    if (chunkIndex >= totalChunks) {
      res.status(404).json({ message: `Chunk ${chunkIndex} does not exist (totalChunks: ${totalChunks})` });
      return;
    }

    if (!chunksReady[chunkIndex]) {
      res.status(202).json({
        ready: false,
        message: "Chunk is still being generated",
        chunkIndex,
        totalChunks,
        chunksReady,
      });
      return;
    }

    // Return the 3 days that belong to this chunk
    const CHUNK_SIZE = 3;
    const startDayIdx = chunkIndex * CHUNK_SIZE;
    const chunkDays = trip.itinerary.slice(startDayIdx, startDayIdx + CHUNK_SIZE);

    res.json({
      ready: true,
      chunkIndex,
      totalChunks,
      chunksReady,
      days: chunkDays,
    });
  } catch (error: any) {
    logger.error({ error, tripId: req.params.tripId }, "Failed to get trip chunk");
    res.status(500).json({ message: "Failed to retrieve chunk" });
  }
};

export const reGeocodeTrip = async (
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
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }
    if (trip.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Extract destination from trip title (first word(s) before comma or dash)
    const destination = (trip as any).title?.split(/[,\-–]/)[0]?.trim() ?? "";

    let updated = 0;
    let failed = 0;

    for (const day of (trip as any).itinerary) {
      for (const activity of day.activities) {
        try {
          const query = `${activity.name}${destination ? `, ${destination}` : ""}`;
          const result = await validationService.validateIntent(
            query,
            destination,
          );

          if (result) {
            activity.name = result.name;
            activity.location = {
              type: "Point",
              coordinates: result.coordinates, // [lng, lat]
            };
            if (result.rating !== undefined) activity.rating = result.rating;
            if (result.priceLevel !== undefined)
              activity.priceLevel = result.priceLevel;
            if (result.openingHours)
              activity.openingHours = result.openingHours;
            if (result.photoUrl) activity.photoUrl = result.photoUrl;
            updated++;
          } else {
            failed++;
            logger.warn(
              { name: activity.name, tripId },
              "Re-geocode: no result",
            );
          }
        } catch (err: any) {
          failed++;
          logger.error(
            { name: activity.name, err: err.message },
            "Re-geocode activity failed",
          );
        }
      }
    }

    await (trip as any).save();

    logger.info({ tripId, updated, failed }, "Re-geocode complete");
    res.json({
      success: true,
      message: `Re-geocoded ${updated} activities (${failed} failed)`,
      updated,
      failed,
    });
  } catch (error: any) {
    logger.error({ error, tripId: req.params.tripId }, "reGeocodeTrip failed");
    res.status(500).json({ message: "Re-geocode failed" });
  }
};
