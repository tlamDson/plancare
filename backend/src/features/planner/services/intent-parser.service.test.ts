import { describe, it, expect } from "vitest";
import { intentParserService, SLOT_ORDER } from "./intent-parser.service";

describe("intentParserService.parseIntents — JSON extraction", () => {
  it("parses a plain JSON response", () => {
    const raw = JSON.stringify({ day1: { morning: "Ben Thanh Market" } });
    const result = intentParserService.parseIntents(raw);
    expect(result).toEqual({ day1: { morning: "Ben Thanh Market" } });
  });

  it("parses JSON wrapped in a ```json fence", () => {
    const raw = '```json\n{"day1": {"morning": "Ben Thanh Market"}}\n```';
    const result = intentParserService.parseIntents(raw);
    expect(result).toEqual({ day1: { morning: "Ben Thanh Market" } });
  });

  it("parses JSON wrapped in a plain ``` fence (no language tag)", () => {
    const raw = '```\n{"day1": {"morning": "Ben Thanh Market"}}\n```';
    const result = intentParserService.parseIntents(raw);
    expect(result).toEqual({ day1: { morning: "Ben Thanh Market" } });
  });

  it("extracts JSON from surrounding prose text", () => {
    const raw =
      'Sure! Here is your itinerary:\n{"day1": {"morning": "Ben Thanh Market"}}\nHope that helps!';
    const result = intentParserService.parseIntents(raw);
    expect(result).toEqual({ day1: { morning: "Ben Thanh Market" } });
  });

  it("throws AI returned invalid JSON format on malformed JSON", () => {
    expect(() => intentParserService.parseIntents("{not valid json")).toThrow(
      "AI returned invalid JSON format",
    );
  });
});

describe("intentParserService.parseIntents — root coercion", () => {
  it("coerces a fenced array root into day1..dayN", () => {
    // Must be code-fenced: see the [BUG] case below for the unfenced path.
    const raw =
      "```json\n" +
      JSON.stringify([{ morning: "Place A" }, { morning: "Place B" }]) +
      "\n```";
    const result = intentParserService.parseIntents(raw);
    expect(result).toEqual({
      day1: { morning: "Place A" },
      day2: { morning: "Place B" },
    });
  });

  // New finding (not previously catalogued): extractJson()'s fallback
  // brace-matching looks for the first `{` and last `}`, which is
  // object-shaped logic. For a bare, UNFENCED JSON array it slices out the
  // array elements without their wrapping `[`/`]`, producing invalid JSON
  // ("{...},{...}") that fails to parse — even though coerceRoot() clearly
  // anticipates array roots. This documents the current (broken) behavior.
  it("[BUG] fails to parse an unfenced bare JSON array root", () => {
    const raw = JSON.stringify([
      { morning: "Place A" },
      { morning: "Place B" },
    ]);
    expect(() => intentParserService.parseIntents(raw)).toThrow(
      "AI returned invalid JSON format",
    );
  });

  it("unwraps a root object with an `itinerary` key", () => {
    const raw = JSON.stringify({
      itinerary: { day1: { morning: "Place A" } },
    });
    const result = intentParserService.parseIntents(raw);
    expect(result).toEqual({ day1: { morning: "Place A" } });
  });

  it("unwraps a root object with a `days` key", () => {
    const raw = JSON.stringify({ days: { day1: { morning: "Place A" } } });
    const result = intentParserService.parseIntents(raw);
    expect(result).toEqual({ day1: { morning: "Place A" } });
  });
});

describe("intentParserService.parseIntents — day key normalization", () => {
  it.each([
    ["Day 01", "day1"],
    ["1", "day1"],
    ["day1", "day1"],
    ["Day  7", "day7"],
  ])("normalizes day key %s -> %s", (input, expected) => {
    const raw = JSON.stringify({ [input]: { morning: "Place A" } });
    const result = intentParserService.parseIntents(raw);
    expect(Object.keys(result)).toEqual([expected]);
  });
});

describe("intentParserService.parseIntents — slot key normalization", () => {
  it.each([
    ["brunch", "breakfast"],
    ["am", "morning"],
    ["mid morning", "late morning"],
    ["noon", "afternoon"],
    ["supper", "dinner"],
    ["late night", "night"],
  ])("normalizes slot alias %s -> %s", (alias, expectedSlot) => {
    const raw = JSON.stringify({ day1: { [alias]: "Some Place" } });
    const result = intentParserService.parseIntents(raw);
    expect(result.day1).toEqual({ [expectedSlot]: "Some Place" });
  });

  it("accepts a slot value expressed as an object with a `query` field", () => {
    const raw = JSON.stringify({ day1: { morning: { query: "Some Place" } } });
    const result = intentParserService.parseIntents(raw);
    expect(result.day1).toEqual({ morning: "Some Place" });
  });

  it("drops an unrecognized slot key without crashing", () => {
    const raw = JSON.stringify({
      day1: { "brunch buffet": "Should be dropped", morning: "Kept" },
    });
    const result = intentParserService.parseIntents(raw);
    expect(result.day1).toEqual({ morning: "Kept" });
  });

  it("drops a day entirely when every slot in it is unrecognized", () => {
    const raw = JSON.stringify({
      day1: { "totally unknown slot": "value" },
      day2: { morning: "Kept" },
    });
    const result = intentParserService.parseIntents(raw);
    expect(Object.keys(result)).toEqual(["day2"]);
  });
});

describe("intentParserService.flattenIntents", () => {
  it("orders queries by SLOT_ORDER regardless of input key order", () => {
    const intents = {
      day1: {
        night: "Night spot",
        breakfast: "Breakfast spot",
        lunch: "Lunch spot",
      },
    };
    const flat = intentParserService.flattenIntents(intents);
    expect(flat).toEqual(["Breakfast spot", "Lunch spot", "Night spot"]);
  });

  it("skips empty/whitespace-only slot values", () => {
    const intents = {
      day1: { morning: "  ", afternoon: "Afternoon spot" },
    };
    const flat = intentParserService.flattenIntents(intents);
    expect(flat).toEqual(["Afternoon spot"]);
  });

  it("uses every slot in SLOT_ORDER when present", () => {
    const intents = {
      day1: Object.fromEntries(SLOT_ORDER.map((s) => [s, `${s} place`])),
    };
    const flat = intentParserService.flattenIntents(intents);
    expect(flat).toEqual(SLOT_ORDER.map((s) => `${s} place`));
  });

  // Plan bug #1: Object.keys(intents).sort() is a lexicographic string sort,
  // so "day10" < "day2" as strings — trips of 10+ days get their day order
  // scrambled. This test documents the CURRENT (buggy) behavior; it should
  // be flipped to assert numeric day order once fixed.
  it("[BUG #1] currently sorts day10 before day2 (lexicographic, not numeric)", () => {
    const intents = {
      day2: { morning: "Day 2 place" },
      day10: { morning: "Day 10 place" },
    };
    const flat = intentParserService.flattenIntents(intents);
    expect(flat).toEqual(["Day 10 place", "Day 2 place"]);
  });
});

describe("intentParserService.isValidIntentFormat", () => {
  it("returns true for a well-formed intents object", () => {
    expect(
      intentParserService.isValidIntentFormat({
        day1: { morning: "Place A" },
      }),
    ).toBe(true);
  });

  it("returns false for a day with no slots", () => {
    expect(intentParserService.isValidIntentFormat({ day1: {} })).toBe(false);
  });

  it("returns false for a non-object input", () => {
    expect(intentParserService.isValidIntentFormat("not an object")).toBe(
      false,
    );
  });
});
