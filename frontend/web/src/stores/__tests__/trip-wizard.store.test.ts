import { describe, it, expect, beforeEach } from "vitest";
import { useTripWizardStore } from "../trip-wizard.store";

const INITIAL_STATE = useTripWizardStore.getState();

beforeEach(() => {
  useTripWizardStore.setState(INITIAL_STATE, true);
});

describe("initWizard", () => {
  it("converts the 500 USD default budget into the given currency", () => {
    useTripWizardStore.getState().initWizard("EUR");
    const { budget } = useTripWizardStore.getState().data;
    expect(budget.currency).toBe("EUR");
    expect(budget.total).toBe(Math.round(500 * 0.92));
  });

  it("keeps the same total when currency is already USD", () => {
    useTripWizardStore.getState().initWizard("USD");
    expect(useTripWizardStore.getState().data.budget).toEqual({
      total: 500,
      currency: "USD",
    });
  });

  it("merges user preferences: focus (capped at 3), groupType, transportMode, pace, specialRequirements", () => {
    useTripWizardStore.getState().initWizard("USD", {
      focus: ["Culture", "Nature", "Gastronomy", "Lifestyle"],
      groupType: "solo",
      transportMode: "car",
      pace: "packed",
      specialRequirements: "vegetarian",
    });
    const { data } = useTripWizardStore.getState();
    expect(data.focus).toEqual(["Culture", "Nature", "Gastronomy"]);
    expect(data.groupType).toBe("solo");
    expect(data.transportMode).toBe("car");
    expect(data.pace).toBe("packed");
    expect(data.specialRequirements).toBe("vegetarian");
  });

  it("merges partial constraints on top of existing defaults rather than replacing wholesale", () => {
    useTripWizardStore.getState().initWizard("USD", {
      constraints: { avoid_crowds: true } as never,
    });
    const { constraints } = useTripWizardStore.getState().data;
    expect(constraints.avoid_crowds).toBe(true);
    expect(constraints.mobility_friendly).toBe(false);
  });

  it("leaves fields untouched when no userPrefs are given", () => {
    useTripWizardStore.getState().setData({ groupType: "family_kids" });
    useTripWizardStore.getState().initWizard("USD");
    expect(useTripWizardStore.getState().data.groupType).toBe("family_kids");
  });
});

describe("setData / setTravelers / setBudget / setPriorities", () => {
  it("setData shallow-merges a partial update", () => {
    useTripWizardStore.getState().setData({ title: "My Trip" });
    expect(useTripWizardStore.getState().data.title).toBe("My Trip");
    expect(useTripWizardStore.getState().data.destination).toBe("");
  });

  it("setTravelers replaces the travelers object", () => {
    useTripWizardStore.getState().setTravelers({ adults: 2, children: 1 });
    expect(useTripWizardStore.getState().data.travelers).toEqual({
      adults: 2,
      children: 1,
    });
  });

  it("setBudget replaces the budget object", () => {
    useTripWizardStore.getState().setBudget({ total: 2000, currency: "EUR" });
    expect(useTripWizardStore.getState().data.budget).toEqual({
      total: 2000,
      currency: "EUR",
    });
  });

  it("setPriorities replaces the priorities object", () => {
    useTripWizardStore
      .getState()
      .setPriorities({ money: 10, comfort: 1, unique: 3 });
    expect(useTripWizardStore.getState().data.priorities).toEqual({
      money: 10,
      comfort: 1,
      unique: 3,
    });
  });
});

describe("reset", () => {
  it("clears all fields back to initial defaults", () => {
    useTripWizardStore.getState().setData({ title: "Something" });
    useTripWizardStore.getState().setTravelers({ adults: 5, children: 5 });
    useTripWizardStore.getState().reset();
    const { data } = useTripWizardStore.getState();
    expect(data.title).toBe("");
    expect(data.travelers).toEqual({ adults: 1, children: 0 });
    expect(data.budget).toEqual({ total: 500, currency: "USD" });
  });
});
