import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderHookWithQuery } from "@/test/renderHookWithQuery";
import { queryKeys } from "@/lib/query-client";
import { makeTrip } from "@/test/factories/trip";
import { useLoadNextChunk } from "../useLoadNextChunk";

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));
import { toast } from "sonner";

describe("useLoadNextChunk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when tripId is undefined", async () => {
    const { result } = renderHookWithQuery(() =>
      useLoadNextChunk(undefined, 3),
    );
    await act(async () => {
      await result.current.loadNextChunk();
    });
    expect(result.current.isLoadingChunk).toBe(false);
  });

  it("reports allChunksLoaded and skips the fetch once nextChunkIndex >= totalChunks", async () => {
    let fetched = false;
    server.use(
      http.get("*/trips/:tripId/chunks/:chunkIndex", () => {
        fetched = true;
        return HttpResponse.json({ ready: true, days: [] });
      }),
    );
    const { result } = renderHookWithQuery(() =>
      useLoadNextChunk("trip-1", 1, 1),
    );
    expect(result.current.allChunksLoaded).toBe(true);
    await act(async () => {
      await result.current.loadNextChunk();
    });
    expect(fetched).toBe(false);
  });

  it("merges unique new days into the cached trip and advances the chunk index", async () => {
    server.use(
      http.get("*/trips/:tripId/chunks/:chunkIndex", () =>
        HttpResponse.json({
          ready: true,
          days: [{ day: 4, date: "2026-06-04T00:00:00.000Z", activities: [] }],
          chunksReady: [true, true],
        }),
      ),
    );
    const { result, queryClient } = renderHookWithQuery(() =>
      useLoadNextChunk("trip-1", 2, 1),
    );
    queryClient.setQueryData(
      queryKeys.trips.detail("trip-1"),
      makeTrip({
        _id: "trip-1",
        itinerary: [
          { day: 1, date: "2026-06-01T00:00:00.000Z", activities: [] },
        ],
      }),
    );

    await act(async () => {
      await result.current.loadNextChunk();
    });

    const cached = queryClient.getQueryData(
      queryKeys.trips.detail("trip-1"),
    ) as ReturnType<typeof makeTrip> | undefined;
    expect(cached?.itinerary.map((d) => d.day)).toEqual([1, 4]);
    expect(result.current.nextChunkIndex).toBe(2);
  });

  it("does not merge duplicate days already present in the cache", async () => {
    server.use(
      http.get("*/trips/:tripId/chunks/:chunkIndex", () =>
        HttpResponse.json({
          ready: true,
          days: [{ day: 1, date: "2026-06-01T00:00:00.000Z", activities: [] }],
        }),
      ),
    );
    const { result, queryClient } = renderHookWithQuery(() =>
      useLoadNextChunk("trip-1", 2, 1),
    );
    queryClient.setQueryData(
      queryKeys.trips.detail("trip-1"),
      makeTrip({
        _id: "trip-1",
        itinerary: [
          { day: 1, date: "2026-06-01T00:00:00.000Z", activities: [] },
        ],
      }),
    );

    await act(async () => {
      await result.current.loadNextChunk();
    });

    const cached = queryClient.getQueryData(
      queryKeys.trips.detail("trip-1"),
    ) as ReturnType<typeof makeTrip> | undefined;
    expect(cached?.itinerary).toHaveLength(1);
  });

  it("shows an info toast and does not advance when the chunk is not ready yet", async () => {
    server.use(
      http.get("*/trips/:tripId/chunks/:chunkIndex", () =>
        HttpResponse.json({ ready: false }),
      ),
    );
    const { result } = renderHookWithQuery(() =>
      useLoadNextChunk("trip-1", 3, 1),
    );
    await act(async () => {
      await result.current.loadNextChunk();
    });
    expect(toast.info).toHaveBeenCalled();
    expect(result.current.nextChunkIndex).toBe(1);
  });

  it("shows an error toast when the request fails", async () => {
    server.use(
      http.get("*/trips/:tripId/chunks/:chunkIndex", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 }),
      ),
    );
    const { result } = renderHookWithQuery(() =>
      useLoadNextChunk("trip-1", 3, 1),
    );
    await act(async () => {
      await result.current.loadNextChunk();
    });
    expect(toast.error).toHaveBeenCalled();
    expect(result.current.isLoadingChunk).toBe(false);
  });
});
