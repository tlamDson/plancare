/**
 * Jobs API
 *
 * Retry failed jobs for dev testing.
 */

import { apiClient } from "@/lib/axios";
import { validateAPI } from "@/utils/validation";
import { z } from "zod";

const retryJobResponseSchema = z.object({
  success: z.literal(true),
  jobId: z.string(),
  tripId: z.string(),
  message: z.string().optional(),
});

export async function retryJob(jobId: string): Promise<{
  jobId: string;
  tripId: string;
}> {
  const response = await apiClient.post(`/jobs/${jobId}/retry`);
  const parsed = validateAPI(retryJobResponseSchema, response.data, "retryJob");
  return { jobId: parsed.jobId, tripId: parsed.tripId };
}

const cancelJobResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
});

export async function cancelJob(tripId: string): Promise<boolean> {
  const response = await apiClient.post(`/trips/${tripId}/cancel`);
  const parsed = validateAPI(
    cancelJobResponseSchema,
    response.data,
    "cancelTrip",
  );
  return parsed.success;
}
