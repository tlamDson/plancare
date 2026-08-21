import { describe, it, expect } from "vitest";
import { GEMINI_MODEL } from "./gemini-models";

describe("GEMINI_MODEL", () => {
  it("is not one of the confirmed-dead model strings", () => {
    expect(GEMINI_MODEL).not.toBe("gemini-2.0-flash");
    expect(GEMINI_MODEL).not.toBe("gemini-2.5-flash");
  });

  it("is pinned to the currently-verified model", () => {
    expect(GEMINI_MODEL).toBe("gemini-3.6-flash");
  });
});
