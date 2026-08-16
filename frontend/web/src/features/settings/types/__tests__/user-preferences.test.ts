import { describe, it, expect, beforeEach } from "vitest";
import {
  migrateUserPreferences,
  getUserPreferences,
  saveUserPreferences,
  DEFAULT_USER_PREFERENCES,
} from "../user-preferences.types";

beforeEach(() => {
  localStorage.clear();
});

describe("migrateUserPreferences", () => {
  it("returns full defaults for an empty object", () => {
    const result = migrateUserPreferences({});
    expect(result.focus).toEqual([]);
    expect(result.groupType).toBeNull();
    expect(result.transportMode).toBe("walking");
    expect(result.pace).toBe("balanced");
    expect(result.constraints).toEqual({
      mobility_friendly: false,
      avoid_crowds: false,
      foodAsMainActivities: false,
    });
    expect(result.specialRequirements).toBe("");
  });

  it("derives focus from legacy interests[] when focus is absent", () => {
    const result = migrateUserPreferences({ interests: ["food", "culture"] });
    expect(result.focus).toEqual(["Gastronomy", "Culture"]);
  });

  it("prefers an explicit focus[] over legacy interests[]", () => {
    const result = migrateUserPreferences({
      focus: ["Nature"],
      interests: ["food"],
    });
    expect(result.focus).toEqual(["Nature"]);
  });

  it("derives groupType from legacy travelStyle when groupType is absent", () => {
    const result = migrateUserPreferences({ travelStyle: "family" });
    expect(result.groupType).toBe("family_kids");
  });

  it("prefers an explicit groupType over legacy travelStyle", () => {
    const result = migrateUserPreferences({
      groupType: "solo",
      travelStyle: "family",
    });
    expect(result.groupType).toBe("solo");
  });

  it("derives transportMode from legacy travelMode when transportMode is absent", () => {
    const result = migrateUserPreferences({ travelMode: "Transit" });
    expect(result.transportMode).toBe("public_transport");
  });

  it("prefers an explicit transportMode over legacy travelMode", () => {
    const result = migrateUserPreferences({
      transportMode: "car",
      travelMode: "Transit",
    });
    expect(result.transportMode).toBe("car");
  });

  it("derives constraints.mobility_friendly from legacy accessible flag", () => {
    const result = migrateUserPreferences({ accessible: true });
    expect(result.constraints.mobility_friendly).toBe(true);
  });

  it("prefers explicit constraints.mobility_friendly over legacy accessible", () => {
    const result = migrateUserPreferences({
      accessible: true,
      constraints: { mobility_friendly: false },
    });
    expect(result.constraints.mobility_friendly).toBe(false);
  });

  it("derives specialRequirements from legacy specialMeals when absent", () => {
    const result = migrateUserPreferences({ specialMeals: "no peanuts" });
    expect(result.specialRequirements).toBe("no peanuts");
  });

  it("keeps an existing onboardingDefaults object untouched", () => {
    const onboardingDefaults = {
      focus: ["Nature"] as const,
      groupType: "solo" as const,
      transportMode: "car" as const,
      pace: "packed" as const,
      constraints: {
        mobility_friendly: true,
        avoid_crowds: false,
        foodAsMainActivities: false,
      },
      specialRequirements: "vegan",
    };
    const result = migrateUserPreferences({ onboardingDefaults });
    expect(result.onboardingDefaults).toEqual(onboardingDefaults);
  });

  it("synthesizes onboardingDefaults from top-level fields when absent", () => {
    const result = migrateUserPreferences({ interests: ["food"] });
    expect(result.onboardingDefaults?.focus).toEqual(["Gastronomy"]);
    expect(result.onboardingDefaults?.transportMode).toBe(
      DEFAULT_USER_PREFERENCES.transportMode,
    );
  });
});

describe("getUserPreferences", () => {
  it("returns defaults when localStorage has nothing stored", () => {
    const result = getUserPreferences();
    expect(result.currency).toBe("USD");
    expect(result.focus).toEqual([]);
  });

  it("returns defaults (does not throw) when localStorage has invalid JSON", () => {
    localStorage.setItem("user-preferences", "{not valid json");
    expect(() => getUserPreferences()).not.toThrow();
    expect(getUserPreferences()).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it("migrates a legacy stored shape and writes the migrated form back", () => {
    localStorage.setItem(
      "user-preferences",
      JSON.stringify({ interests: ["food"], travelStyle: "solo" }),
    );
    const result = getUserPreferences();
    expect(result.focus).toEqual(["Gastronomy"]);
    expect(result.groupType).toBe("solo");

    const stored = JSON.parse(localStorage.getItem("user-preferences")!);
    expect(stored.focus).toEqual(["Gastronomy"]);
  });
});

describe("saveUserPreferences", () => {
  it("merges a partial update onto the current preferences and persists it", () => {
    saveUserPreferences({ currency: "EUR" });
    const result = getUserPreferences();
    expect(result.currency).toBe("EUR");
  });

  it("preserves fields not included in the partial update", () => {
    saveUserPreferences({ currency: "EUR" });
    saveUserPreferences({ pace: "packed" });
    const result = getUserPreferences();
    expect(result.currency).toBe("EUR");
    expect(result.pace).toBe("packed");
  });
});
