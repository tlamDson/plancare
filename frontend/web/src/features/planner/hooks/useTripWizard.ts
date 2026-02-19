/**
 * Trip Wizard Hook
 *
 * Starts trip generation and handles optimistic UI.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-client";
import { createTripFromWizard } from "../api/trip-wizard.api";
import type { TripPreferences } from "@travelplan/shared";

export type UseTripWizardOptions = {
  onSuccess?: (tripId: string, jobId: string) => void;
};

export function useTripWizard(options: UseTripWizardOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: TripPreferences) =>
      createTripFromWizard(preferences),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.lists() });
      toast.success("Trip queued! Your agent is getting started.");
      options.onSuccess?.(response.tripId, response.jobId);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start trip generation");
    },
  });
}
