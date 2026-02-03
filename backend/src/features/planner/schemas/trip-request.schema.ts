import { z } from "zod";
export { TripPreferencesSchema } from "@travelplan/shared";
export type { TripPreferences } from "@travelplan/shared";

// ============================================
// TRIP STATUS QUERY SCHEMA
// ============================================

export const TripStatusQuerySchema = z.object({
  tripId: z
    .string()
    .uuid()
    .or(z.string().regex(/^[0-9a-fA-F]{24}$/)), // UUID or MongoDB ObjectId
});

export type TripStatusQuery = z.infer<typeof TripStatusQuerySchema>;
