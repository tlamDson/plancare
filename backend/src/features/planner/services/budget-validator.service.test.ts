import { describe, it, expect } from "vitest";
import { budgetValidatorService } from "./budget-validator.service";

describe("budgetValidatorService.validate", () => {
  it("accepts a budget exactly at the $20/person/day threshold", () => {
    const result = budgetValidatorService.validate({
      totalBudget: 20,
      currency: "USD",
      tripDays: 1,
      travelers: { adults: 1, children: 0 },
    });
    expect(result.isValid).toBe(true);
  });

  it("rejects a budget just under the $20/person/day threshold", () => {
    const result = budgetValidatorService.validate({
      totalBudget: 19,
      currency: "USD",
      tripDays: 1,
      travelers: { adults: 1, children: 0 },
    });
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/Minimum \$20\/day/);
  });

  it("weights children at 0.5x an adult for the per-person-day divisor", () => {
    // 2 adults + 2 children (=1 adult-equivalent) => 3 person-days/day.
    // $60/day total => $20/person-day => exactly at threshold => valid.
    const result = budgetValidatorService.validate({
      totalBudget: 60,
      currency: "USD",
      tripDays: 1,
      travelers: { adults: 2, children: 2 },
    });
    expect(result.isValid).toBe(true);
    expect(result.dailyBudgetPerPerson).toBeCloseTo(20, 5);
  });

  it("rejects when there are zero travelers", () => {
    const result = budgetValidatorService.validate({
      totalBudget: 1000,
      currency: "USD",
      tripDays: 5,
      travelers: { adults: 0, children: 0 },
    });
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe("At least 1 traveler is required");
  });

  it("falls back to a 1.0 rate for an unrecognized currency", () => {
    const usd = budgetValidatorService.validate({
      totalBudget: 100,
      currency: "USD",
      tripDays: 1,
      travelers: { adults: 1, children: 0 },
    });
    const unknown = budgetValidatorService.validate({
      totalBudget: 100,
      currency: "XYZ",
      tripDays: 1,
      travelers: { adults: 1, children: 0 },
    });
    expect(unknown.dailyBudgetPerPerson).toBe(usd.dailyBudgetPerPerson);
  });

  // Regression guard for plan bug #8: convertToUSD multiplies by the exchange
  // rate instead of dividing by it, so a JPY budget gets scaled down by the
  // rate (0.0067) rather than up, and is therefore rejected as "too low" no
  // matter how large the JPY amount actually is. This test documents the
  // CURRENT (buggy) behavior; when fixed, this assertion should flip.
  it("[BUG #8] currently under-converts JPY, rejecting large JPY budgets as too low", () => {
    // 500,000 JPY over 5 days for 1 adult is a very comfortable budget in
    // reality, but convertToUSD(100_000, "JPY") = 100_000 * 0.0067 = 670,
    // which is >= 20/day and would actually pass — so pick a smaller total
    // that would clearly be valid if converted correctly (divided), to show
    // the multiplication still produces a number nowhere near a real
    // per-day-per-person USD figure.
    const result = budgetValidatorService.validate({
      totalBudget: 3000, // 3000 JPY/day/person ≈ $20 USD/day if divided correctly
      currency: "JPY",
      tripDays: 1,
      travelers: { adults: 1, children: 0 },
    });
    // Correct conversion (÷0.0067) would be ≈ $447/day — clearly valid.
    // Buggy conversion (×0.0067) is ≈ $20.1/day — right at the edge, and any
    // slightly smaller realistic JPY total (e.g. 2000) is wrongly rejected.
    const shouldAlsoPass = budgetValidatorService.validate({
      totalBudget: 2000,
      currency: "JPY",
      tripDays: 1,
      travelers: { adults: 1, children: 0 },
    });
    expect(result.isValid).toBe(true);
    expect(shouldAlsoPass.isValid).toBe(false); // documents the bug
  });
});

describe("budgetValidatorService.validateDuration", () => {
  it("rejects identical start/end instants (0 days via Math.ceil)", () => {
    const same = new Date("2026-06-01T09:00:00Z");
    const result = budgetValidatorService.validateDuration(same, same);
    expect(result.isValid).toBe(false);
  });

  it("rounds a same-day partial span up to 1 day (Math.ceil)", () => {
    const start = new Date("2026-06-01T09:00:00Z");
    const end = new Date("2026-06-01T18:00:00Z");
    const result = budgetValidatorService.validateDuration(start, end);
    expect(result.isValid).toBe(true);
    expect(result.days).toBe(1);
  });

  it("accepts a 1-day trip", () => {
    const start = new Date("2026-06-01T00:00:00Z");
    const end = new Date("2026-06-02T00:00:00Z");
    const result = budgetValidatorService.validateDuration(start, end);
    expect(result.isValid).toBe(true);
    expect(result.days).toBe(1);
  });

  it("accepts a 90-day trip", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
    const result = budgetValidatorService.validateDuration(start, end);
    expect(result.isValid).toBe(true);
    expect(result.days).toBe(90);
  });

  it("rejects a 91-day trip", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date(start.getTime() + 91 * 24 * 60 * 60 * 1000);
    const result = budgetValidatorService.validateDuration(start, end);
    expect(result.isValid).toBe(false);
  });
});
