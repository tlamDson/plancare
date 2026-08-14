import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { GENERAL_RATE_LIMIT_MAX } from "../../middlewares/rate-limiter";

const app = createApp();

describe("generalLimiter — mounted globally", () => {
  it("attaches standard RateLimit-* headers on a normal route", async () => {
    // standardHeaders: true resolves to the draft-6 header set:
    // RateLimit-Limit / RateLimit-Remaining / RateLimit-Reset.
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["ratelimit-limit"]).toBeDefined();
    expect(res.headers["ratelimit-remaining"]).toBeDefined();
  });

  it("does NOT attach RateLimit-* headers on /health (liveness probe)", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.headers["ratelimit-limit"]).toBeUndefined();
  });

  it("does NOT attach RateLimit-* headers on /ready (readiness probe)", async () => {
    const res = await request(app).get("/ready");
    expect(res.status).toBe(200);
    expect(res.headers["ratelimit-limit"]).toBeUndefined();
  });

  it("returns 429 once the window's request budget is exhausted", async () => {
    let lastRes;
    for (let i = 0; i < GENERAL_RATE_LIMIT_MAX + 1; i++) {
      lastRes = await request(app).get("/");
    }
    expect(lastRes!.status).toBe(429);
    expect(lastRes!.body.error).toMatch(/too many requests/i);
  }, 20_000);
});
