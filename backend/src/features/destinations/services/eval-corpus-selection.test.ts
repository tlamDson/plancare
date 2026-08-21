import { describe, it, expect } from "vitest";
import { selectEvalCorpusCities } from "./eval-corpus-selection";
import type { CountrySeedPayload } from "./world-destinations.builder";

describe("selectEvalCorpusCities", () => {
  const vn: CountrySeedPayload = {
    idKey: "vn",
    name: "Việt Nam",
    nameEn: "Vietnam",
    isSupported: true,
    cities: [
      {
        idKey: "hanoi",
        name: "Hà Nội",
        nameEn: "Hanoi",
        timezone: "Asia/Ho_Chi_Minh",
      },
      {
        idKey: "hochiminh",
        name: "TP. Hồ Chí Minh",
        nameEn: "Ho Chi Minh City",
        timezone: "Asia/Ho_Chi_Minh",
      },
    ],
  };
  const fr: CountrySeedPayload = {
    idKey: "fr",
    name: "Pháp",
    nameEn: "France",
    isSupported: true,
    cities: [
      {
        idKey: "paris",
        name: "Paris",
        nameEn: "Paris",
        timezone: "Europe/Paris",
      },
    ],
  };
  const notSupported: CountrySeedPayload = {
    idKey: "zz",
    name: "Unsupported",
    nameEn: "Unsupported",
    isSupported: false,
    cities: [
      {
        idKey: "somewhere",
        name: "Somewhere",
        nameEn: "Somewhere",
        timezone: "UTC",
      },
    ],
  };

  it("picks exactly 1 representative city per isSupported (RAG_ISO2) country", () => {
    const selected = selectEvalCorpusCities([vn, fr, notSupported]);

    expect(selected).toHaveLength(2); // vn + fr, not the unsupported one
    expect(selected.map((s) => s.countryIdKey)).toEqual(["vn", "fr"]);
  });

  it("always picks the first city in the country's list (matches capital-first ordering from mergeCapitalIfMissing)", () => {
    const selected = selectEvalCorpusCities([vn]);
    expect(selected[0]).toEqual({
      countryIdKey: "vn",
      countryNameEn: "Vietnam",
      cityIdKey: "hanoi",
      cityNameEn: "Hanoi",
    });
  });

  it("skips a supported country that has no cities (should never happen, but must not crash)", () => {
    const empty: CountrySeedPayload = {
      idKey: "xx",
      name: "Empty",
      nameEn: "Empty",
      isSupported: true,
      cities: [],
    };
    const selected = selectEvalCorpusCities([empty]);
    expect(selected).toEqual([]);
  });

  it("returns an empty array when nothing is supported", () => {
    expect(selectEvalCorpusCities([notSupported])).toEqual([]);
  });
});
