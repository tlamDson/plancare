import type { Trip } from "@/features/planner/api/trips.api";
import type { Activity } from "@/utils/schemas";

export function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    _id: "act-1",
    type: "poi",
    name: "Some Place",
    status: "planned",
    order: 0,
    ...overrides,
  };
}

export function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    _id: "trip-1",
    userId: "user-1",
    title: "Trip to Da Nang",
    startDate: "2026-06-01T00:00:00.000Z",
    endDate: "2026-06-03T00:00:00.000Z",
    budget: { currency: "USD", totalLimit: 500, totalSpent: 0, breakdown: [] },
    itinerary: [],
    cities: [],
    isAgentProcessing: false,
    version: 1,
    status: "COMPLETED",
    lifecycle: "UPCOMING",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}
