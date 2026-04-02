import { z } from "zod";

export const destinationCityApiSchema = z.object({
  idKey: z.string(),
  name: z.string(),
  nameEn: z.string(),
  timezone: z.string(),
  hasRagInsight: z.boolean(),
});

export const destinationCountryApiSchema = z.object({
  idKey: z.string(),
  name: z.string(),
  nameEn: z.string(),
  flagEmoji: z.string().optional(),
  isSupported: z.boolean(),
  cities: z.array(destinationCityApiSchema).min(1),
});

export const destinationsListResponseSchema = z.object({
  success: z.literal(true),
  countries: z.array(destinationCountryApiSchema),
});

export type DestinationCityApi = z.infer<typeof destinationCityApiSchema>;
export type DestinationCountryApi = z.infer<typeof destinationCountryApiSchema>;
