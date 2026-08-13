import IORedis from "ioredis";
import {
  buildRedisConnectionOptions,
  type RedisEnvConfig,
} from "../redis-options";
import { skipped, truncate } from "./http-check";
import type { CheckResult, ServiceEnv } from "./types";

/** `process.env` values are strings; `redis-options` expects a typed config. */
export function toRedisEnvConfig(env: ServiceEnv): RedisEnvConfig {
  const parsedPort = Number.parseInt(env.REDIS_PORT ?? "", 10);
  return {
    REDIS_URL: env.REDIS_URL ?? "",
    REDIS_HOST: env.REDIS_HOST || "localhost",
    REDIS_PORT: Number.isFinite(parsedPort) ? parsedPort : 6379,
    REDIS_PASSWORD: env.REDIS_PASSWORD ?? "",
    REDIS_TLS: env.REDIS_TLS ?? "",
  };
}

export async function checkRedis(env: ServiceEnv): Promise<CheckResult> {
  const config = toRedisEnvConfig(env);
  if (!config.REDIS_URL && !config.REDIS_HOST) {
    return skipped("Redis", "REDIS_URL / REDIS_HOST not set");
  }

  // Reuses the exact production resolution (URL parsing + TLS heuristics), so a
  // passing check means the app would connect the same way.
  const base = buildRedisConnectionOptions(config);
  const where = `${base.host}:${base.port} tls=${base.tls ? "on" : "off"}`;

  const client = new IORedis({
    ...base,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    // Default strategy retries forever; a health check must give up immediately.
    retryStrategy: () => null,
  });

  // ioredis reports the real cause (ECONNREFUSED, ENOTFOUND, auth failures) on
  // the "error" event and rejects connect() with a generic "Connection is
  // closed." — so capture the first event and prefer it when reporting. The
  // listener also stops Node treating it as an unhandled error event.
  let socketError: Error | null = null;
  client.on("error", (err: Error) => {
    socketError ??= err;
  });

  const startedAt = Date.now();
  try {
    await client.connect();
    await client.ping();
    return {
      name: "Redis",
      status: "OK",
      detail: where,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    const cause = socketError ?? error;
    const message = cause instanceof Error ? cause.message : String(cause);
    return {
      name: "Redis",
      status: "FAIL",
      detail: `${where} — ${truncate(message, 100)}`,
      latencyMs: Date.now() - startedAt,
    };
  } finally {
    await Promise.resolve(client.quit()).catch(() => undefined);
  }
}
