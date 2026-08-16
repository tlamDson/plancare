import { clerkSetup } from "@clerk/testing/playwright";
import { resetE2EDatabase } from "./support/db";

/**
 * Runs once before the whole E2E run. Fails fast and loudly rather than
 * letting a missing/empty Clerk key silently propagate as "" into
 * webServer.env — see playwright.config.ts's comment on why that used to
 * time out the API webServer with an opaque "Publishable key is missing".
 */
export default async function globalSetup() {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY_E2E;
  const secretKey = process.env.CLERK_SECRET_KEY_E2E;

  if (!publishableKey || !secretKey) {
    throw new Error(
      "E2E requires CLERK_PUBLISHABLE_KEY_E2E and CLERK_SECRET_KEY_E2E. " +
        "Locally: create .env.e2e at the repo root. " +
        "In CI: they come from GitHub secrets.",
    );
  }
  if (
    publishableKey.startsWith("pk_live_") ||
    secretKey.startsWith("sk_live_")
  ) {
    throw new Error("Refusing to run E2E against a Clerk PRODUCTION instance.");
  }

  // clerkSetup() defaults to loading .env/.env.local from the CWD — this
  // repo has both at the root, and if either sets CLERK_SECRET_KEY, it would
  // silently fetch a testing token for the wrong (dev) Clerk instance,
  // producing confusing "user not found" sign-in failures later. Passing the
  // keys explicitly with dotenv:false avoids that entirely.
  await clerkSetup({ publishableKey, secretKey, dotenv: false });

  await resetE2EDatabase(
    process.env.E2E_MONGO_URI ??
      "mongodb://travelplan_admin:dev_password_change_in_prod@localhost:27017/travelplan_e2e?authSource=admin",
  );
}
