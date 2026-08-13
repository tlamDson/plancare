import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { validTripPreferences } from "../integration-fixtures";

vi.mock("@clerk/express", () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) =>
    next(),
  requireAuth:
    () =>
    (
      req: {
        headers: Record<string, string | undefined>;
        auth?: () => { userId: string } | null;
      },
      res: { status: (n: number) => { json: (b: unknown) => void } },
      next: () => void,
    ) => {
      const userId = req.headers["x-test-user-id"];
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      req.auth = () => ({ userId });
      next();
    },
}));

const app = createApp();

function asUser(userId: string) {
  return { "x-test-user-id": userId };
}

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

  it("[BUG #9] hangs (no response) instead of returning 403 when a different user requests the job", async () => {
    const { jobId } = await createQueuedJob("owner");

    // job.controller.ts's getJobStatus catches FORBIDDEN_JOB_ACCESS with a
    // bare `return;` — no res.status()/res.json() call — so the request
    // never completes. We bound it with a short response timeout and
    // assert it times out, documenting the current (broken) behavior
    // rather than hanging the test suite indefinitely.
    await expect(
      request(app)
        .get(`/api/jobs/${jobId}`)
        .set(asUser("someone-else"))
        .timeout({ response: 1500, deadline: 2000 }),
    ).rejects.toThrow(/timeout/i);
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
