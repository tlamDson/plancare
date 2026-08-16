import { test as base, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

/**
 * setupClerkTestingToken bypasses Clerk's bot-detection on sign-in — it
 * intercepts requests via context.route(), so unlike auth itself it can't
 * be captured in storageState and must run fresh in every test's context.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await setupClerkTestingToken({ context });
    await use(context);
  },
});

export { expect };
