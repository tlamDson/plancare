import { createWorker } from "./lib/queue";
import { tripGeneratorProcessor } from "./features/planner/jobs/trip.processor";
import { calendarSyncProcessor } from "./features/calendar/jobs/calendar-sync.processor";
import { insightWorker } from "./features/destinations/jobs/insight-worker";
import { scheduleInsightScraping } from "./features/destinations/jobs/insight-queue";
import { logger } from "./lib/logger";
import mongoose from "mongoose";
import { env } from "./config/env";
import { userRepository } from "./features/user/repositories/user.repository";
import cron from "node-cron";

/** Fewer stalled checks → fewer Redis commands; lock covers long AI / I/O jobs. */
const workerThroughputOpts = {
  stalledInterval: 30_000,
  lockDuration: 60_000,
} as const;

const startWorker = async () => {
  try {
    logger.info("Connecting to MongoDB...");
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    logger.info("Worker connected to MongoDB");

    const worker = createWorker("trip-generation", tripGeneratorProcessor, {
      concurrency: 5, // Tier 1: 300 RPM → safely handle 5 simultaneous trips
      ...workerThroughputOpts,
    });
    // Logs a success mesesage with the jobId when a job is completed
    worker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Job completed");
    });
    // Logs a error mesesage with the jobId
    worker.on("failed", async (job, err) => {
      logger.error({ jobId: job?.id, err }, "Job failed");

      if (!job) return;
      const maxAttempts = job.opts?.attempts ?? 1;
      const exhausted = job.attemptsMade >= maxAttempts;

      if (exhausted && job.data?.userTier === "pro" && job.data?.userId) {
        try {
          await userRepository.incrementCredit(job.data.userId);
          logger.info(
            { userId: job.data.userId, jobId: job.id },
            "Credit refunded after exhausted retries",
          );
        } catch (refundErr) {
          logger.error(
            { refundErr, userId: job.data.userId },
            "Failed to refund credit — manual intervention required",
          );
        }
      }
    });

    logger.info("Worker started and listening for jobs...");

    // Calendar Sync Worker
    const calendarWorker = createWorker(
      "sync-google-calendar",
      calendarSyncProcessor,
      { concurrency: 3, ...workerThroughputOpts },
    );
    calendarWorker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Calendar sync job completed");
    });
    calendarWorker.on("failed", (job, err) => {
      logger.error({ jobId: job?.id, err }, "Calendar sync job failed");
    });

    // Insight Scraper Worker — processes 1 city per job at max 1 req/2s
    insightWorker.on("completed", (job) => {
      logger.info({ jobId: job.id, result: job.returnvalue }, "Insight scrape completed");
    });
    insightWorker.on("failed", (job, err) => {
      logger.error({ jobId: job?.id, err }, "Insight scrape failed");
    });

    // Weekly cron: every Sunday at 2 AM — fans out 1 job per stale city
    if (env.SERPER_API_KEY) {
      cron.schedule("0 2 * * 0", async () => {
        logger.info("Running weekly insight scraping schedule");
        const { jobsAdded } = await scheduleInsightScraping();
        logger.info({ jobsAdded }, "Weekly insight schedule complete");
      });
      logger.info("Weekly insight cron registered (Sundays 2 AM)");
    } else {
      logger.warn("SERPER_API_KEY not set — insight scraping disabled");
    }

    // Tells the worker wait don't just die. Finish what you are doing. Clos Redis connection and MongoDb and then shut down.
    process.on("SIGTERM", async () => {
      await worker.close();
      await calendarWorker.close();
      await insightWorker.close();
      await mongoose.disconnect();
      process.exit(0);
    });
  } catch (error: any) {
    // Use console.error as a safety net — Pino may fail before it is configured
    console.error("❌ Worker failed to start. Raw error:", error?.message);
    console.error("Stack:", error?.stack);
    logger.error(
      { err: error, message: error?.message, stack: error?.stack },
      "Worker failed to start",
    );
    process.exit(1);
  }
};

startWorker();
