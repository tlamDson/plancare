import { describe, it, expect } from "vitest";
import pino from "pino";
import { Writable } from "stream";
import { buildLoggerOptions } from "./logger";

/** Captures pino's JSON output lines by handing it an in-memory Writable
 * instead of stdout, so redaction/tagging can be asserted on real output
 * rather than just the options object. */
function captureLogger(service: "api" | "worker") {
  const lines: string[] = [];
  const dest = new Writable({
    write(chunk, _enc, cb) {
      lines.push(chunk.toString());
      cb();
    },
  });
  const testLogger = pino(buildLoggerOptions(service), dest);
  return { testLogger, lines };
}

/** Parses the first captured log line, failing loudly if pino wrote nothing.
 * Returned as `any` — tests assert on arbitrary nested JSON shapes. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function firstLine(lines: string[]): any {
  expect(lines[0]).toBeDefined();
  return JSON.parse(lines[0] as string);
}

describe("buildLoggerOptions redaction", () => {
  it("redacts a top-level sensitive field", () => {
    const { testLogger, lines } = captureLogger("api");
    testLogger.info({ token: "abc123", tripId: "trip-1" }, "test");
    const line = firstLine(lines);
    expect(line.token).toBe("[Redacted]");
    expect(line.tripId).toBe("trip-1");
  });

  it("redacts a one-level-nested sensitive field", () => {
    const { testLogger, lines } = captureLogger("api");
    testLogger.info(
      { user: { email: "user@example.com", id: "user-1" } },
      "test",
    );
    const line = firstLine(lines);
    expect(line.user.email).toBe("[Redacted]");
    expect(line.user.id).toBe("user-1");
  });

  it("redacts req.headers.authorization and req.headers.cookie", () => {
    const { testLogger, lines } = captureLogger("api");
    testLogger.info(
      {
        req: {
          headers: { authorization: "Bearer xyz", cookie: "session=abc" },
        },
      },
      "test",
    );
    const line = firstLine(lines);
    expect(line.req.headers.authorization).toBe("[Redacted]");
    expect(line.req.headers.cookie).toBe("[Redacted]");
  });

  it("does not redact unrelated fields", () => {
    const { testLogger, lines } = captureLogger("api");
    testLogger.info({ jobId: "job-1", progress: 50 }, "test");
    const line = firstLine(lines);
    expect(line.jobId).toBe("job-1");
    expect(line.progress).toBe(50);
  });
});

describe("buildLoggerOptions service tag", () => {
  it("tags api logs with service: api", () => {
    const { testLogger, lines } = captureLogger("api");
    testLogger.info("hello");
    expect(firstLine(lines).service).toBe("api");
  });

  it("tags worker logs with service: worker", () => {
    const { testLogger, lines } = captureLogger("worker");
    testLogger.info("hello");
    expect(firstLine(lines).service).toBe("worker");
  });
});
