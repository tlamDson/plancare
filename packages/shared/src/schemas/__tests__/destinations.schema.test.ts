import { describe, it, expect } from "vitest";
import {
  destinationCityApiSchema,
  destinationCountryApiSchema,
  destinationsListResponseSchema,
} from "../destinations.schema";

const validCity = {
  idKey: "da_nang",
  name: "Đà Nẵng",
  nameEn: "Da Nang",
  timezone: "Asia/Ho_Chi_Minh",
  hasRagInsight: true,
};

const validCountry = {
  idKey: "vn",
  name: "Việt Nam",
  nameEn: "Vietnam",
  flagEmoji: "🇻🇳",
  isSupported: true,
  cities: [validCity],
};

describe("destinationCountryApiSchema", () => {
  it("rejects a country with zero cities", () => {
    const result = destinationCountryApiSchema.safeParse({
      ...validCountry,
      cities: [],
    });
    expect(result.success).toBe(false);
  });

  it("allows flagEmoji to be omitted", () => {
    const { flagEmoji: _flagEmoji, ...withoutFlag } = validCountry;
    const result = destinationCountryApiSchema.safeParse(withoutFlag);
    expect(result.success).toBe(true);
  });
});

describe("destinationsListResponseSchema", () => {
  it("rejects success: false (literal true required)", () => {
    const result = destinationsListResponseSchema.safeParse({
      success: false,
      countries: [validCountry],
    });
    expect(result.success).toBe(false);
  });

  it("round-trips a realistic payload", () => {
    const result = destinationsListResponseSchema.safeParse({
      success: true,
      countries: [validCountry],
    });
    expect(result.success).toBe(true);
  });
});

describe("destinationCityApiSchema", () => {
  it("requires hasRagInsight as a boolean", () => {
    const result = destinationCityApiSchema.safeParse({
      ...validCity,
      hasRagInsight: undefined,
    });
    expect(result.success).toBe(false);
  });
});
