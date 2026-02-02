import { z } from "zod";
export declare const TripPreferencesSchema: z.ZodObject<{
    destination: z.ZodString;
    startDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    endDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    budget: z.ZodObject<{
        total: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
    travelers: z.ZodDefault<z.ZodObject<{
        adults: z.ZodDefault<z.ZodNumber>;
        children: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    vibe: z.ZodOptional<z.ZodEnum<{
        adventure: "adventure";
        relaxation: "relaxation";
        culture: "culture";
        food: "food";
        nightlife: "nightlife";
        nature: "nature";
    }>>;
    energyLevel: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>>;
    pacePreference: z.ZodOptional<z.ZodEnum<{
        slow: "slow";
        moderate: "moderate";
        fast: "fast";
    }>>;
    interests: z.ZodOptional<z.ZodArray<z.ZodString>>;
    accommodationType: z.ZodOptional<z.ZodEnum<{
        any: "any";
        hotel: "hotel";
        hostel: "hostel";
        airbnb: "airbnb";
        resort: "resort";
    }>>;
    mealPreferences: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type TripPreferences = z.infer<typeof TripPreferencesSchema>;
//# sourceMappingURL=trip.schema.d.ts.map