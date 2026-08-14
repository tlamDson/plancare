import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { validTripPreferences, asUser } from "../integration-fixtures";

const app = createApp();

async function createQueuedJob(userId: string) {
  const res = await request(app)
    .post("/api/trips")
    .set(asUser(userId))
    .send({ preferences: validTripPreferences() });
  return { tripId: res.body.tripId as string, jobId: res.body.jobId as string };
}

describe("GET /api/jobs/:jobId", () => {
  it("maps BullMQ's priority-queue 'prioritized' state to QUEUED, not IDLE", async () => {
    // planner.service.ts always passes a `priority` option when adding the
    // job (1 for pro, 10 for free) — with any priority set, BullMQ reports
    // the job's state as "prioritized" rather than "waiting". This is the
    // exact regression documented in tech-defaults.md's "Bug IDLE" note.
    const { jobId } = await createQueuedJob("user-1");

    const res = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set(asUser("user-1"));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("QUEUED");
  });

  it("returns 404 for an unknown jobId", async () => {
    const res = await request(app)
      .get("/api/jobs/does-not-exist-999")
      .set(asUser("user-1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 (not a hang) when a different user requests the job", async () => {
    const { jobId } = await createQueuedJob("owner");

    const res = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set(asUser("someone-else"))
      .timeout({ response: 1500, deadline: 2000 });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/jobs/:jobId/retry", () => {
  it("returns 400 when the job has not failed yet", async () => {
    const { jobId } = await createQueuedJob("user-1");
    const res = await request(app)
      .post(`/api/jobs/${jobId}/retry`)
      .set(asUser("user-1"));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/jobs/:jobId/cancel", () => {
  it("cancels a queued job and marks the trip CANCELLED", async () => {
    const { tripId, jobId } = await createQueuedJob("user-1");

    const res = await request(app)
      .post(`/api/jobs/${jobId}/cancel`)
      .set(asUser("user-1"));
    expect(res.status).toBe(200);

    const trip = await request(app)
      .get(`/api/trips/${tripId}`)
      .set(asUser("user-1"));
    expect(trip.body.trip.status).toBe("CANCELLED");
  });
});
