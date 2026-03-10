/**
 * Calendar Sync BullMQ Queue
 *
 * Defines the queue and job data interface for Google Calendar sync jobs.
 */

import { createQueue } from "../../lib/queue";

export const calendarSyncQueue = createQueue("sync-google-calendar");

export interface CalendarSyncJobData {
  tripId: string;
  userId: string; // Clerk user ID
}
