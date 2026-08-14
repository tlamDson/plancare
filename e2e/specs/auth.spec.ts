import { test, expect } from "../support/fixtures";

// Runs in the "chromium-anon" project (see playwright.config.ts) — starts
// signed OUT, unlike every other CI-safe spec which reuses the "setup"
// project's storageState. This is the one spec that drives the app's own
// custom sign-in form (react-hook-form + Clerk's headless useSignIn()),
// which is real product code worth covering — Clerk's own internals are
// exercised instead by e2e/support/auth.setup.ts via clerk.signIn().
test.describe("auth", () => {
  test("redirects an unauthenticated visitor from /dashboard to /signin", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // ProtectedRoute renders <PageLoader/> until Clerk reports isLoaded, so
    // assert on the settled URL rather than the immediate DOM.
    await expect(page).toHaveURL(/\/signin/);
  });

  test("signs in with valid credentials and lands on /dashboard", async ({
    page,
  }) => {
    await page.goto("/signin");
    await page.locator("#email").fill(process.env.E2E_USER_EMAIL!);
    await page.locator("#password").fill(process.env.E2E_USER_PASSWORD!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("shows an error and stays on /signin for a wrong password", async ({
    page,
  }) => {
    await page.goto("/signin");
    await page.locator("#email").fill(process.env.E2E_USER_EMAIL!);
    await page.locator("#password").fill("definitely-the-wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator("[data-sonner-toast]")).toBeVisible();
    await expect(page).toHaveURL(/\/signin/);
  });
});
