import { describe, it, expect } from "vitest";
import { generateSyntheticOutcomes } from "./synthetic-seed";

describe("generateSyntheticOutcomes", () => {
  it("matches the requested distribution for n=100 (rounded sensibly)", () => {
    const items = generateSyntheticOutcomes(100, {
      completed: 0.9,
      fallback: 0.05,
      failed: 0.05,
    });
    expect(items).toHaveLength(100);
    expect(items.filter((i) => i.outcome === "completed")).toHaveLength(90);
    expect(items.filter((i) => i.outcome === "fallback")).toHaveLength(5);
    expect(items.filter((i) => i.outcome === "failed")).toHaveLength(5);
  });

  it("returns an empty array for n=0, never throws", () => {
    expect(() => generateSyntheticOutcomes(0)).not.toThrow();
    expect(generateSyntheticOutcomes(0)).toEqual([]);
  });

  it("prefixes every jobId with 'synthetic-' to distinguish fake data from real recordings", () => {
    const items = generateSyntheticOutcomes(5);
    for (const item of items) {
      expect(item.jobId.startsWith("synthetic-")).toBe(true);
    }
  });

  it("endToEndMs always equals queueWaitMs + processingMs", () => {
    const items = generateSyntheticOutcomes(20);
    for (const item of items) {
      expect(item.endToEndMs).toBe(item.queueWaitMs + item.processingMs);
    }
  });

  it("uses the default 90/5/5 distribution when none is given", () => {
    const items = generateSyntheticOutcomes(100);
    expect(items.filter((i) => i.outcome === "completed")).toHaveLength(90);
  });
});
