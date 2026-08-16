import { describe, it, expect } from "vitest";
import {
  formatResultsTable,
  summarise,
  formatRequiredEnvSection,
} from "./report";
import type { CheckResult } from "./types";

const results: CheckResult[] = [
  {
    name: "MongoDB",
    status: "OK",
    detail: "db=travelplan v7.0.14",
    latencyMs: 120,
  },
  {
    name: "Gemini",
    status: "FAIL",
    detail: "HTTP 400 INVALID_ARGUMENT",
    latencyMs: 88,
  },
  { name: "Stripe", status: "SKIP", detail: "STRIPE_SECRET_KEY not set" },
];

describe("formatResultsTable", () => {
  it("renders one line per result including name, status and detail", () => {
    const table = formatResultsTable(results);
    for (const r of results) {
      const line = table.split("\n").find((l) => l.includes(r.name));
      expect(line).toBeDefined();
      expect(line).toContain(r.status);
      expect(line).toContain(r.detail);
    }
  });

  it("aligns the status column across rows of differing name lengths", () => {
    const table = formatResultsTable(results);
    const dataLines = table
      .split("\n")
      .filter((l) => results.some((r) => l.includes(r.name)));
    const statusColumns = dataLines.map((l) =>
      l.indexOf(l.trim().split(/\s{2,}/)[1] ?? ""),
    );
    expect(new Set(statusColumns).size).toBe(1);
  });

  it("shows latency for timed checks and leaves it blank for skipped ones", () => {
    const table = formatResultsTable(results);
    expect(table).toContain("120");
    const skipLine = table.split("\n").find((l) => l.includes("Stripe"));
    expect(skipLine).toBeDefined();
    expect(skipLine).not.toMatch(/\d+\s*ms/);
  });

  it("handles an empty result set without throwing", () => {
    expect(() => formatResultsTable([])).not.toThrow();
  });
});

describe("summarise", () => {
  it("counts each status", () => {
    expect(summarise(results)).toEqual({
      ok: 1,
      failed: 1,
      skipped: 1,
      total: 3,
    });
  });

  it("reports zeroes for an empty set", () => {
    expect(summarise([])).toEqual({ ok: 0, failed: 0, skipped: 0, total: 0 });
  });
});

describe("formatRequiredEnvSection", () => {
  it("marks a present required variable as set without printing its value", () => {
    const out = formatRequiredEnvSection({
      MONGO_URI: { present: true, source: "backend/.env" },
    });
    expect(out).toContain("MONGO_URI");
    expect(out).toContain("backend/.env");
  });

  it("warns that the backend crashes at boot when a required variable is missing", () => {
    const out = formatRequiredEnvSection({
      GEMINI_API_KEY: { present: false, source: null },
    });
    expect(out).toContain("GEMINI_API_KEY");
    expect(out).toMatch(/crash/i);
  });

  it("does not warn about crashing when everything required is present", () => {
    const out = formatRequiredEnvSection({
      MONGO_URI: { present: true, source: ".env" },
      GEMINI_API_KEY: { present: true, source: ".env" },
    });
    expect(out).not.toMatch(/crash/i);
  });
});
