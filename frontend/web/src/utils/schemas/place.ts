import { z } from "zod";
import { geoPointSchema } from "./common";

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
