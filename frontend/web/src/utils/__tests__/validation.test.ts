import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { safeParseAPI, validateAPI, validateArrayPartial } from "../validation";

const itemSchema = z.object({ id: z.string(), count: z.number() });

describe("safeParseAPI", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns success + data for valid input", () => {
    const result = safeParseAPI(itemSchema, { id: "a", count: 1 });
    expect(result).toEqual({ success: true, data: { id: "a", count: 1 } });
  });

  it("returns a failure result with a readable error for invalid input", () => {
    const result = safeParseAPI(itemSchema, { id: "a", count: "not a number" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("count");
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });
});

describe("validateAPI", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns parsed data for valid input", () => {
    expect(validateAPI(itemSchema, { id: "a", count: 1 })).toEqual({
      id: "a",
      count: 1,
    });
  });

  it("throws when the schema fails", () => {
    expect(() => validateAPI(itemSchema, { id: "a" })).toThrow();
  });
});

describe("validateArrayPartial", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it("keeps valid items and drops invalid ones", () => {
    const result = validateArrayPartial(itemSchema, [
      { id: "a", count: 1 },
      { id: "b", count: "bad" },
      { id: "c", count: 3 },
    ]);
    expect(result).toEqual([
      { id: "a", count: 1 },
      { id: "c", count: 3 },
    ]);
  });

  it("returns an empty array when every item is invalid", () => {
    const result = validateArrayPartial(itemSchema, [{ id: "a" }, {}]);
    expect(result).toEqual([]);
  });

  it("returns all items when everything is valid, without warning", () => {
    const warnSpy = vi.spyOn(console, "warn");
    const result = validateArrayPartial(itemSchema, [{ id: "a", count: 1 }]);
    expect(result).toEqual([{ id: "a", count: 1 }]);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
