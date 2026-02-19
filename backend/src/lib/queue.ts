import {
  Queue,
  Worker,
  QueueOptions,
  WorkerOptions,
  ConnectionOptions,
} from "bullmq";
import { env } from "../config/env";
import { logger } from "./logger";
import IORedis from "ioredis";

// TLS config for Upstash Redis (required in production)
const isProduction = process.env.NODE_ENV === "production";

const connectionBase: any = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
  family: 4, // Upstash prefers IPv4
  ...(isProduction ? { tls: {} } : {}), // TLS required for Upstash
};

const connection = {
  ...connectionBase,
  maxRetriesPerRequest: null, // Required by BullMQ
};

export const createQueue = (name: string, options?: QueueOptions) => {
  return new Queue(name, {
    connection,
    ...options,
  });
};

export const createWorker = (
  name: string,
  processor: any,
  options?: Omit<WorkerOptions, "connection">,
) => {
  return new Worker(name, processor, {
    connection,
    ...options,
  });
};

export const redisConnection = new IORedis(connectionBase);

redisConnection.on("error", (err) => {
  logger.error({ err }, "Redis connection error");
});

redisConnection.on("connect", () => {
  logger.info("Redis connected");
});
