import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { asUser, seedTrip } from "../integration-fixtures";

const app = createApp();

describe("POST /api/trips/:tripId/cancel", () => {
  it("returns 404 for an unknown trip", async () => {
    const res = await request(app)
      .post("/api/trips/000000000000000000000000/cancel")
      .set(asUser("owner"));
    expect(res.status).toBe(404);
  });

  it("returns 403 for a non-owner", async () => {
    const trip = await seedTrip("owner", { isAgentProcessing: true });
    const res = await request(app)
      .post(`/api/trips/${trip._id}/cancel`)
      .set(asUser("someone-else"));
    expect(res.status).toBe(403);
  });

  it("returns 400 when the trip is not currently processing", async () => {
    const trip = await seedTrip("owner", { isAgentProcessing: false });
    const res = await request(app)
      .post(`/api/trips/${trip._id}/cancel`)
      .set(asUser("owner"));
    expect(res.status).toBe(400);
  });

  it("cancels a trip that is locked by the AI agent", async () => {
    // acquireLock() runs right after a trip is queued (planner.service.ts),
    // so a QUEUED trip already has isAgentProcessing:true — this is the
    // state the UI's "Cancel Generation" button actually calls into.
    const trip = await seedTrip("owner", {
      isAgentProcessing: true,
      status: "QUEUED",
    });
    const res = await request(app)
      .post(`/api/trips/${trip._id}/cancel`)
      .set(asUser("owner"));
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/trips/:tripId/undo", () => {
  it("returns 409 when there is no undo history", async () => {
    const trip = await seedTrip("owner");
    const res = await request(app)
      .patch(`/api/trips/${trip._id}/undo`)
      .set(asUser("owner"));
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/No undo history/);
  });

  it("restores the most recent itinerary snapshot", async () => {
    const originalItinerary = [
      {
        day: 1,
        date: new Date("2026-06-01"),
        activities: [{ type: "poi", name: "Old Place", order: 0 }],
      },
    ];
    const trip = await seedTrip("owner", {
      itinerary: [
        {
          day: 1,
          date: new Date("2026-06-01"),
          activities: [{ type: "poi", name: "New Place", order: 0 }],
        },
      ],
      itineraryHistory: [{ snapshot: originalItinerary, savedAt: new Date() }],
    } as any);

    const res = await request(app)
      .patch(`/api/trips/${trip._id}/undo`)
      .set(asUser("owner"));

    expect(res.status).toBe(200);
    expect(res.body.itinerary[0].activities[0].name).toBe("Old Place");
  });
});

describe("GET /api/trips/:tripId/chunks/:chunkIndex", () => {
  it("returns 400 for a trip that does not use chunked generation", async () => {
    const trip = await seedTrip("owner");
    const res = await request(app)
      .get(`/api/trips/${trip._id}/chunks/0`)
      .set(asUser("owner"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the chunk index is out of range", async () => {
    const trip = await seedTrip("owner", {
      totalChunks: 2,
      chunksReady: [true, true],
    } as any);
    const res = await request(app)
      .get(`/api/trips/${trip._id}/chunks/5`)
      .set(asUser("owner"));
    expect(res.status).toBe(404);
  });

  it("returns 202 while the chunk is still generating", async () => {
    const trip = await seedTrip("owner", {
      totalChunks: 2,
      chunksReady: [true, false],
    } as any);
    const res = await request(app)
      .get(`/api/trips/${trip._id}/chunks/1`)
      .set(asUser("owner"));
    expect(res.status).toBe(202);
    expect(res.body.ready).toBe(false);
  });

  it("returns the 3 days belonging to a ready chunk", async () => {
    const days = Array.from({ length: 3 }, (_, i) => ({
      day: i + 1,
      date: new Date(`2026-06-0${i + 1}`),
      activities: [{ type: "poi", name: `Place ${i + 1}`, order: 0 }],
    }));
    const trip = await seedTrip("owner", {
      itinerary: days,
      totalChunks: 1,
      chunksReady: [true],
    } as any);

    const res = await request(app)
      .get(`/api/trips/${trip._id}/chunks/0`)
      .set(asUser("owner"));

    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
    expect(res.body.days).toHaveLength(3);
  });
});
