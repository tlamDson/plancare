import path from "path";
import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// Local runs read .env.e2e (git-ignored) for Clerk test-instance credentials;
// CI supplies the same var names as GitHub Actions secrets.
dotenv.config({ path: path.resolve(__dirname, "../.env.e2e") });

const WEB_PORT = 5173;
const API_PORT = 3000;
const WEB_URL = `http://localhost:${WEB_PORT}`;
const API_URL = `http://localhost:${API_PORT}`;
const ROOT = path.resolve(__dirname, "..");

// Fail fast with a clear message instead of an empty string silently
// overriding real keys — see global-setup.ts, which throws before this
// config's webServer entries ever start if these are missing.
const CLERK_PK = process.env.CLERK_PUBLISHABLE_KEY_E2E ?? "";
const CLERK_SK = process.env.CLERK_SECRET_KEY_E2E ?? "";

// Dedicated E2E database (never the dev DB) — dropped fresh by
// global-setup.ts on every run. See db.ts for the safety guard.
const E2E_MONGO_URI =
  process.env.E2E_MONGO_URI ??
  "mongodb://travelplan_admin:dev_password_change_in_prod@localhost:27017/travelplan_e2e?authSource=admin";

const apiEnv = {
  NODE_ENV: "development", // keeps POST /api/dev/toggle-pro reachable if a spec ever needs it
  MONGO_URI: E2E_MONGO_URI,
  CLERK_PUBLISHABLE_KEY: CLERK_PK,
  CLERK_SECRET_KEY: CLERK_SK,
  // envalid requires these three (config/env.ts) and CI has no backend/.env
  // to fall back on — must be supplied explicitly, not left to chance.
  // CLERK_WEBHOOK_SIGNING_SECRET must be valid base64 after "whsec_" (see
  // backend/src/test/integration-setup.ts for why) and GEMINI_API_KEY is
  // unused by any CI-safe spec (no worker runs, nothing reaches Gemini).
  // Built from a readable string, not a hardcoded blob — a static base64
  // literal here reads as a real secret to entropy-based scanners
  // (GitGuardian false positive).
  CLERK_WEBHOOK_SIGNING_SECRET:
    "whsec_" +
    Buffer.from("integration-test-clerk-webhook-secret-32").toString(
      "base64",
    ),
  GEMINI_API_KEY: "sk-dummy-key-for-e2e",
  // billing/stripe.service.ts does `new Stripe(env.STRIPE_SECRET_KEY)` at
  // *import* time (not lazily) — an empty key crashes the API at boot.
  STRIPE_SECRET_KEY: "sk_test_dummy_key_for_e2e",
  // Deliberately empty: no E2E run may bill Google Places / Mapbox.
  GOOGLE_PLACES_API_KEY: "",
  MAPBOX_ACCESS_TOKEN: "",
};

export default defineConfig({
  testDir: "./specs",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [
        ["html", { outputFolder: "playwright-report", open: "never" }],
        ["github"],
      ]
    : [["html", { outputFolder: "playwright-report", open: "never" }]],
  globalSetup: "./global-setup.ts",
  use: {
    baseURL: WEB_URL,
    trace: "on-first-retry",
    video: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testDir: "./support", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      testIgnore: /auth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        // Absolute path: a relative string here resolves against cwd (the
        // repo root when running `npm run e2e`), not against this config
        // file's directory — verified empirically (ENOENT one level up).
        storageState: path.resolve(__dirname, "./.auth/user.json"),
      },
      dependencies: ["setup"],
    },
    // auth.spec.ts drives the app's own sign-in form, so it must start
    // signed OUT — it cannot share the "setup" project's storage state.
    {
      name: "chromium-anon",
      testMatch: /auth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: { cookies: [], origins: [] },
      },
    },
  ],
  webServer: [
    {
      // build:shared first — dev:api imports @travelplan/shared, and a cold
      // clone or a shared-package edit would otherwise leave a stale/absent
      // dist. reuseExistingServer:false always: a leftover dev server would
      // be running against the real dev DB and Clerk keys, silently
      // discarding every env override below.
      command: "npm run build:shared && npm run dev:api",
      cwd: ROOT,
      url: `${API_URL}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...apiEnv, PORT: String(API_PORT) },
    },
    {
      // Pin + hard-fail on the port via CLI flags rather than vite.config.ts
      // — strictPort:true there would make the team's everyday `dev:web`
      // hard-fail whenever 5173 is already busy, for no E2E benefit.
      command: `npm run dev -w frontend/web -- --port ${WEB_PORT} --strictPort`,
      cwd: ROOT,
      url: WEB_URL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        VITE_CLERK_PUBLISHABLE_KEY: CLERK_PK,
        // Do NOT set VITE_API_URL here: axios.ts already defaults to
        // http://localhost:3000/api (with the /api suffix) — setting it to
        // just http://localhost:3000 (as the `quality` CI job's build step
        // does) would 404 every request.
      },
    },
  ],
});
