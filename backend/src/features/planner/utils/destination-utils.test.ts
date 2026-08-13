import { describe, expect, it } from "vitest";
import { isMVPDestination } from "./destination-utils";

describe("isMVPDestination", () => {
  it("returns false for blank input", () => {
    expect(isMVPDestination("")).toBe(false);
    expect(isMVPDestination("   ")).toBe(false);
  });

  it("matches an MVP city by its known name", () => {
    expect(isMVPDestination("Da Nang")).toBe(true);
    expect(isMVPDestination("Paris")).toBe(true);
  });

  it("matches by country pattern in the second part", () => {
    expect(isMVPDestination("Reykjavik, Vietnam")).toBe(true);
    expect(isMVPDestination("Some Town, USA")).toBe(true);
  });

  it("returns false for a non-MVP destination", () => {
    expect(isMVPDestination("Tokyo, Japan")).toBe(false);
    expect(isMVPDestination("Bangkok")).toBe(false);
  });
});
