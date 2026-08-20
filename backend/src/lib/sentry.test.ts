import { describe, it, expect, vi, beforeEach } from "vitest";

const sentryInit = vi.fn();
vi.mock("@sentry/node", () => ({
  init: (...args: unknown[]) => sentryInit(...args),
}));

describe("initSentry", () => {
  beforeEach(() => {
    vi.resetModules();
    sentryInit.mockReset();
  });

  it("does not call Sentry.init when SENTRY_DSN is empty", async () => {
    vi.doMock("../config/env", () => ({
      env: { SENTRY_DSN: "" },
      appEnv: "test",
    }));
    const { initSentry } = await import("./sentry");

    initSentry("api");

    expect(sentryInit).not.toHaveBeenCalled();
  });

  it("initializes Sentry with the service tag and safe defaults when DSN is set", async () => {
    vi.doMock("../config/env", () => ({
      env: { SENTRY_DSN: "https://key@sentry.io/1" },
      appEnv: "production",
    }));
    const { initSentry } = await import("./sentry");

    initSentry("worker");

    expect(sentryInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://key@sentry.io/1",
        environment: "production",
        tracesSampleRate: 0.1,
        sendDefaultPii: false,
        initialScope: { tags: { service: "worker" } },
      }),
    );
  });

  it("tags api and worker processes differently", async () => {
    vi.doMock("../config/env", () => ({
      env: { SENTRY_DSN: "https://key@sentry.io/1" },
      appEnv: "production",
    }));
    const { initSentry } = await import("./sentry");

    initSentry("api");

    expect(sentryInit).toHaveBeenCalledWith(
      expect.objectContaining({ initialScope: { tags: { service: "api" } } }),
    );
  });
});
