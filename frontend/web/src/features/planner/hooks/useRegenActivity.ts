/**
 * useRegenActivity
 *
 * Mutation hook for regenerating a single itinerary activity.
 * No optimistic update — we show a per-card loading spinner while we wait
 * for the server to validate a unique replacement from the AI.
 *
 * On success: writes the updated itinerary directly into the React Query cache.
 * On error: surfaces a toast; cache is untouched (original activity stays).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-client";
import { apiClient } from "@/lib/axios";
import type { Trip } from "../api/trips.api";

interface RegenParams {
  tripId: string;
  dayIndex: number;
  activityId: string;
  hint?: string;
}

async function regenActivityApi({
  tripId,
  dayIndex,
  activityId,
  hint,
}: RegenParams): Promise<Trip["itinerary"]> {
  const res = await apiClient.post(`/trips/${tripId}/regen-activity`, {
    dayIndex,
    activityId,
    ...(hint ? { hint } : {}),
  });
  return res.data.itinerary;
}

export function useRegenActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: regenActivityApi,

    onSuccess: (newItinerary, { tripId }) => {
      queryClient.setQueryData<Trip>(queryKeys.trips.detail(tripId), (old) => {
        if (!old) return old;
        return { ...old, itinerary: newItinerary };
      });
      toast.success("Activity replaced with a new suggestion!");
    },

    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        "Could not find a unique replacement. Try again.";
      toast.error(msg);
    },
  });
}
