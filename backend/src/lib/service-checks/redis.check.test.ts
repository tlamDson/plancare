import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRedis, toRedisEnvConfig } from "./redis.check";

type FakeClient = {
  options: Record<string, unknown>;
  connect: ReturnType<typeof vi.fn>;
  ping: ReturnType<typeof vi.fn>;
  quit: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  /** Replays whatever the checker registered for the "error" event. */
  emitError: (err: Error) => void;
};

const instances: FakeClient[] = [];

let connectImpl: () => Promise<void> = async () => undefined;
let pingImpl: () => Promise<string> = async () => "PONG";

vi.mock("ioredis", () => ({
  default: class FakeIORedis {
    constructor(public options: Record<string, unknown>) {
      const listeners: Array<(err: Error) => void> = [];
      const entry: FakeClient = {
        options,
        connect: vi.fn(() => connectImpl()),
        ping: vi.fn(() => pingImpl()),
        quit: vi.fn(async () => "OK"),
        on: vi.fn((event: string, handler: (err: Error) => void) => {
          if (event === "error") listeners.push(handler);
        }),
        emitError: (err: Error) => listeners.forEach((l) => l(err)),
      };
      instances.push(entry);
      Object.assign(this, entry);
    }
  },
}));

beforeEach(() => {
  instances.length = 0;
  connectImpl = async () => undefined;
  pingImpl = async () => "PONG";
});

/** The client the checker constructed; throws a clear message if it built none. */
const client = () => {
  const instance = instances[0];
  if (!instance)
    throw new Error("expected an IORedis client to be constructed");
  return instance;
};

describe("toRedisEnvConfig", () => {
  it("coerces the string port from process.env into a number", () => {
    expect(toRedisEnvConfig({ REDIS_PORT: "6380" }).REDIS_PORT).toBe(6380);
  });

  it("falls back to sane defaults when nothing is set", () => {
    expect(toRedisEnvConfig({})).toEqual({
      REDIS_URL: "",
      REDIS_HOST: "localhost",
      REDIS_PORT: 6379,
      REDIS_PASSWORD: "",
      REDIS_TLS: "",
    });
  });

  it("ignores a non-numeric port rather than producing NaN", () => {
    expect(toRedisEnvConfig({ REDIS_PORT: "not-a-port" }).REDIS_PORT).toBe(
      6379,
    );
  });
});

describe("checkRedis", () => {
  it("returns OK with the resolved host/port and TLS mode after a PONG", async () => {
    const result = await checkRedis({
      REDIS_HOST: "localhost",
      REDIS_PORT: "6379",
    });

    expect(result.status).toBe("OK");
    expect(result.detail).toContain("localhost:6379");
    expect(client().ping).toHaveBeenCalled();
  });

  it("reports the TLS decision so a misconfigured managed Redis is visible", async () => {
    const result = await checkRedis({
      REDIS_URL: "rediss://cache.upstash.io:6379",
    });
    expect(result.detail).toMatch(/tls=on/i);
  });

  it("reports tls=off for a plain internal host", async () => {
    const result = await checkRedis({ REDIS_HOST: "redis.railway.internal" });
    expect(result.detail).toMatch(/tls=off/i);
  });

  it("fails fast instead of retrying forever when Redis is unreachable", async () => {
    await checkRedis({ REDIS_HOST: "localhost" });
    const opts = client().options;
    expect(opts.lazyConnect).toBe(true);
    expect(opts.maxRetriesPerRequest).toBe(1);
    expect(typeof opts.retryStrategy).toBe("function");
    expect((opts.retryStrategy as () => null)()).toBeNull();
  });

  it("registers an error listener so ioredis never emits an unhandled error event", async () => {
    await checkRedis({ REDIS_HOST: "localhost" });
    expect(client().on).toHaveBeenCalledWith("error", expect.any(Function));
  });

  it("reports the underlying socket error rather than ioredis's generic close message", async () => {
    connectImpl = async () => {
      // ioredis surfaces the real cause on the "error" event and rejects
      // connect() with an unhelpful generic message.
      client().emitError(new Error("connect ECONNREFUSED 127.0.0.1:6379"));
      throw new Error("Connection is closed.");
    };

    const result = await checkRedis({ REDIS_HOST: "localhost" });

    expect(result.status).toBe("FAIL");
    expect(result.detail).toContain("ECONNREFUSED");
    expect(result.detail).not.toContain("Connection is closed");
  });

  it("returns FAIL instead of throwing when the connection is refused", async () => {
    connectImpl = async () => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:6379");
    };
    const result = await checkRedis({ REDIS_HOST: "localhost" });
    expect(result.status).toBe("FAIL");
    expect(result.detail).toContain("ECONNREFUSED");
  });

  it("closes the client after a successful check", async () => {
    await checkRedis({ REDIS_HOST: "localhost" });
    expect(client().quit).toHaveBeenCalled();
  });

  it("closes the client even after a failure", async () => {
    pingImpl = async () => {
      throw new Error("NOAUTH Authentication required");
    };
    const result = await checkRedis({ REDIS_HOST: "localhost" });
    expect(result.status).toBe("FAIL");
    expect(client().quit).toHaveBeenCalled();
  });

  it("does not leak the password into the reported detail", async () => {
    const result = await checkRedis({
      REDIS_HOST: "localhost",
      REDIS_PASSWORD: "placeholder-not-a-secret",
    });
    expect(result.detail).not.toContain("placeholder-not-a-secret");
  });
});
