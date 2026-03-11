/**
 * Insight Scraper Worker
 *
 * Processes a single city per job.
 * Rate limiter (max: 1, duration: 2000) ensures Serper stays within limits.
 */

import { Job } from "bullmq";
import { Country } from "../models/Country";
import { scrapeCityInsight } from "../services/insight-scraper.service";
import { createWorker } from "../../../lib/queue";
import { logger } from "../../../lib/logger";
import type { ScrapeCityPayload } from "./insight-queue";

const INSIGHT_QUEUE_NAME = "insight-scraper";

export async function insightScraperProcessor(
  job: Job<ScrapeCityPayload>,
): Promise<string> {
  const { countryIdKey, countryNameEn, cityIdKey, cityNameEn } = job.data;

  logger.info(
    { jobId: job.id, city: cityNameEn, country: countryNameEn },
    "Processing insight scrape job",
  );

  const insight = await scrapeCityInsight(cityNameEn, countryNameEn);

  if (!insight) {
    // Throw so BullMQ auto-retries with exponential backoff
    throw new Error(
      `Serper/Gemini returned no insight for ${cityNameEn}, ${countryNameEn}`,
    );
  }

  // Use positional $ operator to update the specific city in the array (no save() needed)
  await Country.updateOne(
    { idKey: countryIdKey, "cities.idKey": cityIdKey },
    {
      $set: {
        "cities.$.insightText": insight,
        "cities.$.insightUpdatedAt": new Date(),
      },
    },
  );

  logger.info(
    { jobId: job.id, city: cityNameEn },
    "Insight scraped and saved",
  );
  return `Done: ${cityNameEn}`;
}

// Worker with rate limiter: max 1 job processed every 2 seconds
export const insightWorker = createWorker(
  INSIGHT_QUEUE_NAME,
  insightScraperProcessor,
  {
    limiter: { max: 1, duration: 2000 },
  },
);
