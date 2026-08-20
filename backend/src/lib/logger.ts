import pino from "pino";
import { env, appEnv } from "../config/env";

/**
 * Fields redacted from every log line regardless of nesting depth (top-level
 * key, e.g. `logger.info({ token }, ...)`) or one level deep (e.g.
 * `logger.info({ user: { email } }, ...)`), plus the two request-header
 * paths most likely to carry a live session. Zero Trust rule: nothing passed
 * to logger.*() should be assumed safe to emit verbatim.
 */
const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "password",
  "*.password",
  "token",
  "*.token",
  "apiKey",
  "*.apiKey",
  "secret",
  "*.secret",
  "email",
  "*.email",
];

/**
 * Builds the pino options shared by every process. `service` tags log lines
 * so API and worker output can be told apart in an aggregator — previously
 * hardcoded to "api" for both, see CLAUDE.md's Structured Logging rule.
 */
export function buildLoggerOptions(
  service: "api" | "worker" = "api",
): pino.LoggerOptions {
  const options: pino.LoggerOptions = {
    level: env.NODE_ENV === "development" ? "debug" : "info",
    base: {
      service,
      env: appEnv,
    },
    redact: {
      paths: REDACT_PATHS,
      censor: "[Redacted]",
    },
  };

  if (env.NODE_ENV === "development") {
    options.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    };
  }

  return options;
}

export const logger = pino(buildLoggerOptions("api"));

/** Same redaction/transport config as `logger`, tagged `service: "worker"`
 * — import this instead of `logger` in worker.ts and any worker-only job. */
export const workerLogger = pino(buildLoggerOptions("worker"));
