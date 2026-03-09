import { createWorker } from "./lib/queue";
import { tripGeneratorProcessor } from "./features/planner/jobs/trip.processor";
import { logger } from "./lib/logger";
import mongoose from "mongoose";
import { env } from "./config/env";
import { userRepository } from "./features/user/repositories/user.repository";

const startWorker = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info("Worker connected to MongoDB");

    const worker = createWorker("trip-generation", tripGeneratorProcessor, {
      concurrency: 5, // Tier 1: 300 RPM → safely handle 5 simultaneous trips
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

    // Tells the worker wait don't just die. Finish what you are doing. Clos Redis connection and MongoDb and then shut down.
    process.on("SIGTERM", async () => {
      await worker.close();
      await mongoose.disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error({ error }, "Worker failed to start");
    process.exit(1);
  }
};

startWorker();
