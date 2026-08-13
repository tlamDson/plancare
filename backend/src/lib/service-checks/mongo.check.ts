import mongoose from "mongoose";
import { skipped, truncate } from "./http-check";
import type { CheckResult, ServiceEnv } from "./types";

const SERVER_SELECTION_TIMEOUT_MS = 10_000;

/**
 * Uses `createConnection` rather than `mongoose.connect` so the check never
 * mutates the shared global connection the app itself relies on.
 */
export async function checkMongo(env: ServiceEnv): Promise<CheckResult> {
  const uri = env.MONGO_URI?.trim();
  if (!uri) return skipped("MongoDB", "MONGO_URI not set");

  const startedAt = Date.now();
  let connection: Awaited<
    ReturnType<ReturnType<typeof mongoose.createConnection>["asPromise"]>
  > | null = null;

  try {
    connection = await mongoose
      .createConnection(uri, {
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      })
      .asPromise();

    const db = connection.db;
    if (!db)
      throw new Error(
        "connection established but no database handle was returned",
      );

    const admin = db.admin();
    await admin.command({ ping: 1 });

    // buildInfo is a bonus: some Atlas roles cannot run it, which must not fail the check.
    let version: string | null = null;
    try {
      const info = (await admin.command({ buildInfo: 1 })) as {
        version?: string;
      };
      version = info?.version ?? null;
    } catch {
      version = null;
    }

    const dbName = db.databaseName;
    const detail = version ? `db=${dbName} v${version}` : `db=${dbName}`;
    return {
      name: "MongoDB",
      status: "OK",
      detail,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name: "MongoDB",
      status: "FAIL",
      // The URI carries credentials; only the driver's message is safe to print.
      detail: truncate(message, 140),
      latencyMs: Date.now() - startedAt,
    };
  } finally {
    await connection?.close().catch(() => undefined);
  }
}
