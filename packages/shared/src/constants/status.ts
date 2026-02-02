export const TripStatusValues = [
  "DRAFT",
  "QUEUED",
  "PROCESSING",
  "PROCESSING_STEP_1",
  "PROCESSING_STEP_2",
  "COMPLETED",
  "FAILED",
] as const;

export type TripStatus = (typeof TripStatusValues)[number];
