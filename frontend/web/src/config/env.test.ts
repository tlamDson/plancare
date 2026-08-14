import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * config/env.ts reads import.meta.env at module scope, so each case needs
 * vi.resetModules() + a fresh dynamic import after stubbing env vars —
 * a plain top-level import would only ever see the first evaluation.
 */
async function loadEnv() {
  vi.resetModules();
  return await import("./env");
}

describe("config/env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("MAPBOX_TOKEN", () => {
    it("prefers VITE_MAPBOX_ACCESS_TOKEN when both names are set", async () => {
      vi.stubEnv("VITE_MAPBOX_ACCESS_TOKEN", "pk.access-token");
      vi.stubEnv("VITE_MAPBOX_TOKEN", "pk.legacy-token");

      const { MAPBOX_TOKEN } = await loadEnv();

      expect(MAPBOX_TOKEN).toBe("pk.access-token");
    });

    it("falls back to the legacy VITE_MAPBOX_TOKEN name when only that is set", async () => {
      vi.stubEnv("VITE_MAPBOX_ACCESS_TOKEN", "");
      vi.stubEnv("VITE_MAPBOX_TOKEN", "pk.legacy-token");

      const { MAPBOX_TOKEN } = await loadEnv();

      expect(MAPBOX_TOKEN).toBe("pk.legacy-token");
    });
  });

  describe("API_URL", () => {
    it("falls back to the local API URL (with /api) when unset", async () => {
      vi.stubEnv("VITE_API_URL", "");

      const { API_URL } = await loadEnv();

      expect(API_URL).toBe("http://localhost:3000/api");
    });

    it("uses VITE_API_URL when set", async () => {
      vi.stubEnv("VITE_API_URL", "https://staging-api.example.com/api");

      const { API_URL } = await loadEnv();

      expect(API_URL).toBe("https://staging-api.example.com/api");
    });
  });

  describe("IS_STAGING / IS_PROD", () => {
    it("is staging when VITE_ENV=staging, and not counted as production", async () => {
      vi.stubEnv("VITE_ENV", "staging");
      vi.stubEnv("PROD", true);

      const { IS_STAGING, IS_PROD } = await loadEnv();

      expect(IS_STAGING).toBe(true);
      expect(IS_PROD).toBe(false);
    });

    it("is production when the build is a Vite production build and VITE_ENV isn't staging", async () => {
      vi.stubEnv("VITE_ENV", "production");
      vi.stubEnv("PROD", true);

      const { IS_STAGING, IS_PROD } = await loadEnv();

      expect(IS_STAGING).toBe(false);
      expect(IS_PROD).toBe(true);
    });
  });

  describe("Clerk key guard", () => {
    it("throws when the Clerk key is missing from a production build (import.meta.env.PROD true)", async () => {
      vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", "");
      vi.stubEnv("PROD", true);
      // Old behavior kept this guard keyed off VITE_ENV === "production", which
      // is unset on a staging build (Vercel builds staging in Vite production
      // mode via mode=production, not a "staging" mode) — so a staging deploy
      // missing the Clerk key would silently render a broken auth shell
      // instead of failing loudly. VITE_ENV is deliberately left unset here.

      await expect(loadEnv()).rejects.toThrow(
        /Missing VITE_CLERK_PUBLISHABLE_KEY/,
      );
    });

    it("does not throw in a dev build even without a Clerk key", async () => {
      vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", "");
      vi.stubEnv("PROD", false);

      await expect(loadEnv()).resolves.toBeDefined();
    });
  });
});
