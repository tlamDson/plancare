/**
 * Zod API Schemas & Validation
 *
 * Section 3.2: Zod Validation at the Gate
 * RULE: Never trust API responses
 * ACTION: Define a Zod schema for every GET request
 * FAILURE: If safeParse fails, log error and render DataError component
 */

import { TripPreferencesSchema, TripStatusValues } from "@travelplan/shared";
import { z } from "zod";
// ============================================
// COMMON SCHEMAS
// ============================================

/** Standard API response wrapper */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional(),
    meta: z
      .object({
        page: z.number().optional(),
        limit: z.number().optional(),
        total: z.number().optional(),
      })
      .optional(),
  });

/** Pagination params */
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

/** GeoJSON Point */
export const geoPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
});

/** Coordinates (simple) */
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// ============================================
// JOB STATUS SCHEMAS (Section 2.1: Polling Pattern)
// ============================================

export const jobStatusSchema = z.enum([
  "IDLE",
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const jobSchema = z.object({
  jobId: z.string(),
  status: jobStatusSchema,
  progress: z.number().min(0).max(100).optional(),
  currentStep: z.string().optional(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Job = z.infer<typeof jobSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;

// ============================================
// USER SCHEMAS
// ============================================

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().url().optional(),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

// ============================================
// TRIP SCHEMAS
// ============================================

export { TripPreferencesSchema };

export const tripStatusSchema = z.enum(TripStatusValues);

export const tripTypeSchema = z.enum(["solo", "family", "friends", "business"]);

export const budgetCategorySchema = z.object({
  name: z.string(),
  limit: z.number().min(0),
  spent: z.number().min(0),
});

export const embeddedBudgetSchema = z.object({
  currency: z.string().default("USD"),
  totalLimit: z.number().min(0),
  totalSpent: z.number().min(0),
  breakdown: z.array(budgetCategorySchema),
});

export const activitySchema = z.object({
  _id: z.string().optional(),
  type: z.enum(["poi", "accommodation", "transport", "custom"]),
  placeId: z.string().optional(),
  name: z.string(),
  location: geoPointSchema.optional(),
  time: z.string().optional(),
  endTime: z.string().optional(),
  cost: z.number().optional(),
  status: z.enum(["planned", "confirmed", "completed", "cancelled"]),
  notes: z.string().optional(),
  order: z.number(),
});

export const itineraryDaySchema = z.object({
  _id: z.string().optional(),
  day: z.number(),
  date: z.string().datetime(),
  geoHash: z.string().optional(),
  activities: z.array(activitySchema),
});

export const staySchema = z.object({
  placeId: z.string().optional(),
  name: z.string(),
  type: z.enum(["hotel", "hostel", "airbnb", "other"]),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  pricePerNight: z.number(),
  totalPrice: z.number(),
  confirmationNumber: z.string().optional(),
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

export const cityStopSchema = z.object({
  cityId: z.string(),
  order: z.number(),
  stayNights: z.number(),
  stays: z.array(staySchema),
});

export const tripSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  budget: embeddedBudgetSchema,
  itinerary: z.array(itineraryDaySchema),
  cities: z.array(cityStopSchema),
  isAgentProcessing: z.boolean(),
  agentJobId: z.string().optional(),
  version: z.number(),
  status: tripStatusSchema,
  coverImage: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Trip = z.infer<typeof tripSchema>;
export type TripStatus = z.infer<typeof tripStatusSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type ItineraryDay = z.infer<typeof itineraryDaySchema>;

// ============================================
// PLACE SCHEMAS
// ============================================

export const placeCategorySchema = z.enum([
  "attraction",
  "restaurant",
  "cafe",
  "bar",
  "accommodation",
  "shopping",
  "transport",
  "entertainment",
  "nature",
  "museum",
  "landmark",
  "other",
]);

export const placeSchema = z.object({
  _id: z.string(),
  name: z.string(),
  category: placeCategorySchema,
  description: z.string().optional(),
  location: geoPointSchema,
  cityId: z.string().optional(),
  details: z.object({
    rating: z.number().min(0).max(5).optional(),
    reviewCount: z.number().optional(),
    priceLevel: z.number().min(1).max(4).optional(),
    images: z.array(z.string().url()).optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
  }),
  aiTags: z.array(z.string()).optional(),
  aiSummary: z.string().optional(),
  source: z.enum([
    "google",
    "tripadvisor",
    "booking",
    "manual",
    "ai_generated",
  ]),
  isActive: z.boolean(),
});

export type Place = z.infer<typeof placeSchema>;
export type PlaceCategory = z.infer<typeof placeCategorySchema>;

// ============================================
// AI SESSION SCHEMAS
// ============================================

export const aiMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.string().datetime(),
  actions: z
    .array(
      z.object({
        type: z.string(),
        label: z.string(),
        data: z.unknown().optional(),
      }),
    )
    .optional(),
});

export const aiSessionSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  tripId: z.string().optional(),
  messages: z.array(aiMessageSchema),
  context: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AIMessage = z.infer<typeof aiMessageSchema>;
export type AISession = z.infer<typeof aiSessionSchema>;
