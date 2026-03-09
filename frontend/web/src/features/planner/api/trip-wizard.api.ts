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
import { v4 as uuidv4 } from "uuid";

const tripWizardSuccessSchema = z.object({
  success: z.literal(true),
  jobId: z.string(),
  tripId: z.string(),
  tier: z.enum(["free", "pro"]).optional(),
  quota: z
    .object({
      remaining: z.number(),
      limit: z.number().optional(),
      tripsUsedThisCycle: z.number().optional(),
      resetAt: z.string().or(z.date()).optional(),
    })
    .optional(),
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
  language?: string,
  title?: string,
): Promise<TripWizardResponse> {
  const validation = TripPreferencesSchema.safeParse(preferences);
  if (!validation.success) {
    throw new Error("Trip preferences are invalid");
  }

  console.log("🚀 [TRIP WIZARD] Sending preferences to API:", validation.data);

  const idempotencyKey = uuidv4();
  const response = await apiClient.post(
    "/trips",
    { preferences: validation.data, language, title },
    { headers: { "X-Idempotency-Key": idempotencyKey } },
  );

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
