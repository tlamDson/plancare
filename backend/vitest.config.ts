import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // *.integration.test.ts needs real Mongo/Redis + the integration setup
    // file (vitest.integration.config.ts, `npm run test:integration`) — keep
    // them out of the plain unit run.
    exclude: ["**/node_modules/**", "src/**/*.integration.test.ts"],
    // Hermetic defaults for envalid's fail-fast required vars (config/env.ts),
    // so unit tests don't depend on a local .env file or CI-provided secrets.
    // Mirrors the dummy values ci-pr.yml sets for the "Unit Tests" step.
    env: {
      NODE_ENV: "test",
      MONGO_URI:
        "mongodb://test_user:test_password@localhost:27017/test_db?authSource=admin",
      CLERK_SECRET_KEY: "sk_test_dummy_key_for_tests",
      CLERK_WEBHOOK_SIGNING_SECRET: "whsec_dummy_secret",
      GEMINI_API_KEY: "sk-dummy-key-for-tests",
      // billing/stripe.service.ts does `new Stripe(env.STRIPE_SECRET_KEY)` at
      // *import* time — an empty key throws immediately, so any test that
      // transitively imports app.ts/billing routes needs this set.
      STRIPE_SECRET_KEY: "sk_test_dummy_key_for_tests",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/test/**"],
    },
  },
});
