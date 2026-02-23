import type { Activity } from "@/utils/schemas";

/**
 * Builds a Google Maps search URL from an activity.
 *
 * 1. Prioritizes Google Place ID (Best: shows reviews, photos, full name).
 * 2. Fallback to Search Query with Name + Coordinates (Good: pin with name).
 * 3. Final Fallback to Name search.
 */
export function getGoogleMapsUrl(activity: Activity): string {
  const nameQuery = encodeURIComponent(activity.name);

  // 1. Full Place Card view via Place ID
  if (activity.location?.googlePlaceId) {
    return `https://www.google.com/maps/search/?api=1&query=${nameQuery}&query_place_id=${activity.location.googlePlaceId}`;
  }

  // 2. Named pin via coordinates
  if (activity.location?.coordinates) {
    const [lng, lat] = activity.location.coordinates;
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  // 3. Fallback text search
  return `https://www.google.com/maps/search/?api=1&query=${nameQuery}`;
}
