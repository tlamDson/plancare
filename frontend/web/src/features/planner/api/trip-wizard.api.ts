/**
 * Trip Wizard API
 *
 * Starts trip generation with Fire & Listen pattern.
 */

import { apiClient } from "@/lib/axios";
import { validateAPI } from "@/utils/validation";
import {
  TripPreferencesSchema,
  type TripPreferences,
} from "@travelplan/shared";
import { z } from "zod";

const tripWizardSuccessSchema = z.object({
  success: z.literal(true),
  jobId: z.string(),
  tripId: z.string(),
  message: z.string().optional(),
});

const tripWizardErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.unknown()).optional(),
});

const tripWizardResponseSchema = z.union([
  tripWizardSuccessSchema,
  tripWizardErrorSchema,
]);

export type TripWizardResponse = z.infer<typeof tripWizardSuccessSchema>;

export async function createTripFromWizard(
  preferences: TripPreferences,
): Promise<TripWizardResponse> {
  const validation = TripPreferencesSchema.safeParse(preferences);
  if (!validation.success) {
    throw new Error("Trip preferences are invalid");
  }

  console.log("🚀 [TRIP WIZARD] Sending preferences to API:", validation.data);

  const response = await apiClient.post("/trips", {
    preferences: validation.data,
  });

  const parsed = validateAPI(
    tripWizardResponseSchema,
    response.data,
    "createTripFromWizard",
  );

  if (!parsed.success) {
    throw new Error(parsed.message || "Failed to start trip generation");
  }

  console.log("✅ [TRIP WIZARD] Job started:", {
    jobId: parsed.jobId,
    tripId: parsed.tripId,
  });

  return parsed;
}
