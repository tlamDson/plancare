/**
 * Dev Admin: Manually trigger insight scraping
 *
 * POST /api/dev/scrape-insights
 * requireUserAuth + dev-only. Fans out all stale cities to the BullMQ
 * insight queue — each one a paid Serper.dev call once the worker picks it
 * up, so this must never be reachable outside local development.
 */
import { Response } from "express";
import { scheduleInsightScraping } from "../../destinations/jobs/insight-queue";
import { logger } from "../../../lib/logger";
import { env } from "../../../config/env";
import { ClerkRequest } from "../../../types/express";

export async function triggerInsightScraping(
  _req: ClerkRequest,
  res: Response,
): Promise<void> {
  if (env.NODE_ENV !== "development") {
    res.status(403).json({ message: "Only available in local development" });
    return;
  }

  logger.info("🔧 [DEV] Manual insight scraping triggered");
  const { jobsAdded } = await scheduleInsightScraping();
  res.json({
    success: true,
    jobsAdded,
    message: `${jobsAdded} cities queued for insight scraping. Check worker logs for progress.`,
  });
}
