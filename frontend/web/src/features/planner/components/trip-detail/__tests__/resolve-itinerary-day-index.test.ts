import { describe, it, expect } from "vitest";
import { resolveItineraryDayIndex } from "../resolve-itinerary-day-index";
import type { ItineraryDay } from "@/utils/schemas";

function day(overrides: Partial<ItineraryDay> & { day: number }): ItineraryDay {
  return {
    date: "2026-06-01T00:00:00.000Z",
    activities: [],
    ...overrides,
  };
}

describe("resolveItineraryDayIndex", () => {
  it("returns -1 for an empty/undefined itinerary", () => {
    expect(resolveItineraryDayIndex(undefined, day({ day: 1 }))).toBe(-1);
    expect(resolveItineraryDayIndex([], day({ day: 1 }))).toBe(-1);
  });

  it("resolves by _id when the day has one, even if day numbers changed", () => {
    const itinerary = [day({ day: 1, _id: "a" }), day({ day: 2, _id: "b" })];
    // day.day no longer matches itinerary[1].day, but _id still does
    expect(
      resolveItineraryDayIndex(itinerary, day({ day: 99, _id: "b" })),
    ).toBe(1);
  });

  it("falls back to matching by day number when the day has no _id", () => {
    const itinerary = [day({ day: 1 }), day({ day: 2 })];
    expect(resolveItineraryDayIndex(itinerary, day({ day: 2 }))).toBe(1);
  });

  it("falls back to matching by day number when _id is present but not found", () => {
    const itinerary = [day({ day: 1, _id: "a" }), day({ day: 2, _id: "b" })];
    expect(
      resolveItineraryDayIndex(itinerary, day({ day: 2, _id: "unknown" })),
    ).toBe(1);
  });

  it("returns -1 when neither _id nor day number matches", () => {
    const itinerary = [day({ day: 1 })];
    expect(resolveItineraryDayIndex(itinerary, day({ day: 99 }))).toBe(-1);
  });
});
