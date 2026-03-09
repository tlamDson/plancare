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
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";

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
}: RegenParams): Promise<{
  itinerary: Trip["itinerary"];
  regenCount?: number;
  regenLimit?: number;
}> {
  const res = await apiClient.post(`/trips/${tripId}/regen-activity`, {
    dayIndex,
    activityId,
    ...(hint ? { hint } : {}),
  });
  return {
    itinerary: res.data.itinerary,
    regenCount: res.data.regenCount,
    regenLimit: res.data.regenLimit,
  };
}

export function useRegenActivity() {
  const queryClient = useQueryClient();
  const {
    isPro,
    canUseRegen,
    incrementRegenUsage,
    setRegenUsage,
    openUpgradeModal,
  } = useSubscriptionStore();

  return useMutation({
    mutationFn: async (params: RegenParams) => {
      if (!isPro && !canUseRegen(params.tripId)) {
        openUpgradeModal("regen-limit");
        throw new Error("FREE_REGEN_LIMIT_REACHED");
      }
      return regenActivityApi(params);
    },

    onSuccess: (payload, { tripId }) => {
      queryClient.setQueryData<Trip>(queryKeys.trips.detail(tripId), (old) => {
        if (!old) return old;
        return { ...old, itinerary: payload.itinerary };
      });
      if (payload.regenCount !== undefined) {
        setRegenUsage(tripId, payload.regenCount);
      } else {
        incrementRegenUsage(tripId);
      }
      const usage = payload.regenCount ?? 0;
      if (!isPro && (usage === 4 || usage === 5)) {
        const left = 5 - usage;
        toast.info(
          left > 0
            ? `You have ${left} free regeneration left for this trip.`
            : "You have 1 free regeneration left for this trip.",
        );
      }
      toast.success("Activity replaced with a new suggestion!");
    },

    onError: (err: any) => {
      if (err?.message === "FREE_REGEN_LIMIT_REACHED") {
        return;
      }
      const msg =
        err?.response?.data?.message ||
        "Could not find a unique replacement. Try again.";
      toast.error(msg);
    },
  });
}
