/**
 * Trips API Layer
 *
 * Section 3.2: Zod Validation at the Gate
 */

import { apiClient } from "@/lib/axios";
import { tripSchema } from "@/utils/schemas";
import { validateAPI, validateArrayPartial } from "@/utils/validation";
import { z } from "zod";

// ============================================
// REQUEST SCHEMAS
// ============================================

export const createTripRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.object({
    currency: z.string().default("USD"),
    totalLimit: z.number().min(0),
  }),
  cities: z
    .array(
      z.object({
        cityId: z.string(),
        order: z.number(),
        stayNights: z.number(),
      }),
    )
    .optional(),
});

export const updateTripRequestSchema = createTripRequestSchema.partial();

export type CreateTripRequest = z.infer<typeof createTripRequestSchema>;
export type UpdateTripRequest = z.infer<typeof updateTripRequestSchema>;
export type Trip = z.infer<typeof tripSchema>;

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all trips for current user
 */
export async function getTrips(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<Trip[]> {
  const response = await apiClient.get("/trips", { params });
  const payload = response.data?.data ?? response.data?.trips ?? response.data;
  if (!Array.isArray(payload)) {
    throw new Error("Invalid trips response");
  }
  return validateArrayPartial(
    tripSchema,
    payload,
    "getTrips",
  );
}

/**
 * Get single trip by ID
 */
export async function getTrip(tripId: string): Promise<Trip> {
  const response = await apiClient.get(`/trips/${tripId}`);
  const payload =
    response.data?.data ??
    response.data?.trip ??
    response.data;
  return validateAPI(
    tripSchema,
    payload,
    "getTrip",
  );
}

/**
 * Create new trip
 */
export async function createTrip(data: CreateTripRequest): Promise<Trip> {
  const response = await apiClient.post("/trips", data);
  return validateAPI(
    tripSchema,
    response.data.data || response.data,
    "createTrip",
  );
}

/**
 * Update existing trip
 */
export async function updateTrip(
  tripId: string,
  data: UpdateTripRequest,
): Promise<Trip> {
  const response = await apiClient.patch(`/trips/${tripId}`, data);
  return validateAPI(
    tripSchema,
    response.data.data || response.data,
    "updateTrip",
  );
}

/**
 * Delete trip
 */
export async function deleteTrip(tripId: string): Promise<void> {
  await apiClient.delete(`/trips/${tripId}`);
}

/**
 * Update trip budget spent (atomic operation)
 */
export async function updateBudgetSpent(
  tripId: string,
  category: string,
  amount: number,
): Promise<Trip> {
  const response = await apiClient.post(`/trips/${tripId}/budget/spend`, {
    category,
    amount,
  });
  return validateAPI(
    tripSchema,
    response.data.data || response.data,
    "updateBudgetSpent",
  );
}
