import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// Must run before any import of app.ts/config/env.ts, which read
// process.env once at module-load time (envalid's cleanEnv). Vitest gives
// each integration test file its own module registry, so this mutation
// doesn't leak into other files' `env` — but process.env itself IS a real
// global, so it's still restored in afterAll to be safe regardless of
// file execution order.
process.env.ENABLE_RELIABILITY_API = "true";
process.env.SRE_ADMIN_EMAILS = "admin@example.com";

// getClerkUserPrimaryEmail makes a REAL network call to Clerk's REST API
// (unrelated to the @clerk/express session stub aliased in for every
// integration test) — mocked here the same way @clerk/express itself is
// stubbed, so this suite never depends on network access or a real key.
const mockGetEmail = vi.fn();
vi.mock("../../features/calendar/services/clerk-primary-email.service", () => ({
  getClerkUserPrimaryEmail: (...args: unknown[]) => mockGetEmail(...args),
}));

import request from "supertest";
import { createApp } from "../../app";
import { asUser } from "../integration-fixtures";
import JobMetric from "../../features/reliability/models/JobMetric";

const app = createApp();

function makeDoc(jobId: string, outcome: string, finishedAt: Date) {
  return {
    queue: "trip-generation",
    jobName: "generate-trip",
    jobId,
    outcome,
    attemptsMade: 1,
    queueWaitMs: 100,
    processingMs: 200,
    endToEndMs: 300,
    finishedAt,
  };
}

afterAll(() => {
  delete process.env.ENABLE_RELIABILITY_API;
  delete process.env.SRE_ADMIN_EMAILS;
});

describe("GET /api/reliability/slo — access control (flag on)", () => {
  beforeEach(() => {
    mockGetEmail.mockReset();
  });

  it("401s an unauthenticated request", async () => {
    const res = await request(app).get("/api/reliability/slo");
    expect(res.status).toBe(401);
  });

  it("403s an authenticated user whose email isn't on SRE_ADMIN_EMAILS", async () => {
    mockGetEmail.mockResolvedValue("stranger@example.com");
    const res = await request(app)
      .get("/api/reliability/slo")
      .set(asUser("user-stranger"));
    expect(res.status).toBe(403);
  });

  it("400s an invalid windowDays query param", async () => {
    mockGetEmail.mockResolvedValue("admin@example.com");
    const res = await request(app)
      .get("/api/reliability/slo?windowDays=abc")
      .set(asUser("user-admin"));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/reliability/slo — report content for an allowlisted admin", () => {
  beforeEach(() => {
    mockGetEmail.mockResolvedValue("admin@example.com");
  });

  it("returns 200 with insufficientData:true and no NaN when there is no recorded data", async () => {
    const res = await request(app)
      .get("/api/reliability/slo")
      .set(asUser("user-admin"));

    expect(res.status).toBe(200);
    expect(res.body.windows.compliance.sli.insufficientData).toBe(true);
    expect(res.body.windows.compliance.sli.sli).toBeNull();
    expect(
      Number.isNaN(res.body.windows.compliance.errorBudget.consumedRatio),
    ).toBe(false);
  });

  it("proves the honest FALLBACK definition survives the full stack — 90 completed / 5 fallback / 5 failed real documents yields sli≈0.9, consumedRatio≈1.0", async () => {
    const now = new Date();
    const docs = [
      ...Array.from({ length: 90 }, (_, i) =>
        makeDoc(`c-${i}`, "completed", now),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        makeDoc(`f-${i}`, "fallback", now),
      ),
      ...Array.from({ length: 5 }, (_, i) => makeDoc(`x-${i}`, "failed", now)),
    ];
    await JobMetric.insertMany(docs);

    const res = await request(app)
      .get("/api/reliability/slo")
      .set(asUser("user-admin"));

    expect(res.status).toBe(200);
    // toBeCloseTo, not toBe — validEvents * (1 - target) is a float
    // artifact (see Phase 3's slo-math.test.ts for the same lesson).
    expect(res.body.windows.compliance.sli.sli).toBeCloseTo(0.9);
    expect(res.body.windows.compliance.errorBudget.consumedRatio).toBeCloseTo(
      1.0,
    );
    expect(res.body.signals.errors.fallbackRate).toBeCloseTo(0.05);
    expect(res.body.signals.errors.failureRate).toBeCloseTo(0.05);
  });
});
