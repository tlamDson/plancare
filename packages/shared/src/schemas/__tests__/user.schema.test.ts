import { describe, it, expect } from "vitest";
import { UserTravelDNASchema } from "../user.schema";

describe("UserTravelDNASchema", () => {
  it("accepts an empty object — every field is optional", () => {
    const result = UserTravelDNASchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an unknown archetype enum value", () => {
    const result = UserTravelDNASchema.safeParse({
      archetype: "explorer",
    });
    expect(result.success).toBe(false);
  });

  it("requires constraints.dietary to be an array of strings", () => {
    const result = UserTravelDNASchema.safeParse({
      constraints: { dietary: "vegetarian" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts a fully populated valid payload", () => {
    const result = UserTravelDNASchema.safeParse({
      travelFrequency: "3-5_trips",
      archetype: "backpacker",
      pacing: "relaxed",
      constraints: {
        accessibility: ["wheelchair"],
        dietary: ["vegetarian"],
        avoidances: ["crowds"],
      },
    });
    expect(result.success).toBe(true);
  });
});
