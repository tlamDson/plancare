import { describe, it, expect, vi, beforeEach } from "vitest";

describe("isDevRoutesEnabled", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns true in development", async () => {
    vi.doMock("../../config/env", () => ({ env: { NODE_ENV: "development" } }));
    const { isDevRoutesEnabled } = await import("./dev-routes-flag");
    expect(isDevRoutesEnabled()).toBe(true);
  });

  it("returns false in test", async () => {
    vi.doMock("../../config/env", () => ({ env: { NODE_ENV: "test" } }));
    const { isDevRoutesEnabled } = await import("./dev-routes-flag");
    expect(isDevRoutesEnabled()).toBe(false);
  });

  it("returns false in production", async () => {
    vi.doMock("../../config/env", () => ({ env: { NODE_ENV: "production" } }));
    const { isDevRoutesEnabled } = await import("./dev-routes-flag");
    expect(isDevRoutesEnabled()).toBe(false);
  });
});
