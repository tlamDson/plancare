import { describe, it, expect, vi, beforeEach } from "vitest";

const sentryInit = vi.fn();
vi.mock("@sentry/react", () => ({
  init: (...args: unknown[]) => sentryInit(...args),
}));

describe("initSentry", () => {
  beforeEach(() => {
    vi.resetModules();
    sentryInit.mockReset();
  });

  it("does not call Sentry.init when VITE_SENTRY_DSN is empty", async () => {
    vi.doMock("@/config/env", () => ({ SENTRY_DSN: "", ENV: "test" }));
    const { initSentry } = await import("./sentry");

    initSentry();

    expect(sentryInit).not.toHaveBeenCalled();
  });

  it("initializes Sentry with service:web and safe defaults when DSN is set", async () => {
    vi.doMock("@/config/env", () => ({
      SENTRY_DSN: "https://key@sentry.io/1",
      ENV: "production",
    }));
    const { initSentry } = await import("./sentry");

    initSentry();

    expect(sentryInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://key@sentry.io/1",
        environment: "production",
        tracesSampleRate: 0.1,
        sendDefaultPii: false,
        initialScope: { tags: { service: "web" } },
      }),
    );
  });
});
