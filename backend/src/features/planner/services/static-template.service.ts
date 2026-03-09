import { IItineraryDay } from "../models/Trip.types";
import { STATIC_TEMPLATES } from "../data/static-templates";

export function getStaticTemplate(destination: string): IItineraryDay[] | null {
  const city = destination.split(",")[0]?.toLowerCase().trim() ?? "";
  const key = Object.keys(STATIC_TEMPLATES).find(
    (k) => city.includes(k) || k.includes(city),
  );
  return key ? STATIC_TEMPLATES[key] || null : null;
}
