import { describe, it, expect } from "vitest";
import { getTripDays, buildPreferences } from "../create-trip-dialog.utils";
import type { TripWizardData } from "@/stores/trip-wizard.store";

describe("getTripDays", () => {
  it("returns null when either date is missing", () => {
    expect(getTripDays("", "2026-06-05")).toBeNull();
    expect(getTripDays("2026-06-01", "")).toBeNull();
  });

  it("returns null for an invalid date string", () => {
    expect(getTripDays("not-a-date", "2026-06-05")).toBeNull();
  });

  it("computes the inclusive-ish day count via ceil", () => {
    expect(getTripDays("2026-06-01", "2026-06-05")).toBe(4);
  });

  it("returns null when the span is less than 1 day", () => {
    expect(getTripDays("2026-06-05", "2026-06-01")).toBeNull();
  });

  it("returns null when the span exceeds 90 days", () => {
    expect(getTripDays("2026-01-01", "2026-06-01")).toBeNull();
  });

  it("accepts exactly 90 days", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    const end = new Date(start.getTime() + 90 * 86400000);
    expect(getTripDays(start.toISOString(), end.toISOString())).toBe(90);
  });
});

function baseWizardData(
  overrides: Partial<TripWizardData> = {},
): TripWizardData {
  return {
    title: "My Trip",
    destination: "Da Nang, Vietnam",
    startDate: "2026-06-01",
    endDate: "2026-06-03",
    travelers: { adults: 1, children: 0 },
    budget: { total: 500, currency: "USD" },
    priorities: { money: 5, comfort: 5, unique: 5 },
    accommodationType: "hotel",
    accommodationFlexible: true,
    pace: "balanced",
    focus: ["Culture"],
    constraints: {
      mobility_friendly: false,
      avoid_crowds: false,
      start_late: false,
      indoor_only: false,
      no_street_food: false,
      no_late_nights: false,
      foodAsMainActivities: false,
    },
    specialRequirements: "",
    includedMeals: [],
    mood: "",
    interests: [],
    dealBreakers: [],
    transportMode: "walking",
    activitiesPerDay: 3,
    ...overrides,
  };
}

describe("buildPreferences", () => {
  it("maps pace to activitiesPerDay via PACE_TO_ACTIVITIES", () => {
    expect(
      buildPreferences(baseWizardData({ pace: "relaxed" })).activitiesPerDay,
    ).toBe(2);
    expect(
      buildPreferences(baseWizardData({ pace: "balanced" })).activitiesPerDay,
    ).toBe(4);
    expect(
      buildPreferences(baseWizardData({ pace: "packed" })).activitiesPerDay,
    ).toBe(6);
  });

  it("defaults an empty accommodationType to 'any'", () => {
    expect(
      buildPreferences(baseWizardData({ accommodationType: "" }))
        .accommodationType,
    ).toBe("any");
  });

  it("trims the destination", () => {
    expect(
      buildPreferences(baseWizardData({ destination: "  Hanoi  " }))
        .destination,
    ).toBe("Hanoi");
  });

  it("omits empty interests/dealBreakers/specialRequirements as undefined", () => {
    const prefs = buildPreferences(
      baseWizardData({
        interests: [],
        dealBreakers: [],
        specialRequirements: "",
      }),
    );
    expect(prefs.interests).toBeUndefined();
    expect(prefs.dealBreakers).toBeUndefined();
    expect(prefs.specialRequirements).toBeUndefined();
  });

  it("keeps non-empty interests/dealBreakers/specialRequirements", () => {
    const prefs = buildPreferences(
      baseWizardData({
        interests: ["food"],
        dealBreakers: ["no early mornings"],
        specialRequirements: "vegetarian",
      }),
    );
    expect(prefs.interests).toEqual(["food"]);
    expect(prefs.dealBreakers).toEqual(["no early mornings"]);
    expect(prefs.specialRequirements).toBe("vegetarian");
  });

  it("passes through countryIdKey/cityIdKey when set", () => {
    const prefs = buildPreferences(
      baseWizardData({ countryIdKey: "vn", cityIdKey: "da_nang" }),
    );
    expect(prefs.countryIdKey).toBe("vn");
    expect(prefs.cityIdKey).toBe("da_nang");
  });
});
