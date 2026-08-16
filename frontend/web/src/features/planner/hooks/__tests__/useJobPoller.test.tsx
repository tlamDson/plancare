import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderHookWithQuery } from "@/test/renderHookWithQuery";
import { useJobPoller } from "../useJobPoller";

const baseJob = {
  jobId: "job-1",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

describe("useJobPoller — idle / mock modes (no network)", () => {
  it("returns IDLE and does not poll when jobId is null", () => {
    let called = false;
    server.use(
      http.get("*/jobs/:jobId", () => {
        called = true;
        return HttpResponse.json({ ...baseJob, status: "QUEUED" });
      }),
    );
    const { result } = renderHookWithQuery(() => useJobPoller({ jobId: null }));
    expect(result.current.status).toBe("IDLE");
    expect(result.current.isPolling).toBe(false);
    expect(called).toBe(false);
  });

  it("bypasses the network entirely in mock mode", () => {
    let called = false;
    server.use(
      http.get("*/jobs/:jobId", () => {
        called = true;
        return HttpResponse.json({ ...baseJob, status: "COMPLETED" });
      }),
    );
    const { result } = renderHookWithQuery(() =>
      useJobPoller({
        jobId: "job-1",
        mockStatus: "PROCESSING",
        mockProgress: 42,
        mockCurrentStep: "Analyzing...",
      }),
    );
    expect(result.current.status).toBe("PROCESSING");
    expect(result.current.progress).toBe(42);
    expect(result.current.currentStep).toBe("Analyzing...");
    expect(result.current.isPolling).toBe(true);
    expect(called).toBe(false);
  });
});

describe("useJobPoller — polling to a terminal state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("polls QUEUED -> PROCESSING -> COMPLETED, calls onComplete, then stops polling", async () => {
    let callCount = 0;
    server.use(
      http.get("*/jobs/:jobId", () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({
            ...baseJob,
            status: "QUEUED",
            progress: 0,
          });
        }
        if (callCount === 2) {
          return HttpResponse.json({
            ...baseJob,
            status: "PROCESSING",
            progress: 50,
          });
        }
        return HttpResponse.json({
          ...baseJob,
          status: "COMPLETED",
          progress: 100,
          result: { tripId: "trip-1" },
        });
      }),
    );

    const onComplete = vi.fn();
    const { result } = renderHookWithQuery(() =>
      useJobPoller({ jobId: "job-1", interval: 20, onComplete }),
    );

    await waitFor(() => expect(result.current.status).toBe("COMPLETED"), {
      timeout: 3000,
    });
    await waitFor(() =>
      expect(onComplete).toHaveBeenCalledWith({ tripId: "trip-1" }),
    );

    const countAfterComplete = callCount;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(callCount).toBe(countAfterComplete);
  });

  it("calls onError with the server error when the job fails", async () => {
    server.use(
      http.get("*/jobs/:jobId", () =>
        HttpResponse.json({
          ...baseJob,
          status: "FAILED",
          error: "AI generation failed",
        }),
      ),
    );
    const onError = vi.fn();
    const { result } = renderHookWithQuery(() =>
      useJobPoller({ jobId: "job-1", interval: 20, onError }),
    );

    await waitFor(() => expect(result.current.status).toBe("FAILED"));
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("AI generation failed"),
    );
  });
});

describe("useJobPoller — DELAYED/WAITING are not valid jobStatusSchema values", () => {
  it("errors out (via Zod) rather than reaching any DELAYED-specific handling", async () => {
    // jobStatusSchema doesn't include "DELAYED" (the backend always
    // collapses BullMQ's delayed/waiting states to "QUEUED" before
    // serializing — see trip-status.service.ts's JOB_STATE_TO_STATUS), so
    // fetchJobStatus's Zod validation throws before any such response could
    // ever reach the hook's return value. useJobPoller previously had a
    // dead `rawStatus === "DELAYED"` normalization branch for this that
    // could never run; it's been removed rather than kept as unreachable
    // code. This test documents the actual (reachable) behavior if the
    // server were ever to regress and send "DELAYED" over the wire.
    server.use(
      http.get("*/jobs/:jobId", () =>
        HttpResponse.json({
          ...baseJob,
          status: "DELAYED",
          currentStep: "retrying",
        }),
      ),
    );
    const { result } = renderHookWithQuery(() =>
      useJobPoller({ jobId: "job-1", interval: 20 }),
    );

    // The zod failure means `job` (query data) never populates, so
    // `isComplete` never becomes true and the poller keeps retrying forever
    // — it never recognizes this as terminal. That's part of the bug too;
    // we only assert the (reachable) displayed status here.
    await waitFor(() => expect(result.current.status).toBe("IDLE"), {
      timeout: 3000,
    });
    expect(result.current.currentStep).not.toBe(
      "AI timed out — retrying automatically...",
    );
  });
});
