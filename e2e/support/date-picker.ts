import { expect, type Locator, type Page } from "@playwright/test";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ordinal(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return `${n}st`;
  if (n % 10 === 2 && n % 100 !== 12) return `${n}nd`;
  if (n % 10 === 3 && n % 100 !== 13) return `${n}rd`;
  return `${n}th`;
}

/** Matches react-day-picker's default labelDayButton(): date-fns `format(date, "PPPP")`. */
function dayButtonLabel(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${ordinal(date.getDate())}, ${date.getFullYear()}`;
}

/**
 * Opens a wizard DatePicker (by its trigger testid) and selects `date`.
 * `defaultMonth` in DatePicker.tsx is `selected ?? today`, so the calendar
 * always opens on the current month — this only needs to page forward, and
 * only when `date` falls in a later month (rare for the short near-future
 * trips these specs create).
 */
export async function pickDate(
  page: Page,
  triggerTestId: string,
  date: Date,
): Promise<void> {
  const trigger = page.getByTestId(triggerTestId);
  await trigger.click();

  // Scope to THIS popover's content via Radix's trigger->content
  // aria-controls link — with two DatePickers on the same step, an
  // unscoped role query (e.g. "Go to the Next Month") can resolve to both
  // popovers at once if the previous one hasn't fully unmounted yet.
  const contentId = await trigger.getAttribute("aria-controls");
  if (!contentId) throw new Error(`No aria-controls on ${triggerTestId}`);
  const panel = page.locator(`#${contentId}`);

  const dayButton: Locator = panel.getByRole("button", {
    name: dayButtonLabel(date),
    exact: true,
  });

  let clicked = false;
  for (let attempt = 0; attempt < 3 && !clicked; attempt++) {
    if (await dayButton.isVisible().catch(() => false)) {
      await dayButton.click();
      clicked = true;
      break;
    }
    await panel.getByRole("button", { name: "Go to the Next Month" }).click();
  }
  if (!clicked) {
    await dayButton.click();
  }

  await expect(trigger).toHaveAttribute("aria-expanded", "false");
}
