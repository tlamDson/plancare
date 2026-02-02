"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripPreferencesSchema = void 0;
const zod_1 = require("zod");
exports.TripPreferencesSchema = zod_1.z.object({
    destination: zod_1.z.string().min(2, "Destination must be at least 2 characters"),
    startDate: zod_1.z.string().datetime().or(zod_1.z.date()),
    endDate: zod_1.z.string().datetime().or(zod_1.z.date()),
    budget: zod_1.z.object({
        total: zod_1.z.number().min(1, "Budget must be positive"),
        currency: zod_1.z.string().default("USD"),
    }),
    travelers: zod_1.z
        .object({
        adults: zod_1.z.number().min(1).default(1),
        children: zod_1.z.number().min(0).default(0),
    })
        .default({ adults: 1, children: 0 }),
    vibe: zod_1.z
        .enum(["adventure", "relaxation", "culture", "food", "nightlife", "nature"])
        .optional(),
    energyLevel: zod_1.z.enum(["low", "medium", "high"]).optional(),
    pacePreference: zod_1.z.enum(["slow", "moderate", "fast"]).optional(),
    interests: zod_1.z.array(zod_1.z.string()).optional(),
    accommodationType: zod_1.z
        .enum(["hotel", "hostel", "airbnb", "resort", "any"])
        .optional(),
    mealPreferences: zod_1.z.array(zod_1.z.string()).optional(),
});
//# sourceMappingURL=trip.schema.js.map