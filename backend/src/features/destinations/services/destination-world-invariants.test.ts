import path from "path";
import { describe, it, expect } from "vitest";
import { buildAllCountrySeedPayloads } from "./world-destinations.builder";
import {
  mapCountryToApiDto,
  sortDestinationsAlphabeticallyByNameEn,
  assertEveryCountryHasCities,
} from "./destination-list.mappers";
import { destinationsListResponseSchema } from "@travelplan/shared";

const seedDataDir = path.join(process.cwd(), "scripts", "seed-data");

describe("world destinations seed shape", () => {
  const payloads = buildAllCountrySeedPayloads(seedDataDir);

  it("includes a full ISO country set", () => {
    expect(payloads.length).toBeGreaterThanOrEqual(190);
  });

  it("every country has at least one city", () => {
    assertEveryCountryHasCities(payloads);
  });

  it("API DTOs sort alphabetically by nameEn and validate with Zod", () => {
    const lean = payloads.map((p) => ({
      ...p,
      cities: p.cities.map((c) => ({ ...c, insightText: null as null })),
    }));
    const dtos = lean.map(mapCountryToApiDto);
    const sorted = sortDestinationsAlphabeticallyByNameEn(dtos);
    const names = sorted.map((c) => c.nameEn);
    const expected = [...names].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" }),
    );
    expect(names).toEqual(expected);
    const parsed = destinationsListResponseSchema.safeParse({
      success: true,
      countries: sorted,
    });
    expect(parsed.success).toBe(true);
  });
});
