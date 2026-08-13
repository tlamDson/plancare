import { beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";

// Hermetic-but-overridable defaults: CI (ci-pr.yml) sets these explicitly for
// the job's mongo/redis services; a local run falls back to the credentials
// docker-compose.yml provisions (`docker compose up -d mongodb redis`).
process.env.NODE_ENV ??= "test";
process.env.MONGO_URI ??=
  "mongodb://travelplan_admin:dev_password_change_in_prod@localhost:27017/travelplan_test?authSource=admin";
process.env.REDIS_HOST ??= "localhost";
process.env.REDIS_PORT ??= "6379";
process.env.REDIS_PASSWORD ??= "dev_redis_password";
process.env.CLERK_SECRET_KEY ??= "sk_test_dummy_key_for_tests";
process.env.CLERK_WEBHOOK_SIGNING_SECRET ??= "whsec_dummy_secret";
// @clerk/express's clerkMiddleware() (mounted globally in app.ts, ahead of
// every route — including fully public ones like /health) reads
// CLERK_PUBLISHABLE_KEY straight from process.env on every request and
// throws "Publishable key is missing" if it's unset, even though
// config/env.ts never declares this var as required. Must be a
// realistically-shaped pk_test_<base64(host$)> key or Clerk's own format
// check rejects it before ever getting to "missing".
process.env.CLERK_PUBLISHABLE_KEY ??=
  "pk_test_" + Buffer.from("clerk.example.com$").toString("base64");
process.env.GEMINI_API_KEY ??= "sk-dummy-key-for-tests";
// billing/stripe.service.ts does `new Stripe(env.STRIPE_SECRET_KEY)` at
// *import* time (not lazily) — an empty key throws immediately, which means
// importing the full app (createApp() -> billing routes) fails without this.
// This is itself a real finding: any deployment missing STRIPE_SECRET_KEY
// would crash at server boot, not just when a billing endpoint is hit.
process.env.STRIPE_SECRET_KEY ??= "sk_test_dummy_key_for_tests";

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI!);
}, 20_000);

// Keep integration tests independent — real Mongo, so state genuinely
// persists across `it()` blocks unless we clear it ourselves.
afterEach(async () => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return;
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  // Integration tests reuse the shared local dev Redis (docker-compose) —
  // obliterate just the queue(s) our own requests create so leftover test
  // jobs don't pile up in that instance. Skipped if BullMQ never touched
  // Redis for a given file (e.g. cors/destinations tests).
  try {
    const { createQueue } = await import("../lib/queue");
    const queue = createQueue("trip-generation");
    await queue.obliterate({ force: true });
    await queue.close();
  } catch {
    // Best-effort cleanup only — never fail the suite over it.
  }
});
