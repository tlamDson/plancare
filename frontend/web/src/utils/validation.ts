/**
 * API Validation Utility
 *
 * Section 3.2: Zod Validation at the Gate
 * RULE: Never trust API responses
 *
 * This utility wraps API calls with Zod validation
 * If validation fails, it logs the error and returns a safe fallback
 */

import type { z } from "zod";

// ============================================
// VALIDATION RESULT TYPE
// ============================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues: z.ZodIssue[] };

// ============================================
// SAFE PARSE WITH LOGGING
// ============================================

/**
 * Safely parse API data with Zod schema
 * Logs validation errors to console (Section 3.2)
 *
 * @example
 * const result = safeParseAPI(tripSchema, apiResponse);
 * if (!result.success) {
 *   return <DataError message={result.error} />;
 * }
 * return <TripCard trip={result.data} />;
 */
export function safeParseAPI<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  context?: string,
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Log detailed error for debugging
    console.error(`[API Validation Error]${context ? ` ${context}:` : ""}`, {
      issues: result.error.issues,
      receivedData: data,
    });

    // Return user-friendly error
    const firstIssue = result.error.issues[0];
    const errorMessage = firstIssue
      ? `Invalid data: ${firstIssue.path.join(".")} - ${firstIssue.message}`
      : "Invalid data received from server";

    return {
      success: false,
      error: errorMessage,
      issues: result.error.issues,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Validate API response and throw on failure
 * Use in react-query fetchers where you want to trigger error state
 *
 * @throws Error with validation details
 */
export function validateAPI<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  context?: string,
): z.infer<T> {
  const result = safeParseAPI(schema, data, context);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

/**
 * Validate array of items, filtering out invalid ones
 * Useful when you want to show valid items even if some are malformed
 *
 * @example
 * const validTrips = validateArrayPartial(tripSchema, apiTrips);
 * // Invalid trips are filtered out, valid ones are returned
 */
export function validateArrayPartial<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown[],
  context?: string,
): z.infer<T>[] {
  const validItems: z.infer<T>[] = [];
  const invalidIndices: number[] = [];

  data.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (result.success) {
      validItems.push(result.data);
    } else {
      invalidIndices.push(index);
    }
  });

  if (invalidIndices.length > 0) {
    console.warn(
      `[API Validation Warning]${context ? ` ${context}:` : ""} ` +
        `${invalidIndices.length} of ${data.length} items failed validation`,
      { invalidIndices },
    );
  }

  return validItems;
}
