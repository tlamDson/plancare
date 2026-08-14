import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { asUser } from "../integration-fixtures";

const app = createApp();

describe("GET /", () => {
  it("returns a live message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/TravelPlan API is live/);
  });
});

describe("GET /api/docs", () => {
  it("serves the swagger UI", async () => {
    const res = await request(app).get("/api/docs").redirects(1);
    expect(res.status).toBeLessThan(400);
  });
});

describe("GET /ready", () => {
  it("returns ready when Mongo and Redis are both reachable", async () => {
    const res = await request(app).get("/ready");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
  });
});

describe("GET /api/weather/forecast", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/weather/forecast?q=Da Nang");
    expect(res.status).toBe(401);
  });

  it("returns 400 when the q query param is missing", async () => {
    const res = await request(app)
      .get("/api/weather/forecast")
      .set(asUser("user-1"));
    expect(res.status).toBe(400);
  });

  it("returns 503 WEATHER_NOT_CONFIGURED when no OpenWeather key is set", async () => {
    // integration-setup.ts never sets OPENWEATHER_API_KEY, so it defaults to
    // "" (envalid) — the guard in openweather-proxy.service.ts short-circuits
    // before any network call, keeping this hermetic.
    const res = await request(app)
      .get("/api/weather/forecast?q=Da Nang")
      .set(asUser("user-1"));
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("WEATHER_NOT_CONFIGURED");
  });
});

describe("POST /api/dev/toggle-pro", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/dev/toggle-pro");
    expect(res.status).toBe(401);
  });

  it("returns 403 outside local development even once authenticated", async () => {
    // requireUserAuth runs before toggleProStatus in the route chain, so an
    // authenticated request is the only way to reach the controller's own
    // `env.NODE_ENV !== "development"` guard — which trips in the "test" env
    // this suite runs under. Characterizes the route as unreachable outside
    // local dev regardless of who's calling it.
    const res = await request(app)
      .post("/api/dev/toggle-pro")
      .set(asUser("user-1"));
    expect(res.status).toBe(403);
  });
});

describe("POST /api/dev/scrape-insights", () => {
  it("[BUG] runs with NO authentication at all — DoS vector on a public repo", async () => {
    // This route fans out one BullMQ job per stale city with zero auth
    // middleware, mounted unconditionally in app.ts. Any anonymous caller
    // can trigger it repeatedly. Documented as a known vulnerability in
    // .claude/rules/tech-defaults.md — fix belongs in its own PR, not here.
    const res = await request(app).post("/api/dev/scrape-insights");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.jobsAdded).toBe("number");
  });
});
