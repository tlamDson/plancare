/**
 * Planner Hooks
 *
 * Section 2.1: Job Queue Pattern
 * Section 2.2: Streaming & Real-Time feedback
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-client";
import { useJobPoller } from "./useJobPoller";
import * as plannerApi from "../api/planner.api";
import type {
  GenerateItineraryRequest,
  OptimizeRouteRequest,
} from "../api/planner.api";

// ============================================
// GENERATE ITINERARY WITH POLLING
// ============================================

export interface UseGenerateItineraryOptions {
  onComplete?: (result: unknown) => void;
  onError?: (error: string) => void;
}

export function useGenerateItinerary(
  options: UseGenerateItineraryOptions = {},
) {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);

  // Mutation to trigger the job
  const mutation = useMutation({
    mutationFn: (data: GenerateItineraryRequest) =>
      plannerApi.generateItinerary(data),
    onSuccess: (response) => {
      setJobId(response.jobId);
      toast.info("AI is generating your itinerary...");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start itinerary generation");
    },
  });

  // Poll for job status
  const jobState = useJobPoller({
    jobId,
    onComplete: (result) => {
      setJobId(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
      toast.success("Itinerary generated successfully!");
      options.onComplete?.(result);
    },
    onError: (error) => {
      setJobId(null);
      toast.error(error || "Failed to generate itinerary");
      options.onError?.(error);
    },
  });

  const trigger = useCallback(
    (data: GenerateItineraryRequest) => {
      mutation.mutate(data);
    },
    [mutation],
  );

  const reset = useCallback(() => {
    setJobId(null);
  }, []);

  return {
    trigger,
    reset,
    isTriggering: mutation.isPending,
    ...jobState,
  };
}

// ============================================
// OPTIMIZE ROUTE WITH POLLING
// ============================================

export function useOptimizeRoute(options: UseGenerateItineraryOptions = {}) {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: OptimizeRouteRequest) => plannerApi.optimizeRoute(data),
    onSuccess: (response) => {
      setJobId(response.jobId);
      toast.info("Optimizing your route...");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start route optimization");
    },
  });

  const jobState = useJobPoller({
    jobId,
    onComplete: (result) => {
      setJobId(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
      toast.success("Route optimized!");
      options.onComplete?.(result);
    },
    onError: (error) => {
      setJobId(null);
      toast.error(error || "Failed to optimize route");
      options.onError?.(error);
    },
  });

  const trigger = useCallback(
    (data: OptimizeRouteRequest) => {
      mutation.mutate(data);
    },
    [mutation],
  );

  return {
    trigger,
    isTriggering: mutation.isPending,
    ...jobState,
  };
}

// ============================================
// AI SUGGESTIONS
// ============================================

export function useAISuggestions() {
  const [jobId, setJobId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (params: {
      tripId: string;
      query: string;
      category?: string;
    }) => plannerApi.getSuggestions(params),
    onSuccess: (response) => {
      setJobId(response.jobId);
    },
  });

  const jobState = useJobPoller({
    jobId,
    onComplete: () => {
      setJobId(null);
    },
    onError: () => {
      setJobId(null);
    },
  });

  return {
    search: mutation.mutate,
    isSearching: mutation.isPending,
    suggestions: jobState.result as unknown[] | null,
    ...jobState,
  };
}
