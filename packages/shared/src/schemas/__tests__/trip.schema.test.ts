import { describe, it, expect } from "vitest";
import { TripPreferencesSchema } from "../trip.schema";

const basePreferences = {
  destination: "Da Nang, Vietnam",
  startDate: "2026-06-01T00:00:00.000Z",
  endDate: "2026-06-07T00:00:00.000Z",
  budget: { total: 1000 },
};

describe("TripPreferencesSchema — defaults", () => {
  it("applies all documented defaults", () => {
    const result = TripPreferencesSchema.parse(basePreferences);

    expect(result.pace).toBe("balanced");
    expect(result.focus).toEqual([]);
    expect(result.travelers).toEqual({ adults: 1, children: 0 });
    expect(result.activitiesPerDay).toBe(3);
    expect(result.transportMode).toBe("walking");
    expect(result.accommodationType).toBe("any");
    expect(result.includedMeals).toEqual([]);
    expect(result.constraints).toEqual({
      mobility_friendly: false,
      avoid_crowds: false,
      start_late: false,
      indoor_only: false,
      no_street_food: false,
      no_late_nights: false,
      foodAsMainActivities: false,
    });
    expect(result.budget.currency).toBe("USD");
  });

  it("does not alias the static `travelers` default object across parses", () => {
    const first = TripPreferencesSchema.parse(basePreferences);
    const second = TripPreferencesSchema.parse(basePreferences);

    (first.travelers as { adults: number }).adults = 99;

    expect(second.travelers.adults).toBe(1);
  });
});

describe("TripPreferencesSchema — validation errors", () => {
  it("rejects a destination shorter than 2 characters", () => {
    const result = TripPreferencesSchema.safeParse({
      ...basePreferences,
      destination: "D",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a zero budget", () => {
    const result = TripPreferencesSchema.safeParse({
      ...basePreferences,
      budget: { total: 0 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative budget", () => {
    const result = TripPreferencesSchema.safeParse({
      ...basePreferences,
      budget: { total: -50 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 3 focus areas", () => {
    const result = TripPreferencesSchema.safeParse({
      ...basePreferences,
      focus: ["Culture", "Nature", "Gastronomy", "Lifestyle"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects specialRequirements longer than 200 characters", () => {
    const result = TripPreferencesSchema.safeParse({
      ...basePreferences,
      specialRequirements: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown pace enum value", () => {
    const result = TripPreferencesSchema.safeParse({
      ...basePreferences,
      pace: "turbo",
    });
    expect(result.success).toBe(false);
  });

  it.each([1, 9])(
    "rejects activitiesPerDay = %i (outside 2-8 bounds)",
    (value) => {
      const result = TripPreferencesSchema.safeParse({
        ...basePreferences,
        activitiesPerDay: value,
      });
      expect(result.success).toBe(false);
    },
  );

  it.each([2, 8])("accepts activitiesPerDay = %i (bounds)", (value) => {
    const result = TripPreferencesSchema.safeParse({
      ...basePreferences,
      activitiesPerDay: value,
    });
    expect(result.success).toBe(true);
  });
});

describe("TripPreferencesSchema — startDate/endDate union", () => {
  it("accepts an ISO datetime string", () => {
    const result = TripPreferencesSchema.safeParse(basePreferences);
    expect(result.success).toBe(true);
  });

  it("accepts a native Date instance", () => {
    const result = TripPreferencesSchema.safeParse({
      ...basePreferences,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-07"),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a date-only string (no time component)", () => {
    // Regression guard: itinerary-chunker.service.ts currently emits
    // `toISOString().split("T")[0]` (date-only) for sliced chunk prefs,
    // which this union does NOT accept — see plan bug #7.
    const result = TripPreferencesSchema.safeParse({
      ...basePreferences,
      startDate: "2026-06-01",
      endDate: "2026-06-07",
    });
    expect(result.success).toBe(false);
  });
});

describe("TripPreferencesSchema — deprecated fields (backward compat)", () => {
  it("still parses trips persisted with legacy mood/interests/dealBreakers", () => {
    const result = TripPreferencesSchema.safeParse({
      ...basePreferences,
      mood: "foodie",
      interests: ["street food", "museums"],
      dealBreakers: ["no early mornings"],
    });
    expect(result.success).toBe(true);
  });
});

describe("TripPreferencesSchema — countryIdKey/cityIdKey passthrough", () => {
  it("accepts optional RAG lookup keys", () => {
    const result = TripPreferencesSchema.safeParse({
      ...basePreferences,
      countryIdKey: "vn",
      cityIdKey: "da_nang",
    });
    expect(result.success).toBe(true);
  });
});
