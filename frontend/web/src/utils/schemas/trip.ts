import { TripPreferencesSchema, TripStatusValues } from "@travelplan/shared";
import { z } from "zod";
import { geoPointSchema } from "./common";

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
  // Rich place data from validation pipeline
  rating: z.number().optional(),
  priceLevel: z.number().optional(),
  photoUrl: z.string().optional(),
  openingHours: z.string().optional(),
  // Distance validation — set by geo-validator when activity is too far for chosen transport
  requiresTransport: z.boolean().optional(),
  distanceFromPrevious: z.number().optional(),
  // Nearby food/snack suggestions cached from Google Places Nearby Search
  nearbySuggestions: z
    .array(
      z.object({
        name: z.string(),
        placeId: z.string(),
        distanceKm: z.number(),
        priceLevel: z.number().optional(),
        photoUrl: z.string().optional(),
      }),
    )
    .optional(),
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
  purpose: z
    .enum(["leisure", "business", "bleisure", "family_visit", "event"])
    .optional(),
  groupType: z
    .enum(["solo", "couple", "family_kids", "friends", "work"])
    .optional(),
  priorities: z
    .object({
      money: z.number().min(1).max(10),
      comfort: z.number().min(1).max(10),
      unique: z.number().min(1).max(10),
    })
    .optional(),
  mood: z
    .enum(["city_break", "beach", "hiking", "foodie", "romantic", "adventure"])
    .optional(),
  dealBreakers: z.array(z.string()).optional(),
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
