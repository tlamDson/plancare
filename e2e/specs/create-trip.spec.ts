import { test, expect } from "../support/fixtures";
import { pickDate } from "../support/date-picker";
import { uniqueTitle } from "../support/data";

// Full POST /api/trips -> poll -> cancel -> list -> delete journey through
// real Clerk auth. No worker runs in the CI-safe project, so the trip stays
// QUEUED — exactly what this spec asserts — costing zero AI/Places calls.
// Serial: later steps depend on the trip created in the first one.
test.describe.serial("create trip — queue, cancel, delete", () => {
  const title = uniqueTitle("E2E Create");

  test("creates a trip and lands on its detail page, queued", async ({
    page,
  }) => {
    await page.goto("/trips");
    await page.getByTestId("trips-new-trip-button").click();

    await page.getByTestId("trip-wizard-title").fill(title);
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

    await page.getByTestId("trip-wizard-next").click(); // -> Budget
    await page.getByTestId("trip-wizard-next").click(); // -> Accommodation
    await page.getByTestId("trip-wizard-accommodation-hotel").click();
    await page.getByTestId("trip-wizard-next").click(); // -> Transport
    await page.getByTestId("trip-wizard-next").click(); // -> Activities
    await page.getByTestId("trip-wizard-focus-Culture").click();
    await page.getByTestId("trip-wizard-next").click(); // -> Requirements

    await page.getByTestId("trip-wizard-create").click();

    await expect(page).toHaveURL(/\/trips\/[a-f0-9]{24}$/);
    await expect(page.getByTestId("agent-lock-banner")).toBeVisible();
    await expect(page.getByTestId("job-status")).toHaveAttribute(
      "data-status",
      /QUEUED|PROCESSING/,
    );
  });

  test("cancelling generation releases the AI lock", async ({ page }) => {
    // [FINDING] TripStatusBadge.tsx carries a data-status testid but is not
    // rendered anywhere in the app (dead code, like the 19 unused shadcn
    // components already documented in tech-defaults.md) — so "CANCELLED"
    // isn't independently visible here. AgentLockBanner disappearing is what
    // actually reflects trip.isAgentProcessing flipping to false server-side.
    await page.goto("/trips");
    await page.getByPlaceholder(/search/i).fill(title);
    await page.getByTestId("trip-card-title").click();

    await expect(page.getByTestId("agent-lock-banner")).toBeVisible();
    await page.getByTestId("agent-lock-cancel").click();
    await expect(page.getByTestId("agent-lock-banner")).toBeHidden({
      timeout: 15_000,
    });
  });

  test("the cancelled trip appears in the list and can be deleted", async ({
    page,
  }) => {
    await page.goto("/trips");
    await page.getByPlaceholder(/search/i).fill(title);
    // Tag-scoped: `trip-card-title` (the h3) also starts with "trip-card-"
    // and would otherwise match this prefix selector too.
    const card = page
      .locator('div[data-testid^="trip-card-"]')
      .filter({ hasText: title });
    await expect(card).toHaveCount(1);

    await card.getByRole("button", { name: "Trip actions" }).click();
    await page.getByRole("menuitem", { name: "Delete trip" }).click();
    await page.getByRole("button", { name: "Delete trip" }).click();

    await expect(page.getByTestId("trip-card-title")).toHaveCount(0);
  });
});
