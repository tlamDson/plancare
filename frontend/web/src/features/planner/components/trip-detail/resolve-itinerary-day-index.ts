import type { ItineraryDay } from "@/utils/schemas";

/** Index of this day in `trip.itinerary` (API expects this index for reorder/regen). */
export function resolveItineraryDayIndex(
  itinerary: ItineraryDay[] | undefined,
  day: ItineraryDay,
): number {
  if (!itinerary?.length) return -1;
  const byId = day._id
    ? itinerary.findIndex((d) => d._id === day._id)
    : -1;
  if (byId >= 0) return byId;
  return itinerary.findIndex((d) => d.day === day.day);
}
