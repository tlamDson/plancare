import type { JobsOptions } from "bullmq";

/**
 * Shared job-retention policy for every BullMQ queue in this app.
 *
 * Without an explicit policy, BullMQ keeps every completed/failed job in
 * Redis forever (trip-generation, sync-google-calendar before this change)
 * or — the opposite failure mode — insight-scraper used to set
 * `removeOnComplete: true`, deleting completions the instant they
 * finished, so nothing could ever read "how many jobs completed in the
 * last hour" from Redis.
 *
 * Age AND count bounds together: age alone still lets a traffic burst
 * blow up Redis inside the age window; count alone would evict a quiet
 * period's history the moment a burst refills the count.
 *
 * This is a UX/ops knob only — the authoritative history for reliability
 * math belongs in a durable store keyed by finish time (see the
 * reliability feature), not in whatever BullMQ still happens to have in
 * Redis.
 */
export const DEFAULT_JOB_RETENTION: Pick<
  JobsOptions,
  "removeOnComplete" | "removeOnFail"
> = {
  removeOnComplete: { age: 7 * 24 * 60 * 60, count: 1000 },
  // Failures get a longer window than completions — you need time to
  // notice and investigate a failure before it's evicted.
  removeOnFail: { age: 30 * 24 * 60 * 60, count: 500 },
};

/**
 * Canonical BullMQ queue names — the single source of truth. Before this,
 * "insight-scraper" was duplicated as a string literal in both
 * `insight-queue.ts` and `insight-worker.ts`; a rename in one place would
 * silently orphan the worker (it would keep listening on the old name
 * while producers enqueue under the new one).
 */
export const QUEUE_NAMES = {
  TRIP_GENERATION: "trip-generation",
  CALENDAR_SYNC: "sync-google-calendar",
  INSIGHT_SCRAPER: "insight-scraper",
} as const;
