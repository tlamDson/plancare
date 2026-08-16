import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderHookWithQuery } from "@/test/renderHookWithQuery";
import { queryKeys } from "@/lib/query-client";
import { makeTrip, makeActivity } from "@/test/factories/trip";
import { useReorderActivities } from "../useReorderActivities";

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));
import { toast } from "sonner";

describe("useReorderActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies an optimistic reorder immediately, before the server responds", async () => {
    server.use(
      http.patch("*/trips/:tripId/reorder-activities", async () => {
        // Never resolves within this test's window — we only check the
        // optimistic state, applied synchronously in onMutate.
        await new Promise(() => undefined);
        return HttpResponse.json({});
      }),
    );

    const { result, queryClient } = renderHookWithQuery(() =>
      useReorderActivities(),
    );
    const trip = makeTrip({
      itinerary: [
        {
          day: 1,
          date: "2026-06-01T00:00:00.000Z",
          activities: [
            makeActivity({ _id: "a", order: 0 }),
            makeActivity({ _id: "b", order: 1 }),
          ],
        },
      ],
    });
    queryClient.setQueryData(queryKeys.trips.detail("trip-1"), trip);

    act(() => {
      result.current.mutate({
        tripId: "trip-1",
        dayIndex: 0,
        orderedActivityIds: ["b", "a"],
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData(
        queryKeys.trips.detail("trip-1"),
      ) as typeof trip | undefined;
      expect(cached?.itinerary[0]?.activities.map((a) => a._id)).toEqual([
        "b",
        "a",
      ]);
    });
  });

  it("rolls back to the previous order and shows an error toast when the server rejects", async () => {
    server.use(
      http.patch("*/trips/:tripId/reorder-activities", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 }),
      ),
    );

    const { result, queryClient } = renderHookWithQuery(() =>
      useReorderActivities(),
    );
    const trip = makeTrip({
      itinerary: [
        {
          day: 1,
          date: "2026-06-01T00:00:00.000Z",
          activities: [
            makeActivity({ _id: "a", order: 0 }),
            makeActivity({ _id: "b", order: 1 }),
          ],
        },
      ],
    });
    queryClient.setQueryData(queryKeys.trips.detail("trip-1"), trip);

    act(() => {
      result.current.mutate({
        tripId: "trip-1",
        dayIndex: 0,
        orderedActivityIds: ["b", "a"],
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData(
      queryKeys.trips.detail("trip-1"),
    ) as typeof trip | undefined;
    expect(cached?.itinerary[0]?.activities.map((a) => a._id)).toEqual([
      "a",
      "b",
    ]);
    expect(toast.error).toHaveBeenCalled();
  });

  it("syncs the server-returned itinerary into the cache on success", async () => {
    const serverItinerary = [
      {
        day: 1,
        date: "2026-06-01T00:00:00.000Z",
        activities: [
          makeActivity({ _id: "b", order: 0 }),
          makeActivity({ _id: "a", order: 1 }),
        ],
      },
    ];
    server.use(
      http.patch("*/trips/:tripId/reorder-activities", () =>
        HttpResponse.json({ itinerary: serverItinerary }),
      ),
    );

    const { result, queryClient } = renderHookWithQuery(() =>
      useReorderActivities(),
    );
    const trip = makeTrip({
      itinerary: [
        {
          day: 1,
          date: "2026-06-01T00:00:00.000Z",
          activities: [
            makeActivity({ _id: "a", order: 0 }),
            makeActivity({ _id: "b", order: 1 }),
          ],
        },
      ],
    });
    queryClient.setQueryData(queryKeys.trips.detail("trip-1"), trip);

    act(() => {
      result.current.mutate({
        tripId: "trip-1",
        dayIndex: 0,
        orderedActivityIds: ["b", "a"],
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const cached = queryClient.getQueryData(
      queryKeys.trips.detail("trip-1"),
    ) as typeof trip | undefined;
    expect(cached?.itinerary).toEqual(serverItinerary);
  });
});
