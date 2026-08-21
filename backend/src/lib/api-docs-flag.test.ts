import { describe, it, expect, vi, beforeEach } from "vitest";

describe("isApiDocsEnabled", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns true in development", async () => {
    vi.doMock("../config/env", () => ({ env: { NODE_ENV: "development" } }));
    const { isApiDocsEnabled } = await import("./api-docs-flag");
    expect(isApiDocsEnabled()).toBe(true);
  });

  it("returns true in test", async () => {
    vi.doMock("../config/env", () => ({ env: { NODE_ENV: "test" } }));
    const { isApiDocsEnabled } = await import("./api-docs-flag");
    expect(isApiDocsEnabled()).toBe(true);
  });

  it("returns false in production", async () => {
    vi.doMock("../config/env", () => ({ env: { NODE_ENV: "production" } }));
    const { isApiDocsEnabled } = await import("./api-docs-flag");
    expect(isApiDocsEnabled()).toBe(false);
  });
});
