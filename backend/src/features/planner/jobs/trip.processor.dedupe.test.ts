import { describe, it, expect } from "vitest";
import { dedupeValidatedPlaces } from "./trip.processor";

describe("dedupeValidatedPlaces", () => {
  it("drops a later place with a duplicate googlePlaceId", () => {
    const { kept, dropped } = dedupeValidatedPlaces([
      { name: "Place A", googlePlaceId: "g1", coordinates: [105.8, 21.0] },
      { name: "Place A Copy", googlePlaceId: "g1", coordinates: [105.9, 21.1] },
    ]);
    expect(kept).toHaveLength(1);
    expect(kept[0].name).toBe("Place A");
    expect(dropped).toEqual([
      { reason: "googlePlaceId", name: "Place A Copy" },
    ]);
  });

  it("drops a later place whose normalized name matches an earlier one", () => {
    const { kept, dropped } = dedupeValidatedPlaces([
      { name: "Ho Tay!", coordinates: [105.8, 21.0] },
      { name: "ho tay", coordinates: [105.9, 21.1] },
    ]);
    expect(kept).toHaveLength(1);
    expect(kept[0].name).toBe("Ho Tay!");
    expect(dropped).toEqual([{ reason: "name", name: "ho tay" }]);
  });

  it("drops a later place within 100m of an already-kept place", () => {
    const { kept, dropped } = dedupeValidatedPlaces([
      { name: "Coffee Shop", coordinates: [105.85, 21.03] },
      // ~50m away, distinct name
      { name: "Coffee Shop Annex", coordinates: [105.8505, 21.03] },
    ]);
    expect(kept).toHaveLength(1);
    expect(dropped).toEqual([
      { reason: "distance", name: "Coffee Shop Annex" },
    ]);
  });

  it("does not treat two [0,0] passthrough places as duplicates of each other", () => {
    const { kept, dropped } = dedupeValidatedPlaces([
      { name: "Unresolved A", coordinates: [0, 0] },
      { name: "Unresolved B", coordinates: [0, 0] },
    ]);
    expect(kept).toHaveLength(2);
    expect(dropped).toEqual([]);
  });

  it("keeps distinct places that are far apart with different names/ids", () => {
    const { kept, dropped } = dedupeValidatedPlaces([
      { name: "Hanoi Opera House", coordinates: [105.858, 21.024] },
      { name: "Ben Thanh Market", coordinates: [106.698, 10.772] },
    ]);
    expect(kept).toHaveLength(2);
    expect(dropped).toEqual([]);
  });
});
