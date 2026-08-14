import path from "path";
import { test as setup, expect } from "@playwright/test";
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";

export const STORAGE_STATE = path.resolve(__dirname, "../.auth/user.json");

/**
 * Runs once as the "setup" project (see playwright.config.ts) and signs in
 * via Clerk's Backend API — not through the app's UI — so every other spec
 * in the "chromium" project starts already authenticated via storageState.
 * Doing this per-test instead would mean ~15 Clerk Backend API round trips
 * per run for zero added coverage. auth.spec.ts is the one spec that
 * exercises the app's own sign-in form for real, and it runs signed-out in
 * the separate "chromium-anon" project instead of depending on this file.
 */
setup("authenticate", async ({ page, context }) => {
  await setupClerkTestingToken({ context });
  await page.goto("/"); // LandingPage — public, mounts ClerkProvider
  await clerk.loaded({ page });
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_USER_EMAIL!,
      password: process.env.E2E_USER_PASSWORD!,
    },
  });

  await page.goto("/dashboard");
  // ProtectedRoute renders <PageLoader/> until Clerk isLoaded, then either
  // the page or a redirect to /signin — assert on the settled URL rather
  // than racing the loader.
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.context().storageState({ path: STORAGE_STATE });
});
