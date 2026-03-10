/**
 * Calendar API
 *
 * Frontend API client for Google Calendar sync operations.
 */

import { apiClient } from "@/lib/axios";
import { z } from "zod";
import { validateAPI } from "@/utils/validation";

const syncCalendarResponseSchema = z.object({
  success: z.literal(true),
  jobId: z.string().optional(),
  message: z.string().optional(),
});

export interface SyncCalendarResult {
  jobId?: string;
  message?: string;
}

export async function syncTripToCalendar(
  tripId: string,
): Promise<SyncCalendarResult> {
  const response = await apiClient.post(`/trips/${tripId}/sync-calendar`);
  const parsed = validateAPI(
    syncCalendarResponseSchema,
    response.data,
    "syncTripToCalendar",
  );
  return { jobId: parsed.jobId, message: parsed.message };
}
