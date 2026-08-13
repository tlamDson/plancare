/**
 * Connectivity check for every external service TravelPlan depends on.
 *
 * Run: npm run check:services            (from repo root, or --workspace=backend)
 *      npm run check:services -- --strict (exit 1 when any check FAILs, for CI)
 *
 * Deliberately reads `process.env` directly instead of importing
 * `src/config/env.ts`: envalid fail-fasts on a missing required key, and this
 * script has to *report* that condition rather than die from it.
 */
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { checkClerk } from "../src/lib/service-checks/clerk.check";
import {
  checkGemini,
  checkGooglePlaces,
} from "../src/lib/service-checks/google.check";
import {
  checkMapbox,
  checkOpenWeather,
  checkSerper,
  checkStripe,
} from "../src/lib/service-checks/misc.check";
import { checkMongo } from "../src/lib/service-checks/mongo.check";
import { checkRedis } from "../src/lib/service-checks/redis.check";
import {
  formatRequiredEnvSection,
  formatResultsTable,
  summarise,
  type RequiredEnvState,
} from "../src/lib/service-checks/report";
import type { CheckResult, ServiceEnv } from "../src/lib/service-checks/types";

/** Same precedence the app uses: backend/.env wins, repo-root .env fills gaps. */
const ENV_FILES = [
  path.resolve(__dirname, "..", ".env"),
  path.resolve(__dirname, "..", "..", ".env"),
];

/** Required by envalid in src/config/env.ts — missing means the app cannot boot. */
const REQUIRED_VARS = [
  "MONGO_URI",
  "CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SIGNING_SECRET",
  "GEMINI_API_KEY",
];

const TRACKED_VARS = [
  ...REQUIRED_VARS,
  "REDIS_URL",
  "REDIS_HOST",
  "REDIS_PORT",
  "REDIS_PASSWORD",
  "REDIS_TLS",
  "GOOGLE_PLACES_API_KEY",
  "MAPBOX_ACCESS_TOKEN",
  "OPENWEATHER_API_KEY",
  "VITE_OPENWEATHER_API_KEY",
  "SERPER_API_KEY",
  "STRIPE_SECRET_KEY",
  "VITE_CLERK_PUBLISHABLE_KEY",
  "CLERK_PUBLISHABLE_KEY",
];

type ResolvedVar = { value: string; source: string };

/** Shell environment wins, then each .env file in order. */
function resolveEnv(): {
  env: ServiceEnv;
  sources: Map<string, string>;
  loaded: string[];
} {
  const parsedFiles: Array<{ label: string; values: Record<string, string> }> =
    [];
  const loaded: string[] = [];

  for (const file of ENV_FILES) {
    if (!fs.existsSync(file)) continue;
    const label = path
      .relative(path.resolve(__dirname, "..", ".."), file)
      .replace(/\\/g, "/");
    parsedFiles.push({ label, values: dotenv.parse(fs.readFileSync(file)) });
    loaded.push(label);
  }

  const env: ServiceEnv = {};
  const sources = new Map<string, string>();

  for (const name of TRACKED_VARS) {
    const resolved = resolveOne(name, parsedFiles);
    if (!resolved) continue;
    env[name] = resolved.value;
    sources.set(name, resolved.source);
  }

  return { env, sources, loaded };
}

function resolveOne(
  name: string,
  files: Array<{ label: string; values: Record<string, string> }>,
): ResolvedVar | null {
  const fromShell = process.env[name];
  if (fromShell && fromShell.trim())
    return { value: fromShell, source: "shell env" };

  for (const file of files) {
    const value = file.values[name];
    if (value && value.trim()) return { value, source: file.label };
  }
  return null;
}

function buildRequiredEnvState(
  env: ServiceEnv,
  sources: Map<string, string>,
): RequiredEnvState {
  const state: RequiredEnvState = {};
  for (const name of REQUIRED_VARS) {
    const present = Boolean(env[name]?.trim());
    state[name] = {
      present,
      source: present ? (sources.get(name) ?? null) : null,
    };
  }
  return state;
}

function reportVarSources(
  env: ServiceEnv,
  sources: Map<string, string>,
): string {
  const optional = TRACKED_VARS.filter((n) => !REQUIRED_VARS.includes(n));
  return optional
    .map((name) =>
      env[name]?.trim()
        ? `  [set]     ${name}  (from ${sources.get(name)})`
        : `  [unset]   ${name}`,
    )
    .join("\n");
}

async function main() {
  const strict = process.argv.includes("--strict");
  const { env, sources, loaded } = resolveEnv();

  console.log("\n=== TravelPlan service connectivity check ===\n");
  console.log(
    `Env files read: ${loaded.length ? loaded.join(", ") : "(none found)"}`,
  );
  console.log(
    "Values are never printed — only whether each variable is set.\n",
  );

  console.log("Required by envalid (backend boots only if all are set):");
  console.log(formatRequiredEnvSection(buildRequiredEnvState(env, sources)));

  console.log("\nOptional / feature-gating variables:");
  console.log(reportVarSources(env, sources));

  const results: CheckResult[] = await Promise.all([
    checkMongo(env),
    checkRedis(env),
    checkClerk(env),
    checkGemini(env),
    checkGooglePlaces(env),
    checkMapbox(env),
    checkOpenWeather(env),
    checkSerper(env),
    checkStripe(env),
  ]);

  console.log("\nService checks:\n");
  console.log(formatResultsTable(results));

  const summary = summarise(results);
  console.log(
    `\n${summary.ok} OK · ${summary.failed} FAIL · ${summary.skipped} SKIP (of ${summary.total})\n`,
  );

  if (strict && summary.failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
