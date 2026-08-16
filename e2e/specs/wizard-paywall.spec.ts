import { test, expect } from "../support/fixtures";
import { pickDate } from "../support/date-picker";

// Locks in the two free-tier paywall traps documented in
// CreateTripDialog.tsx / StepActivities.tsx so a future refactor can't
// silently drop them. Signed-in, no backend writes.
test.describe("trip wizard — free-tier paywall gates", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/trips");
    await page.getByTestId("trips-new-trip-button").click();
  });

  async function fillBasics(
    page: import("@playwright/test").Page,
    tripDays: number,
  ) {
    await page.getByTestId("trip-wizard-title").fill("E2E Paywall Test");
    await page.getByTestId("trip-wizard-country").click();
    await page.getByTestId("country-option-vn").click();
    await page.getByTestId("trip-wizard-city").click();
    await page.locator('[data-testid^="city-option-"]').first().click();

    const start = new Date();
    start.setDate(start.getDate() + 14);
    const end = new Date(start);
    end.setDate(end.getDate() + tripDays);
    await pickDate(page, "trip-wizard-start-date", start);
    await pickDate(page, "trip-wizard-end-date", end);
  }

  test("a trip over 5 days swaps Next for an upgrade CTA that opens the paywall", async ({
    page,
  }) => {
    await fillBasics(page, 7);

    const nextButton = page.getByTestId("trip-wizard-next");
    await expect(nextButton).toHaveText(/Upgrade to Continue/);
    await nextButton.click();

    await expect(
      page.getByRole("heading", { name: "Upgrade to TravelPlan Pro" }),
    ).toBeVisible();
    // Clicking the upgrade CTA must not have advanced the wizard.
    await expect(page.getByTestId("trip-wizard")).toHaveAttribute(
      "data-step",
      "0",
    );
  });

  test("relaxed/packed pace opens the paywall instead of selecting it", async ({
    page,
  }) => {
    await fillBasics(page, 3);
    await page.getByTestId("trip-wizard-next").click(); // -> Budget
    await page.getByTestId("trip-wizard-next").click(); // -> Accommodation
    await page.getByTestId("trip-wizard-accommodation-hotel").click();
    await page.getByTestId("trip-wizard-next").click(); // -> Transport
    await page.getByTestId("trip-wizard-next").click(); // -> Activities

    await page.getByTestId("trip-wizard-pace-relaxed").click();
    await expect(
      page.getByRole("heading", { name: "Upgrade to TravelPlan Pro" }),
    ).toBeVisible();
    await expect(
      page.getByTestId("trip-wizard-pace-relaxed"),
    ).not.toBeChecked();
  });

  test("balanced pace (free-tier default) can be selected without gating", async ({
    page,
  }) => {
    await fillBasics(page, 3);
    await page.getByTestId("trip-wizard-next").click(); // -> Budget
    await page.getByTestId("trip-wizard-next").click(); // -> Accommodation
    await page.getByTestId("trip-wizard-accommodation-hotel").click();
    await page.getByTestId("trip-wizard-next").click(); // -> Transport
    await page.getByTestId("trip-wizard-next").click(); // -> Activities

    await page.getByTestId("trip-wizard-pace-balanced").click();
    await expect(
      page.getByRole("heading", { name: "Upgrade to TravelPlan Pro" }),
    ).not.toBeVisible();
    await expect(page.getByTestId("trip-wizard-pace-balanced")).toBeChecked();
  });
});
