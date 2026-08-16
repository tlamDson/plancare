import { describe, it, expect, vi } from "vitest";

vi.mock("../../../lib/queue", () => ({
  createQueue: vi.fn(() => ({
    getJob: vi.fn(),
    add: vi.fn(),
  })),
}));

import { mapJobState, normalizeProgress } from "./trip-status.service";

describe("mapJobState", () => {
  it("maps BullMQ 'prioritized' state to QUEUED (not IDLE)", () => {
    // Regression guard: with priority queues, BullMQ reports jobs as
    // "prioritized" rather than "waiting" — the UI must not show 0%/IDLE
    // for a job that is actually queued.
    expect(mapJobState("prioritized")).toBe("QUEUED");
  });

  it.each(["waiting", "delayed", "paused", "waiting-children"])(
    "maps BullMQ state %s to QUEUED",
    (state) => {
      expect(mapJobState(state)).toBe("QUEUED");
    },
  );

  it("maps 'active' to PROCESSING", () => {
    expect(mapJobState("active")).toBe("PROCESSING");
  });

  it("maps 'completed' to COMPLETED and 'failed' to FAILED", () => {
    expect(mapJobState("completed")).toBe("COMPLETED");
    expect(mapJobState("failed")).toBe("FAILED");
  });

  it("maps an unrecognized state to IDLE", () => {
    expect(mapJobState("some-unknown-state")).toBe("IDLE");
  });
});

describe("normalizeProgress", () => {
  it("returns { percent } for a plain number", () => {
    expect(normalizeProgress(42)).toEqual({ percent: 42 });
  });

  it("returns percent + currentStep for an object payload", () => {
    expect(
      normalizeProgress({ percent: 50, currentStep: "Validating..." }),
    ).toEqual({
      percent: 50,
      currentStep: "Validating...",
    });
  });

  it("returns { percent: 0 } for an object with no percent field", () => {
    expect(normalizeProgress({})).toEqual({ percent: 0 });
  });

  it("returns { percent: 0 } for null or a string", () => {
    expect(normalizeProgress(null)).toEqual({ percent: 0 });
    expect(normalizeProgress("50")).toEqual({ percent: 0 });
  });
});
