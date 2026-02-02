import { createWorker } from "./lib/queue";
import { tripGeneratorProcessor } from "./features/planner/jobs/trip.processor";
import { logger } from "./lib/logger";
import mongoose from "mongoose";
import { env } from "./config/env";

const startWorker = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info("Worker connected to MongoDB");

    const worker = createWorker("trip-generation", tripGeneratorProcessor);
    // Logs a success mesesage with the jobId when a job is completed
    worker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Job completed");
    });
    // Logs a error mesesage with the jobId
    worker.on("failed", (job, err) => {
      logger.error({ jobId: job?.id, err }, "Job failed");
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
