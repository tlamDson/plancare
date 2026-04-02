import { describe, it, expect } from "vitest";
import {
  mapCityToApiDto,
  mapCountryToApiDto,
  sortDestinationsAlphabeticallyByNameEn,
  assertEveryCountryHasCities,
} from "./destination-list.mappers";

describe("destination-list.mappers", () => {
  it("sorts by nameEn", () => {
    const rows = [{ nameEn: "Zed" }, { nameEn: "Alba" }];
    expect(sortDestinationsAlphabeticallyByNameEn(rows).map((r) => r.nameEn)).toEqual([
      "Alba",
      "Zed",
    ]);
  });

  it("maps hasRagInsight from insightText", () => {
    expect(mapCityToApiDto({ idKey: "a", name: "A", nameEn: "A", timezone: "UTC" }).hasRagInsight).toBe(
      false,
    );
    expect(
      mapCityToApiDto({
        idKey: "a",
        name: "A",
        nameEn: "A",
        timezone: "UTC",
        insightText: "x",
      }).hasRagInsight,
    ).toBe(true);
  });

  it("assertEveryCountryHasCities throws on empty", () => {
    expect(() => assertEveryCountryHasCities([{ idKey: "x", cities: [] }])).toThrow(/x/);
  });

  it("mapCountryToApiDto strips insight from nested shape", () => {
    const dto = mapCountryToApiDto({
      idKey: "vn",
      name: "Vietnam",
      nameEn: "Vietnam",
      isSupported: true,
      cities: [
        {
          idKey: "hanoi",
          name: "Hanoi",
          nameEn: "Hanoi",
          timezone: "Asia/Ho_Chi_Minh",
          insightText: "  ",
        },
      ],
    });
    expect(dto.cities[0]?.hasRagInsight).toBe(false);
  });
});
