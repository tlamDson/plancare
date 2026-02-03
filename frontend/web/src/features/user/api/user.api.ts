/**
 * User API Layer
 *
 * Section 3.2: Zod Validation at the Gate
 */

import { z } from "zod";
import { apiClient } from "@/lib/axios";
import { validateAPI } from "@/utils/validation";

// ============================================
// RESPONSE SCHEMAS
// ============================================

export const userProfileSchema = z.object({
  _id: z.string(),
  clerkUserId: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string().url().optional().nullable(),
  gender: z.string().optional(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  preferences: z
    .object({
      currency: z.string().length(3),
      budgetRange: z.number().min(0).optional(),
      travelStyle: z.array(z.string()).optional(),
    })
    .optional(),
  notificationPreferences: z
    .object({
      tripReminders: z.boolean().optional(),
      budgetAlerts: z.boolean().optional(),
      tripInvites: z.boolean().optional(),
      aiSuggestions: z.boolean().optional(),
      doNotDisturb: z.boolean().optional(),
    })
    .optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// ============================================
// REQUEST SCHEMAS
// ============================================

export const updateUserRequestSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  preferences: z
    .object({
      currency: z.string().length(3).optional(),
      budgetRange: z.number().min(0).optional(),
      travelStyle: z.array(z.string()).optional(),
    })
    .optional(),
  notificationPreferences: z
    .object({
      tripReminders: z.boolean().optional(),
      budgetAlerts: z.boolean().optional(),
      tripInvites: z.boolean().optional(),
      aiSuggestions: z.boolean().optional(),
      doNotDisturb: z.boolean().optional(),
    })
    .optional(),
});

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get current user profile
 */
export async function getUserMe(): Promise<UserProfile> {
  const response = await apiClient.get("/users/me");
  return validateAPI(userProfileSchema, response.data, "getUserMe");
}

/**
 * Update current user profile
 */
export async function updateUserMe(
  data: UpdateUserRequest,
): Promise<UserProfile> {
  const response = await apiClient.patch("/users/me", data);
  return validateAPI(userProfileSchema, response.data, "updateUserMe");
}
