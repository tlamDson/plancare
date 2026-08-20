import { Response } from "express";
import { plannerService } from "../services/planner.service";
import { tripRepository } from "../repositories/trip.repository";
import { ClerkRequest } from "../../../types/express";
import { logger } from "../../../lib/logger";

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
      res
        .status(400)
        .json({ message: "Valid tripId and chunkIndex are required" });
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

    const { chunksReady, totalChunks } = trip;

    if (!chunksReady || !totalChunks) {
      res
        .status(400)
        .json({ message: "This trip does not use chunked generation" });
      return;
    }

    if (chunkIndex >= totalChunks) {
      res.status(404).json({
        message: `Chunk ${chunkIndex} does not exist (totalChunks: ${totalChunks})`,
      });
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
    const chunkDays = trip.itinerary.slice(
      startDayIdx,
      startDayIdx + CHUNK_SIZE,
    );

    res.json({
      ready: true,
      chunkIndex,
      totalChunks,
      chunksReady,
      days: chunkDays,
    });
  } catch (error: any) {
    logger.error(
      { error, tripId: req.params.tripId },
      "Failed to get trip chunk",
    );
    res.status(500).json({ message: "Failed to retrieve chunk" });
  }
};
