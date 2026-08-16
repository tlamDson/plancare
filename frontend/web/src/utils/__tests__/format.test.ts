import { describe, it, expect } from "vitest";
import {
  getLocaleCode,
  getTripDuration,
  convertCurrency,
  getLocalizedTripTitle,
  formatPriceCategory,
  formatDateRange,
} from "../format";

describe("getLocaleCode", () => {
  it("maps each supported language to its BCP 47 code", () => {
    expect(getLocaleCode("French")).toBe("fr-FR");
    expect(getLocaleCode("Vietnamese")).toBe("vi-VN");
    expect(getLocaleCode("English (US)")).toBe("en-US");
  });

  it("defaults to en-US for an unset/unknown language", () => {
    expect(getLocaleCode(undefined)).toBe("en-US");
  });
});

describe("getTripDuration", () => {
  it("returns 1 for a same-day trip", () => {
    expect(getTripDuration("2026-06-01", "2026-06-01")).toBe(1);
  });

  it("counts inclusive days for a multi-day trip", () => {
    expect(getTripDuration("2026-06-01", "2026-06-07")).toBe(7);
  });
});

describe("convertCurrency", () => {
  it("returns the same amount when currencies match", () => {
    expect(convertCurrency(100, "USD", "USD")).toBe(100);
  });

  it("converts USD to EUR using the static rate", () => {
    expect(convertCurrency(100, "USD", "EUR")).toBeCloseTo(92, 5);
  });

  it("converts EUR back to USD", () => {
    expect(convertCurrency(92, "EUR", "USD")).toBeCloseTo(100, 5);
  });

  it("treats an unrecognized currency as rate 1", () => {
    expect(convertCurrency(100, "USD", "XYZ")).toBe(100);
  });
});

describe("getLocalizedTripTitle", () => {
  const t = (key: string) => (key === "trips.defaultTitle" ? "Trip to" : key);

  it("returns the title unchanged when it has no default prefix", () => {
    expect(getLocalizedTripTitle("My Custom Trip", t)).toBe("My Custom Trip");
  });

  it("returns an empty title unchanged", () => {
    expect(getLocalizedTripTitle("", t)).toBe("");
  });

  it("re-localizes a Vietnamese default title into the target language", () => {
    expect(getLocalizedTripTitle("Chuyến đi tới Paris", t)).toBe(
      "Trip to Paris",
    );
  });

  it("re-localizes a French default title into the target language", () => {
    expect(getLocalizedTripTitle("Voyage à Paris", t)).toBe("Trip to Paris");
  });
});

describe("formatPriceCategory", () => {
  it("returns the English label per level", () => {
    expect(formatPriceCategory(1)).toBe("Budget");
    expect(formatPriceCategory(2)).toBe("Moderate");
    expect(formatPriceCategory(3)).toBe("Upscale");
    expect(formatPriceCategory(4)).toBe("Luxury");
  });

  it("returns the Vietnamese label per level", () => {
    expect(formatPriceCategory(1, "Vietnamese")).toBe("Bình dân");
    expect(formatPriceCategory(4, "Vietnamese")).toBe("Sang trọng");
  });

  it("returns the French label per level", () => {
    expect(formatPriceCategory(1, "French")).toBe("Économique");
    expect(formatPriceCategory(4, "French")).toBe("Luxe");
  });

  it("returns an empty string for an out-of-range level", () => {
    expect(formatPriceCategory(0)).toBe("");
    expect(formatPriceCategory(5)).toBe("");
  });
});

describe("formatDateRange", () => {
  it("formats a same-month range without throwing and includes both days", () => {
    const result = formatDateRange(
      "2026-06-23T12:00:00Z",
      "2026-06-25T12:00:00Z",
    );
    expect(result).toContain("23");
    expect(result).toContain("25");
  });

  it("includes the year when the range spans two different years", () => {
    const result = formatDateRange(
      "2026-12-30T12:00:00Z",
      "2027-01-02T12:00:00Z",
    );
    expect(result).toContain("2026");
    expect(result).toContain("2027");
  });
});
