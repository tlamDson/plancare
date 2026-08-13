import type { RedisOptions } from "ioredis";

/**
 * Pure Redis connection resolution, extracted from `queue.ts` so it can be
 * unit-tested and reused by tooling (e.g. the connectivity checker) without
 * importing `config/env` (envalid fail-fast) or opening a live connection.
 */
export type RedisEnvConfig = {
  REDIS_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_TLS: string;
};

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
function resolveRedisTls(
  host: string,
  urlMode: "none" | "plain" | "tls",
  redisTlsFlag: string,
): boolean {
  const explicit = redisTlsFlag.trim().toLowerCase();
  if (explicit === "true" || explicit === "1") return true;
  if (explicit === "false" || explicit === "0") return false;
  if (urlMode === "tls") return true;
  if (urlMode === "plain") return false;
  return !shouldSkipRedisTls(host);
}

export function buildRedisConnectionOptions(cfg: RedisEnvConfig): RedisOptions {
  const parsed = tryParseRedisUrl(cfg.REDIS_URL);
  const host = parsed?.host ?? cfg.REDIS_HOST;
  const port = parsed?.port ?? cfg.REDIS_PORT;
  const password = (parsed?.password ?? cfg.REDIS_PASSWORD) || undefined;
  const username = parsed?.username;

  const urlMode: "none" | "plain" | "tls" = parsed
    ? parsed.schemeWantsTls
      ? "tls"
      : "plain"
    : "none";

  const useTls = resolveRedisTls(host, urlMode, cfg.REDIS_TLS);

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
