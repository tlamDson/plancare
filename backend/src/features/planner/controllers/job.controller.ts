import { Response } from "express";
import { plannerService } from "../services/planner.service";
import { ClerkRequest } from "../../../types/express";
import { logger } from "../../../lib/logger";

/**
 * GET /api/jobs/:jobId - Get job status
 */
export const getJobStatus = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.()?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const jobId = req.params.jobId;
    if (!jobId) {
      res.status(400).json({ message: "Job ID is required" });
      return;
    }

    const jobStatus = await plannerService.getJobStatusForUser(jobId, userId);
    if (!jobStatus) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    res.json({ success: true, data: jobStatus });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN_JOB_ACCESS") {
      return;
    }

    logger.error(
      { error, jobId: req.params.jobId },
      "Failed to get job status",
    );
    res.status(500).json({ message: "Failed to retrieve job status" });
  }
};

/**
 * POST /api/jobs/:jobId/retry - Retry a failed job
 */
export const retryJob = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.()?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const jobId = req.params.jobId;
    if (!jobId) {
      res.status(400).json({ message: "Job ID is required" });
      return;
    }

    const result = await plannerService.retryTripJobForUser(jobId, userId);
    if (!result) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    res.status(202).json({
      success: true,
      message: "Trip retry queued",
      ...result,
    });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN_JOB_ACCESS") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    if (error?.message === "JOB_NOT_FAILED") {
      res.status(400).json({ message: "Only failed jobs can be retried" });
      return;
    }

    if (error?.message === "TRIP_LOCKED") {
      res.status(409).json({ message: "Trip is already being processed" });
      return;
    }

    if (error?.message === "TRIP_NOT_FOUND") {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    logger.error({ error, jobId: req.params.jobId }, "Failed to retry job");
    res.status(500).json({ message: "Failed to retry job" });
  }
};

/**
 * POST /api/jobs/:jobId/cancel - Cancel a pending/processing job
 */
export const cancelJob = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.()?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const jobId = req.params.jobId;
    if (!jobId) {
      res.status(400).json({ message: "Job ID is required" });
      return;
    }

    const result = await plannerService.cancelTripJobForUser(jobId, userId);
    res.status(200).json({
      message: "Job cancelled successfully",
      ...result,
    });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN_JOB_ACCESS") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    if (error?.message === "JOB_ALREADY_FINISHED") {
      res.status(400).json({ message: "Job has already finished processing" });
      return;
    }

    if (error?.message === "JOB_NOT_FOUND") {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    logger.error({ error, jobId: req.params.jobId }, "Failed to cancel job");
    res.status(500).json({ message: "Failed to cancel job" });
  }
};
