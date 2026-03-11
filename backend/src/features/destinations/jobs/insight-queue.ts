/**
 * Insight Queue — Fan-out Producer
 *
 * Creates 1 job PER CITY that needs an insight update (never per country batch).
 * This way BullMQ's limiter can safely throttle to 1 req/2s without Serper getting hit.
 */

import { createQueue } from "../../../lib/queue";
import { Country } from "../models/Country";
import { logger } from "../../../lib/logger";

const INSIGHT_QUEUE_NAME = "insight-scraper";

export interface ScrapeCityPayload {
  countryIdKey: string;
  countryNameEn: string;
  cityIdKey: string;
  cityNameEn: string;
}

export const insightQueue = createQueue(INSIGHT_QUEUE_NAME);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Queries all supported countries and fans out 1 job per city that needs updating.
 * Triggered by node-cron or manually via the dev admin route.
 */
export async function scheduleInsightScraping(): Promise<{ jobsAdded: number }> {
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
  const countries = await Country.find({ isSupported: true });

  let jobsAdded = 0;
  for (const country of countries) {
    for (const city of country.cities) {
      const needsUpdate =
        !city.insightText ||
        !city.insightUpdatedAt ||
        new Date(city.insightUpdatedAt).getTime() < cutoff.getTime();

      if (needsUpdate) {
        await insightQueue.add(
          "scrape-city",
          {
            countryIdKey: country.idKey,
            countryNameEn: country.nameEn,
            cityIdKey: city.idKey,
            cityNameEn: city.nameEn,
          } satisfies ScrapeCityPayload,
        { 
          jobId: `scrape-${country.idKey}-${city.idKey}`,
          attempts: 3,
          backoff: { type: "exponential" as const, delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
        );
        jobsAdded++;
      }
    }
  }

  logger.info({ jobsAdded }, "Insight scrape jobs queued");
  return { jobsAdded };
}
