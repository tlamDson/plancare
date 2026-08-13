import { describe, it, expect } from "vitest";
import {
  buildRedisConnectionOptions,
  type RedisEnvConfig,
} from "./redis-options";

const base: RedisEnvConfig = {
  REDIS_URL: "",
  REDIS_HOST: "localhost",
  REDIS_PORT: 6379,
  REDIS_PASSWORD: "",
  REDIS_TLS: "",
};

const withEnv = (overrides: Partial<RedisEnvConfig>) =>
  buildRedisConnectionOptions({ ...base, ...overrides });

describe("buildRedisConnectionOptions - host/port/credential resolution", () => {
  it("falls back to REDIS_HOST/PORT when REDIS_URL is empty", () => {
    const opts = withEnv({ REDIS_HOST: "cache.example.com", REDIS_PORT: 6380 });
    expect(opts.host).toBe("cache.example.com");
    expect(opts.port).toBe(6380);
  });

  it("lets REDIS_URL win over REDIS_HOST/PORT/PASSWORD", () => {
    const opts = withEnv({
      REDIS_URL: "redis://:placeholder-not-a-secret@url-host.example.com:6390",
      REDIS_HOST: "ignored.example.com",
      REDIS_PORT: 6379,
      REDIS_PASSWORD: "ignored",
    });
    expect(opts.host).toBe("url-host.example.com");
    expect(opts.port).toBe(6390);
    expect(opts.password).toBe("placeholder-not-a-secret");
  });

  it("defaults to port 6379 when REDIS_URL omits the port", () => {
    expect(withEnv({ REDIS_URL: "redis://url-host.example.com" }).port).toBe(
      6379,
    );
  });

  it("decodes URL-encoded passwords from REDIS_URL", () => {
    const opts = withEnv({
      REDIS_URL: "redis://:p%40ss%3Aword@h.example.com:6379",
    });
    expect(opts.password).toBe("p@ss:word");
  });

  it("carries the username through when REDIS_URL has one", () => {
    const opts = withEnv({
      REDIS_URL: "rediss://default:pw@h.example.com:6379",
    });
    expect(opts.username).toBe("default");
  });

  it("omits password entirely when none is configured", () => {
    expect(withEnv({ REDIS_PASSWORD: "" })).not.toHaveProperty("password");
  });

  it("ignores a REDIS_URL with an unsupported scheme and falls back to host vars", () => {
    const opts = withEnv({
      REDIS_URL: "http://not-redis.example.com:80",
      REDIS_HOST: "fallback.example.com",
    });
    expect(opts.host).toBe("fallback.example.com");
  });

  it("ignores an unparseable REDIS_URL and falls back to host vars", () => {
    const opts = withEnv({
      REDIS_URL: ":::not a url:::",
      REDIS_HOST: "fallback.example.com",
    });
    expect(opts.host).toBe("fallback.example.com");
  });
});

describe("buildRedisConnectionOptions - TLS resolution", () => {
  it("enables TLS for a rediss:// URL", () => {
    expect(
      withEnv({ REDIS_URL: "rediss://h.example.com:6379" }).tls,
    ).toBeDefined();
  });

  it("disables TLS for a redis:// URL even on a remote host", () => {
    expect(
      withEnv({ REDIS_URL: "redis://h.example.com:6379" }).tls,
    ).toBeUndefined();
  });

  it.each([
    "railway.internal",
    "redis.railway.internal",
    "localhost",
    "127.0.0.1",
    "redis",
  ])("skips TLS for internal host %s when no URL scheme is given", (host) => {
    expect(withEnv({ REDIS_HOST: host }).tls).toBeUndefined();
  });

  it("is case-insensitive about internal host detection", () => {
    expect(
      withEnv({ REDIS_HOST: "REDIS.RAILWAY.INTERNAL" }).tls,
    ).toBeUndefined();
  });

  it("enables TLS for an unrecognised remote host when no URL scheme is given", () => {
    expect(withEnv({ REDIS_HOST: "cache.upstash.io" }).tls).toBeDefined();
  });

  it.each(["true", "1", "TRUE", " true "])(
    "lets REDIS_TLS=%s force TLS on for an internal host",
    (flag) => {
      expect(
        withEnv({ REDIS_HOST: "localhost", REDIS_TLS: flag }).tls,
      ).toBeDefined();
    },
  );

  it.each(["false", "0", "FALSE"])(
    "lets REDIS_TLS=%s force TLS off, overriding a rediss:// scheme",
    (flag) => {
      expect(
        withEnv({ REDIS_URL: "rediss://h.example.com:6379", REDIS_TLS: flag })
          .tls,
      ).toBeUndefined();
    },
  );

  it("keeps rejectUnauthorized false for managed Redis with self-signed certs", () => {
    const opts = withEnv({ REDIS_URL: "rediss://h.example.com:6379" });
    expect(opts.tls).toMatchObject({ rejectUnauthorized: false });
  });
});

describe("buildRedisConnectionOptions - transport defaults", () => {
  it("pins IPv4 and a 15s connect timeout", () => {
    const opts = withEnv({});
    expect(opts.family).toBe(4);
    expect(opts.connectTimeout).toBe(15_000);
  });

  it("backs off retries linearly up to a 2s ceiling", () => {
    const retryStrategy = withEnv({}).retryStrategy as (
      times: number,
    ) => number;
    expect(retryStrategy(1)).toBe(50);
    expect(retryStrategy(10)).toBe(500);
    expect(retryStrategy(1000)).toBe(2000);
  });
});
