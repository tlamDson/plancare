/**
 * Auth API Layer
 *
 * Section 3.2: Zod Validation at the Gate
 * All API responses are validated before use
 */

import { apiClient } from "@/lib/axios";
import { userSchema } from "@/utils/schemas";
import { validateAPI } from "@/utils/validation";
import { z } from "zod";

// ============================================
// REQUEST/RESPONSE SCHEMAS
// ============================================

export const signInRequestSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpRequestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string().optional(), // If using JWT
});

export type SignInRequest = z.infer<typeof signInRequestSchema>;
export type SignUpRequest = z.infer<typeof signUpRequestSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Sign in user
 */
export async function signIn(data: SignInRequest): Promise<AuthResponse> {
  const response = await apiClient.post("/auth/signin", data);
  return validateAPI(authResponseSchema, response.data, "signIn");
}

/**
 * Sign up new user
 */
export async function signUp(data: SignUpRequest): Promise<AuthResponse> {
  const response = await apiClient.post("/auth/signup", data);
  return validateAPI(authResponseSchema, response.data, "signUp");
}

/**
 * Sign out user
 */
export async function signOut(): Promise<void> {
  await apiClient.post("/auth/signout");
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  const response = await apiClient.get("/auth/me");
  return validateAPI(userSchema, response.data, "getCurrentUser");
}

/**
 * Verify email with code
 */
export async function verifyEmail(code: string): Promise<AuthResponse> {
  const response = await apiClient.post("/auth/verify-email", { code });
  return validateAPI(authResponseSchema, response.data, "verifyEmail");
}
