import { z } from "zod";

export const TripPreferencesSchema = z.object({
  destination: z.string().min(2, "Destination must be at least 2 characters"),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  budget: z.object({
    total: z.number().min(1, "Budget must be positive"),
    currency: z.string().default("USD"),
  }),
  travelers: z
    .object({
      adults: z.number().min(1).default(1),
      children: z.number().min(0).default(0),
    })
    .default({ adults: 1, children: 0 }),
  vibe: z
    .enum(["adventure", "relaxation", "culture", "food", "nightlife", "nature"])
    .optional(),
  energyLevel: z.enum(["low", "medium", "high"]).optional(),
  pacePreference: z.enum(["slow", "moderate", "fast"]).optional(),
  interests: z.array(z.string()).optional(),
  accommodationType: z
    .enum(["hotel", "hostel", "airbnb", "resort", "any"])
    .optional(),
  mealPreferences: z.array(z.string()).optional(),
});

export type TripPreferences = z.infer<typeof TripPreferencesSchema>;
