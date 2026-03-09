export const TripStatusValues = [
  "DRAFT",
  "QUEUED",
  "PROCESSING",
  "PROCESSING_STEP_1",
  "PROCESSING_STEP_2",
  "COMPLETED",
  "FAILED",
  "FALLBACK",
] as const;

export type TripStatus = (typeof TripStatusValues)[number];
export const TripLifecycleValues = [
  "UPCOMING",
  "IN_TRIP",
  "COMPLETED",
  "CANCELLED",
] as const;

export type TripLifecycle = (typeof TripLifecycleValues)[number];
