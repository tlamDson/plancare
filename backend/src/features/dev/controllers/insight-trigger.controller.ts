/**
 * Dev Admin: Manually trigger insight scraping
 *
 * POST /api/dev/scrape-insights
 * No auth — dev only. Fans out all stale cities to the BullMQ insight queue.
 */
import { Request, Response } from "express";
import { scheduleInsightScraping } from "../../destinations/jobs/insight-queue";
import { logger } from "../../../lib/logger";

export async function triggerInsightScraping(
  _req: Request,
  res: Response,
): Promise<void> {
  logger.info("🔧 [DEV] Manual insight scraping triggered");
  const { jobsAdded } = await scheduleInsightScraping();
  res.json({
    success: true,
    jobsAdded,
    message: `${jobsAdded} cities queued for insight scraping. Check worker logs for progress.`,
  });
}
