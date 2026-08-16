import { test, expect } from "../support/fixtures";
import { pickDate } from "../support/date-picker";

// Signed-in (via storageState from the "setup" project), no backend writes —
// this spec never clicks Create, so it costs zero AI/Places calls.
test.describe("trip wizard — navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/trips");
    await page.getByTestId("trips-new-trip-button").click();
    await expect(page.getByTestId("trip-wizard")).toHaveAttribute(
      "data-step",
      "0",
    );
  });

  test("disables Next until title, destination, and dates are all set", async ({
    page,
  }) => {
    await expect(page.getByTestId("trip-wizard-next")).toBeDisabled();

    await page.getByTestId("trip-wizard-title").fill("E2E Nav Test");
    await expect(page.getByTestId("trip-wizard-next")).toBeDisabled();
  });

  test("only mounts the city picker after a country is chosen", async ({
    page,
  }) => {
    await expect(page.getByTestId("trip-wizard-city")).toHaveCount(0);

    await page.getByTestId("trip-wizard-country").click();
    await page.getByTestId("country-option-vn").click();

    await expect(page.getByTestId("trip-wizard-city")).toHaveCount(1);
  });

  test("walks all 6 steps forward, then Back preserves data and Reset clears it", async ({
    page,
  }) => {
    // Step 0 — Basics
    await page.getByTestId("trip-wizard-title").fill("E2E Nav Test");
    await page.getByTestId("trip-wizard-country").click();
    await page.getByTestId("country-option-vn").click();
    await page.getByTestId("trip-wizard-city").click();
    await page.locator('[data-testid^="city-option-"]').first().click();

    const start = new Date();
    start.setDate(start.getDate() + 14);
    const end = new Date(start);
    end.setDate(end.getDate() + 3);
    await pickDate(page, "trip-wizard-start-date", start);
    await pickDate(page, "trip-wizard-end-date", end);

    await expect(page.getByTestId("trip-wizard-next")).toBeEnabled();
    await page.getByTestId("trip-wizard-next").click(); // -> step 1 Budget

    // Step 1 — Budget: 500 USD default is already valid for a 3-day/1-adult trip.
    await expect(page.getByTestId("trip-wizard")).toHaveAttribute(
      "data-step",
      "1",
    );
    await page.getByTestId("trip-wizard-next").click(); // -> step 2 Accommodation

    // Step 2 — Accommodation: no default, must pick one.
    await expect(page.getByTestId("trip-wizard-next")).toBeDisabled();
    await page.getByTestId("trip-wizard-accommodation-hotel").click();
    await page.getByTestId("trip-wizard-next").click(); // -> step 3 Transport

    // Step 3 — Transport: "walking" is already the default.
    await expect(page.getByTestId("trip-wizard")).toHaveAttribute(
      "data-step",
      "3",
    );
    await page.getByTestId("trip-wizard-next").click(); // -> step 4 Activities

    // Step 4 — Activities: pace defaults to "balanced" (valid); focus needs 1+.
    await expect(page.getByTestId("trip-wizard-next")).toBeDisabled();
    await page.getByTestId("trip-wizard-focus-Culture").click();
    await expect(page.getByTestId("trip-wizard-next")).toBeEnabled();
    await page.getByTestId("trip-wizard-next").click(); // -> step 5 Requirements

    await expect(page.getByTestId("trip-wizard")).toHaveAttribute(
      "data-step",
      "5",
    );
    await expect(page.getByTestId("trip-wizard-create")).toBeVisible();

    // Back returns to step 4 with the focus selection preserved.
    await page.getByTestId("trip-wizard-back").click();
    await expect(page.getByTestId("trip-wizard")).toHaveAttribute(
      "data-step",
      "4",
    );
    await expect(page.getByTestId("trip-wizard-focus-Culture")).toHaveAttribute(
      "data-state",
      "on",
    );

    // Reset clears the title and returns to step 0.
    await page.getByTestId("trip-wizard-reset").click();
    await expect(page.getByTestId("trip-wizard")).toHaveAttribute(
      "data-step",
      "0",
    );
    await expect(page.getByTestId("trip-wizard-title")).toHaveValue("");
  });
});
