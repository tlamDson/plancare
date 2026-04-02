import {
  Queue,
  QueueOptions,
  Worker,
  WorkerOptions,
} from "bullmq";
import type { RedisOptions } from "ioredis";
import IORedis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";

/** Plain TCP — Railway private Redis, Docker, local dev. */
function shouldSkipRedisTls(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h.includes("railway.internal") ||
    h === "localhost" ||
    h === "127.0.0.1"
  );
}

function buildRedisConnectionOptions(): RedisOptions {
  const skipTls = shouldSkipRedisTls(env.REDIS_HOST);
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
    family: 4,
    ...(skipTls
      ? {}
      : { tls: { rejectUnauthorized: false } }),
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  };
}

const connectionBase = buildRedisConnectionOptions();

const connection = {
  ...connectionBase,
  // Required by BullMQ (ioredis client used as queue connection)
  maxRetriesPerRequest: null,
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
