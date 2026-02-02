/**
 * Job Polling Hook
 *
 * Section 2.1: The Polling Pattern
 *
 * When triggering a long-running Agent task:
 * 1. Trigger: POST request returns { jobId }
 * 2. Poll: Use react-query to poll /jobs/:id every 2 seconds
 * 3. States: Handle 4 distinct states: IDLE -> QUEUED -> PROCESSING -> COMPLETED
 *
 * Section 7: Testing - Accepts mockStatus prop for testing UI states
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import { jobSchema, type Job, type JobStatus } from "@/utils/schemas";
import { validateAPI } from "@/utils/validation";

// ============================================
// TYPES
// ============================================

export interface UseJobPollerOptions {
  /** Job ID to poll */
  jobId: string | null;
  /** Polling interval in ms (default: 2000) */
  interval?: number;
  /** Callback when job completes */
  onComplete?: (result: unknown) => void;
  /** Callback when job fails */
  onError?: (error: string) => void;
  /** Mock status for testing (Section 7) */
  mockStatus?: JobStatus;
  /** Mock progress for testing */
  mockProgress?: number;
  /** Mock current step for testing */
  mockCurrentStep?: string;
}

export interface JobPollerState {
  status: JobStatus;
  progress: number;
  currentStep: string | null;
  result: unknown | null;
  error: string | null;
  isPolling: boolean;
}

// ============================================
// API FUNCTION
// ============================================

async function fetchJobStatus(jobId: string): Promise<Job> {
  const response = await apiClient.get(`/jobs/${jobId}`);
  return validateAPI(
    jobSchema,
    response.data.data || response.data,
    "fetchJobStatus",
  );
}

// ============================================
// HOOK
// ============================================

/**
 * Poll for job status updates
 *
 * @example
 * const { status, progress, currentStep } = useJobPoller({
 *   jobId: "abc123",
 *   onComplete: (result) => console.log("Done!", result),
 * });
 *
 * // For testing:
 * const { status } = useJobPoller({
 *   jobId: null,
 *   mockStatus: "PROCESSING",
 *   mockProgress: 50,
 *   mockCurrentStep: "Analyzing weather data...",
 * });
 */
export function useJobPoller({
  jobId,
  interval = 2000,
  onComplete,
  onError,
  mockStatus,
  mockProgress,
  mockCurrentStep,
}: UseJobPollerOptions): JobPollerState {
  const queryClient = useQueryClient();

  // Determine if we're in mock mode
  const isMockMode = mockStatus !== undefined;

  // Track completion state via the job data itself, not separate state
  const { data: job, isLoading } = useQuery({
    queryKey: queryKeys.jobs.detail(jobId || "no-job"),
    queryFn: () => fetchJobStatus(jobId!),
    enabled: !isMockMode && !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling when job is complete or failed
      if (data?.status === "COMPLETED" || data?.status === "FAILED") {
        return false;
      }
      return interval;
    },
    refetchIntervalInBackground: false,
  });

  // Derive completion from job data
  const isComplete = job?.status === "COMPLETED" || job?.status === "FAILED";

  // Handle completion callbacks
  useEffect(() => {
    if (isMockMode || !job) return;

    if (job.status === "COMPLETED") {
      onComplete?.(job.result);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    } else if (job.status === "FAILED") {
      onError?.(job.error || "Job failed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    job?.status,
    job?.result,
    job?.error,
    onComplete,
    onError,
    queryClient,
    isMockMode,
  ]);

  // Return mock state for testing (Section 7)
  if (isMockMode) {
    return {
      status: mockStatus,
      progress: mockProgress ?? (mockStatus === "COMPLETED" ? 100 : 0),
      currentStep: mockCurrentStep ?? null,
      result: mockStatus === "COMPLETED" ? { mock: true } : null,
      error: mockStatus === "FAILED" ? "Mock error" : null,
      isPolling: mockStatus === "PROCESSING" || mockStatus === "QUEUED",
    };
  }

  // Return idle state if no jobId
  if (!jobId) {
    return {
      status: "IDLE",
      progress: 0,
      currentStep: null,
      result: null,
      error: null,
      isPolling: false,
    };
  }

  return {
    status: job?.status || (isLoading ? "QUEUED" : "IDLE"),
    progress: job?.progress || 0,
    currentStep: job?.currentStep || null,
    result: job?.result || null,
    error: job?.error || null,
    isPolling: !isComplete && !!jobId,
  };
}

// ============================================
// TRIGGER JOB HOOK
// ============================================

/**
 * Hook to trigger a new agent job
 * Returns mutation to start job and jobId for polling
 */
export function useTriggerJob() {
  const [jobId, setJobId] = useState<string | null>(null);

  const trigger = useCallback(async (endpoint: string, data: unknown) => {
    const response = await apiClient.post(endpoint, data);
    const newJobId = response.data.jobId;
    setJobId(newJobId);
    return newJobId;
  }, []);

  const reset = useCallback(() => {
    setJobId(null);
  }, []);

  return { jobId, trigger, reset };
}
