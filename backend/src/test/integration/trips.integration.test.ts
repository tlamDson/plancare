import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { validTripPreferences } from "../integration-fixtures";

// Bypasses real Clerk session verification: `requireAuth()`'s returned
// middleware reads a per-request test header so each supertest call can act
// as a different user without a real Clerk session token.
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

describe("POST /api/trips", () => {
  it("requires authentication", async () => {
    const res = await request(app)
      .post("/api/trips")
      .send({ preferences: validTripPreferences() });
    expect(res.status).toBe(401);
  });

  it("rejects invalid preferences with 400", async () => {
    const res = await request(app)
      .post("/api/trips")
      .set(asUser("user-1"))
      .send({ preferences: { destination: "D" } }); // fails min(2), missing dates/budget
    expect(res.status).toBe(400);
  });

  it("rejects a budget below $20/day/person", async () => {
    const res = await request(app)
      .post("/api/trips")
      .set(asUser("user-1"))
      .send({
        preferences: validTripPreferences({
          budget: { total: 5, currency: "USD" },
        }),
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/day/i);
  });

  it("queues a trip and returns 202 with jobId + tripId", async () => {
    const res = await request(app)
      .post("/api/trips")
      .set(asUser("user-1"))
      .send({ preferences: validTripPreferences() });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.jobId).toBe("string");
    expect(typeof res.body.tripId).toBe("string");
  });

  it("is idempotent: the same X-Idempotency-Key returns the same tripId without creating a second trip", async () => {
    const key = "11111111-1111-4111-8111-111111111111";
    const first = await request(app)
      .post("/api/trips")
      .set(asUser("user-1"))
      .set("X-Idempotency-Key", key)
      .send({ preferences: validTripPreferences() });
    expect(first.status).toBe(202);

    const second = await request(app)
      .post("/api/trips")
      .set(asUser("user-1"))
      .set("X-Idempotency-Key", key)
      .send({ preferences: validTripPreferences() });

    expect(second.status).toBe(200);
    expect(second.body.idempotent).toBe(true);
    expect(second.body.tripId).toBe(first.body.tripId);

    const list = await request(app).get("/api/trips").set(asUser("user-1"));
    expect(list.body.trips).toHaveLength(1);
  });
});

describe("GET /api/trips/:tripId", () => {
  it("returns 403 when the trip belongs to a different user", async () => {
    const created = await request(app)
      .post("/api/trips")
      .set(asUser("owner"))
      .send({ preferences: validTripPreferences() });

    const res = await request(app)
      .get(`/api/trips/${created.body.tripId}`)
      .set(asUser("someone-else"));
    expect(res.status).toBe(403);
  });

  it("returns the trip with status QUEUED for its owner", async () => {
    const created = await request(app)
      .post("/api/trips")
      .set(asUser("owner"))
      .send({ preferences: validTripPreferences() });

    const res = await request(app)
      .get(`/api/trips/${created.body.tripId}`)
      .set(asUser("owner"));
    expect(res.status).toBe(200);
    expect(res.body.trip.status).toBe("QUEUED");
  });
});

describe("GET /api/trips", () => {
  it("filters by status and limit query params", async () => {
    await request(app)
      .post("/api/trips")
      .set(asUser("owner"))
      .send({ preferences: validTripPreferences() });

    const res = await request(app)
      .get("/api/trips?status=QUEUED&limit=5")
      .set(asUser("owner"));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.trips)).toBe(true);
    expect(res.body.trips.length).toBeGreaterThanOrEqual(1);
  });
});
