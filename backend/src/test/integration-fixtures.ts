/** Shared fixtures for backend integration tests (real Mongo/Redis, supertest). */

import User, { IUser } from "../features/user/models/User";
import Trip, { ITrip } from "../features/planner/models/Trip";

export function validTripPreferences(overrides: Record<string, unknown> = {}) {
  return {
    destination: "Da Nang, Vietnam",
    startDate: "2026-06-01T00:00:00.000Z",
    endDate: "2026-06-03T00:00:00.000Z",
    budget: { total: 100, currency: "USD" },
    travelers: { adults: 1, children: 0 },
    ...overrides,
  };
}

/**
 * Auth header consumed by `backend/src/test/clerk-express.stub.ts` (aliased
 * in for every integration test). Sets the identity of the "signed in" user
 * for a single supertest request.
 */
export function asUser(userId: string) {
  return { "x-test-user-id": userId };
}

/** Seeds a minimal User document directly via Mongoose (bypasses Clerk webhooks). */
export async function seedUser(
  clerkUserId: string,
  overrides: Partial<IUser> = {},
): Promise<IUser> {
  return User.create({
    clerkUserId,
    email: `${clerkUserId}@example.test`,
    firstName: "Test",
    lastName: "User",
    gender: "not_specified",
    dateOfBirth: new Date("1990-01-01"),
    tier: "free",
    preferences: { currency: "USD", budgetRange: 0, travelStyle: [] },
    notificationPreferences: {
      tripReminders: true,
      budgetAlerts: true,
      tripInvites: true,
      aiSuggestions: true,
      doNotDisturb: false,
    },
    ...overrides,
  } as Partial<IUser>);
}

/**
 * Seeds a minimal Trip document directly via Mongoose, bypassing
 * POST /api/trips (and therefore BullMQ) entirely — for tests that only
 * exercise mutation routes on an already-existing trip. Defaults to a
 * two-day itinerary with one activity per day so reorder/regen tests have
 * real subdocument `_id`s to target.
 */
export async function seedTrip(
  userId: string,
  overrides: Partial<ITrip> = {},
): Promise<ITrip> {
  return Trip.create({
    userId,
    title: "Da Nang Getaway",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-03"),
    budget: { currency: "USD", totalLimit: 500, totalSpent: 0, breakdown: [] },
    itinerary: [
      {
        day: 1,
        date: new Date("2026-06-01"),
        // Real coordinates (not just names) so recalcDayDistances() — called
        // by both reorder-activities and regen-activity — takes its normal
        // "compute a real distance" path instead of its missing-coordinates
        // fallback, which mirrors how activities actually look in production.
        activities: [
          {
            type: "poi",
            name: "Marble Mountains",
            order: 0,
            location: { type: "Point", coordinates: [108.263, 16.0035] },
          },
          {
            type: "poi",
            name: "Dragon Bridge",
            order: 1,
            location: { type: "Point", coordinates: [108.2245, 16.0611] },
          },
        ],
      },
      {
        day: 2,
        date: new Date("2026-06-02"),
        activities: [{ type: "poi", name: "My Khe Beach", order: 0 }],
      },
    ],
    isAgentProcessing: false,
    status: "COMPLETED",
    ...overrides,
  } as Partial<ITrip>);
}
