import { z } from "zod";

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(), // Expecting ISO string from frontend
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

export type UpdateUserBody = z.infer<typeof updateUserSchema>;
