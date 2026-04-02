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

/** Plain TCP — Docker Compose `redis`, Railway private Redis, local dev. */
function shouldSkipRedisTls(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h.includes("railway.internal") ||
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "redis"
  );
}

type ParsedRedisUrl = {
  host: string;
  port: number;
  password?: string;
  username?: string;
  /** true = rediss://, false = redis:// */
  schemeWantsTls: boolean;
};

function tryParseRedisUrl(raw: string): ParsedRedisUrl | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "redis:" && u.protocol !== "rediss:") return null;
    const port = u.port ? parseInt(u.port, 10) : 6379;
    const out: ParsedRedisUrl = {
      host: u.hostname,
      port,
      schemeWantsTls: u.protocol === "rediss:",
    };
    if (u.password) out.password = decodeURIComponent(u.password);
    if (u.username) out.username = decodeURIComponent(u.username);
    return out;
  } catch {
    return null;
  }
}

/** `urlMode`: from URL scheme — "tls" | "plain" | "none" (use host heuristics). */
function resolveRedisTls(host: string, urlMode: "none" | "plain" | "tls"): boolean {
  const explicit = env.REDIS_TLS.trim().toLowerCase();
  if (explicit === "true" || explicit === "1") return true;
  if (explicit === "false" || explicit === "0") return false;
  if (urlMode === "tls") return true;
  if (urlMode === "plain") return false;
  return !shouldSkipRedisTls(host);
}

function buildRedisConnectionOptions(): RedisOptions {
  const parsed = tryParseRedisUrl(env.REDIS_URL);
  const host = parsed?.host ?? env.REDIS_HOST;
  const port = parsed?.port ?? env.REDIS_PORT;
  const password = (parsed?.password ?? env.REDIS_PASSWORD) || undefined;
  const username = parsed?.username;

  const urlMode: "none" | "plain" | "tls" = parsed
    ? parsed.schemeWantsTls
      ? "tls"
      : "plain"
    : "none";

  const useTls = resolveRedisTls(host, urlMode);

  return {
    host,
    port,
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
    family: 4,
    ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
    connectTimeout: 15_000,
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  };
}

const connectionBase = buildRedisConnectionOptions();

const connection = {
  ...connectionBase,
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
  logger.info(
    { redisHost: connectionBase.host, redisPort: connectionBase.port },
    "Redis connected",
  );
});
