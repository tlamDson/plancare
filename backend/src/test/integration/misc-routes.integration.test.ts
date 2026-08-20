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
  it("is unreachable outside local development (404, not even mounted)", async () => {
    // `/api/dev` is now gated at the app.use() mount by isDevRoutesEnabled()
    // (env.NODE_ENV === "development"), which trips in the "test" env this
    // suite runs under — so the whole route surface 404s regardless of auth,
    // before requireUserAuth or the controller's own NODE_ENV guard ever run.
    const res = await request(app).post("/api/dev/toggle-pro");
    expect(res.status).toBe(404);
  });

  it("stays 404 even once authenticated", async () => {
    const res = await request(app)
      .post("/api/dev/toggle-pro")
      .set(asUser("user-1"));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/dev/scrape-insights", () => {
  it("is unreachable outside local development (404, not even mounted)", async () => {
    const res = await request(app).post("/api/dev/scrape-insights");
    expect(res.status).toBe(404);
  });

  it("stays 404 even once authenticated", async () => {
    const res = await request(app)
      .post("/api/dev/scrape-insights")
      .set(asUser("user-1"));
    expect(res.status).toBe(404);
  });
});
