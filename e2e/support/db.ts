import { MongoClient } from "mongodb";

/**
 * Drops the E2E database fresh before every run — used only from
 * global-setup.ts. Free tier is 10 trips/month (UserQuotaService), so a
 * persistent DB across runs would eventually start failing specs with a
 * quota error that looks like a UI bug.
 *
 * No test-only HTTP reset endpoint is added for this: even POST
 * /api/dev/scrape-insights — auth-gated and dev-only (see
 * isDevRoutesEnabled() in app.ts) — stays scoped to fanning out a scrape job,
 * never a raw DB write. A reset endpoint would be a more destructive
 * precedent than anything currently in /api/dev, so this stays a direct
 * MongoClient drop instead of an HTTP route.
 */
export async function resetE2EDatabase(uri: string): Promise<void> {
  if (!/\/travelplan_e2e(\?|$)/.test(uri)) {
    throw new Error(
      `Refusing to drop a database that isn't travelplan_e2e: ${uri}`,
    );
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    await client.db().dropDatabase();
  } finally {
    await client.close();
  }
}
