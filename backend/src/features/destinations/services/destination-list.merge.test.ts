import { describe, it, expect } from "vitest";
import { mergeWorldPayloadsWithMongoCountries } from "./destination-list.merge";
import type { CountrySeedPayload } from "./world-destinations.builder";
import type { LeanCountryDoc } from "./destination-list.mappers";

describe("mergeWorldPayloadsWithMongoCountries", () => {
  const built: CountrySeedPayload[] = [
    {
      idKey: "zz",
      name: "Zed",
      nameEn: "Zedland",
      flagEmoji: "🏳️",
      isSupported: true,
      cities: [
        {
          idKey: "zz_cap",
          name: "Capital",
          nameEn: "Capital",
          timezone: "UTC",
        },
        {
          idKey: "zz_other",
          name: "Other",
          nameEn: "Other City",
          timezone: "UTC",
        },
      ],
    },
    {
      idKey: "aa",
      name: "Aye",
      nameEn: "Alphaland",
      isSupported: false,
      cities: [{ idKey: "aa_main", name: "Main", nameEn: "Main", timezone: "UTC" }],
    },
  ];

  it("returns all built countries when DB is empty; sorts by nameEn", () => {
    const out = mergeWorldPayloadsWithMongoCountries(built, []);
    expect(out.map((c) => c.idKey)).toEqual(["aa", "zz"]);
    expect(out[0]!.isSupported).toBe(false);
    expect(out[1]!.isSupported).toBe(true);
    expect(out[1]!.cities.every((c) => c.hasRagInsight === false)).toBe(true);
  });

  it("overlays insightText from Mongo for matching city idKeys", () => {
    const db: LeanCountryDoc[] = [
      {
        idKey: "zz",
        name: "Zed DB",
        nameEn: "Zedland",
        isSupported: true,
        cities: [
          {
            idKey: "zz_cap",
            name: "Capital",
            nameEn: "Capital",
            timezone: "UTC",
            insightText: "  RAG body  ",
          },
        ],
      },
    ];
    const out = mergeWorldPayloadsWithMongoCountries(built, db);
    const zz = out.find((c) => c.idKey === "zz");
    expect(zz?.name).toBe("Zed DB");
    const cap = zz?.cities.find((c) => c.idKey === "zz_cap");
    const other = zz?.cities.find((c) => c.idKey === "zz_other");
    expect(cap?.hasRagInsight).toBe(true);
    expect(other?.hasRagInsight).toBe(false);
  });

  it("uses builder isSupported, not Mongo default true", () => {
    const db: LeanCountryDoc[] = [
      {
        idKey: "aa",
        name: "A",
        nameEn: "Alphaland",
        isSupported: true,
        cities: [],
      },
    ];
    const out = mergeWorldPayloadsWithMongoCountries(built, db);
    const aa = out.find((c) => c.idKey === "aa");
    expect(aa?.isSupported).toBe(false);
  });
});
