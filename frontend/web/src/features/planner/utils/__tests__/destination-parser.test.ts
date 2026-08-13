import { describe, expect, it } from "vitest";
import { parseDestinationToCountryCity } from "../destination-parser";

describe("parseDestinationToCountryCity", () => {
  it("returns empty countryId for blank input", () => {
    expect(parseDestinationToCountryCity("")).toEqual({ countryId: "" });
    expect(parseDestinationToCountryCity("   ")).toEqual({ countryId: "" });
  });

  it("matches an MVP city by its saved destinationValue", () => {
    const result = parseDestinationToCountryCity("Hà Nội, Việt Nam");
    expect(result.countryId).toBe("vietnam");
  });

  it("matches a country by English name when no MVP city matches", () => {
    const result = parseDestinationToCountryCity("Osaka, Japan");
    expect(result.countryId).toBe("japan");
    expect(result.freeTextCity).toBe("Osaka");
  });

  it("does not set freeTextCity when the input is just the country name", () => {
    const result = parseDestinationToCountryCity("Japan");
    expect(result.countryId).toBe("japan");
    expect(result.freeTextCity).toBe("");
  });

  it("falls back to 'other' with the full input as freeTextCity when nothing matches", () => {
    const result = parseDestinationToCountryCity("Reykjavik, Iceland");
    expect(result).toEqual({ countryId: "other", freeTextCity: "Reykjavik, Iceland" });
  });
});
