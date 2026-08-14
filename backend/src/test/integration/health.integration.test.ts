import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app";

const app = createApp();

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  // APP_ENV is unset in this suite (integration-setup.ts only defaults
  // NODE_ENV to "test"), so appEnv falls back to NODE_ENV — this is the
  // fallback half of `appEnv = env.APP_ENV || env.NODE_ENV`. Lets a real
  // deploy confirm which environment answered via `curl <host>/health`
  // without guessing from the URL alone (e.g. Railway staging vs prod).
  it("reports the current environment via env", async () => {
    const res = await request(app).get("/health");
    expect(res.body.env).toBe(process.env.NODE_ENV);
  });
});

describe("GET /ready", () => {
  it("returns 200 ready when Mongo and Redis are both reachable", async () => {
    const res = await request(app).get("/ready");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
    expect(res.body.mongodb).toBe("connected");
    expect(res.body.redis).toBe("connected");
  });

  it("reports the current environment via env", async () => {
    const res = await request(app).get("/ready");
    expect(res.body.env).toBe(process.env.NODE_ENV);
  });
});
