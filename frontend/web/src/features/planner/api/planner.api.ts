/**
 * Planner API Layer
 *
 * API for AI-powered trip planning operations
 * Section 2.1: Async patterns with job queue
 */

import { apiClient } from "@/lib/axios";
import { z } from "zod";

// ============================================
// REQUEST SCHEMAS
// ============================================

export const generateItineraryRequestSchema = z.object({
  tripId: z.string(),
  preferences: z
    .object({
      interests: z.array(z.string()).optional(),
      pace: z.enum(["relaxed", "moderate", "active"]).optional(),
      budget: z.enum(["budget", "moderate", "luxury"]).optional(),
    })
    .optional(),
  prompt: z.string().optional(),
});

export const optimizeRouteRequestSchema = z.object({
  tripId: z.string(),
  dayNumber: z.number().optional(),
  optimizeFor: z.enum(["time", "distance", "cost"]).default("time"),
});

export type GenerateItineraryRequest = z.infer<
  typeof generateItineraryRequestSchema
>;
export type OptimizeRouteRequest = z.infer<typeof optimizeRouteRequestSchema>;

// ============================================
// API FUNCTIONS
// These return jobIds for polling (Section 2.1)
// ============================================

/**
 * Trigger AI itinerary generation
 * Returns jobId for polling
 */
export async function generateItinerary(
  data: GenerateItineraryRequest,
): Promise<{ jobId: string }> {
  const response = await apiClient.post("/planner/generate-itinerary", data);
  return { jobId: response.data.jobId };
}

/**
 * Trigger route optimization
 * Returns jobId for polling
 */
export async function optimizeRoute(
  data: OptimizeRouteRequest,
): Promise<{ jobId: string }> {
  const response = await apiClient.post("/planner/optimize-route", data);
  return { jobId: response.data.jobId };
}

/**
 * Get AI suggestions for a location
 */
export async function getSuggestions(params: {
  tripId: string;
  query: string;
  category?: string;
}): Promise<{ jobId: string }> {
  const response = await apiClient.post("/planner/suggestions", params);
  return { jobId: response.data.jobId };
}

/**
 * Check if trip is locked by agent
 */
export async function checkAgentLock(tripId: string): Promise<{
  isLocked: boolean;
  jobId?: string;
  lockedAt?: string;
}> {
  const response = await apiClient.get(`/planner/trips/${tripId}/lock-status`);
  return response.data;
}

/**
 * Manually release agent lock (admin/debug)
 */
export async function releaseAgentLock(tripId: string): Promise<void> {
  await apiClient.post(`/planner/trips/${tripId}/release-lock`);
}
