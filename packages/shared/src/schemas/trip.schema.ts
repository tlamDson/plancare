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
  // ─── New Step 5 fields ─────────────────────────────────────────────────
  /** Travel pace — maps to PACE_CONFIG on backend */
  pace: z
    .enum(["relaxed", "balanced", "packed"])
    .optional()
    .default("balanced"),
  /** Main focus areas — replaces interests (max 3) */
  focus: z
    .array(z.enum(["Culture", "Nature", "Gastronomy", "Lifestyle"]))
    .max(3)
    .optional()
    .default([]),
  /** Structured constraint flags */
  constraints: z
    .object({
      mobility_friendly: z.boolean().default(false),
      avoid_crowds: z.boolean().default(false),
      start_late: z.boolean().default(false),
      indoor_only: z.boolean().default(false),
      no_street_food: z.boolean().default(false),
      no_late_nights: z.boolean().default(false),
      /** When true + Gastronomy focus: restaurants/cafés as main activities (not just nearby suggestions) */
      foodAsMainActivities: z.boolean().default(false),
    })
    .optional()
    .default(() => ({
      mobility_friendly: false,
      avoid_crowds: false,
      start_late: false,
      indoor_only: false,
      no_street_food: false,
      no_late_nights: false,
      foodAsMainActivities: false,
    })),
  /** Free-text special requirements (diet, accessibility, etc.) */
  specialRequirements: z.string().max(200).optional(),
  /** User opted-in meals to intertwine with activities */
  includedMeals: z
    .array(z.enum(["breakfast", "lunch", "dinner"]))
    .optional()
    .default([]),

  // ─── Deprecated — kept for backward compat with existing DB trips ───────
  /** @deprecated Use focus[] instead */
  mood: z
    .enum(["city_break", "beach", "hiking", "foodie", "romantic", "adventure"])
    .optional(),
  /** @deprecated Use focus[] instead */
  interests: z.array(z.string()).optional(),
  /** @deprecated Use constraints instead */
  dealBreakers: z.array(z.string()).optional(),
  transportMode: z
    .enum(["walking", "public_transport", "car"])
    .optional()
    .default("walking"),
  activitiesPerDay: z.number().min(2).max(8).optional().default(3),
  /** Accommodation preference — used to calculate hotel cost multiplier */
  accommodationType: z
    .enum(["hostel", "airbnb", "hotel", "resort", "any"])
    .optional()
    .default("any"),
  // ─── Destination idKeys — sent by frontend when user selects from dropdown ─
  /** Country DB idKey — enables precise RAG lookup without string parsing */
  countryIdKey: z.string().optional(),
  /** City DB idKey — enables precise RAG lookup without string parsing */
  cityIdKey: z.string().optional(),
});

export type TripPreferences = z.infer<typeof TripPreferencesSchema>;
