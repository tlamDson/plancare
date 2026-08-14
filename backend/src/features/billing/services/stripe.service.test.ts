import { describe, it, expect, vi, beforeEach } from "vitest";

// STRIPE_SECRET_KEY is set to a dummy value globally in vitest.config.ts —
// override it per-test via vi.stubEnv so we can exercise the "not
// configured" path without a full process restart.
describe("stripe.service — lazy init", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("does not throw on import when STRIPE_SECRET_KEY is empty", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    await expect(import("./stripe.service")).resolves.toBeDefined();
  });

  it("getStripe() throws STRIPE_NOT_CONFIGURED when the key is empty", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const { getStripe } = await import("./stripe.service");
    expect(() => getStripe()).toThrow("STRIPE_NOT_CONFIGURED");
  });

  it("getStripe() returns a Stripe client when the key is set", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy_key_for_tests");
    const { getStripe } = await import("./stripe.service");
    expect(getStripe()).toBeDefined();
    expect(getStripe().checkout).toBeDefined();
  });
});
