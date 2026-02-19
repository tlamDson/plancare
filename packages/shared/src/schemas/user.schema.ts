import { z } from "zod";

export const UserTravelDNASchema = z.object({
  travelFrequency: z
    .enum(["rarely", "1-2_trips", "3-5_trips", "6+_trips"])
    .optional(),
  archetype: z
    .enum(["backpacker", "luxury", "digital_nomad", "family", "adventure"])
    .optional(),
  pacing: z.enum(["relaxed", "balanced", "packed"]).optional(),
  constraints: z
    .object({
      accessibility: z.array(z.string()).optional(),
      dietary: z.array(z.string()).optional(),
      avoidances: z.array(z.string()).optional(),
    })
    .optional(),
});

export type UserTravelDNA = z.infer<typeof UserTravelDNASchema>;
