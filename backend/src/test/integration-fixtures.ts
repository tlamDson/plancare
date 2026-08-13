/** Shared fixtures for backend integration tests (real Mongo/Redis, supertest). */

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
