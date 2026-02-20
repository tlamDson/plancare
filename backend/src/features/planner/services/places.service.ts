import axios from "axios";
import { env } from "../../../config/env";
import { logger } from "../../../lib/logger";

export interface PlaceDetails {
  placeId: string;
  name: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  isOpen?: boolean;
  photoUrl?: string; // resolved CDN URL (no API key)
  openingHours?: string;
  categories?: string[];
  location?: {
    lat: number;
    lng: number;
  };
}

export class PlacesService {
  /**
   * Resolve a Google Places photo_reference to a public CDN URL.
   * Follows the redirect from the photo endpoint → gets the final
   * lh3.googleusercontent.com URL which doesn't expose the API key.
   */
  private async resolvePhotoUrl(
    photoReference: string,
  ): Promise<string | undefined> {
    if (!env.GOOGLE_PLACES_API_KEY) return undefined;
    try {
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/place/photo",
        {
          params: {
            maxwidth: 600,
            photo_reference: photoReference,
            key: env.GOOGLE_PLACES_API_KEY,
          },
          // Follow redirects but capture the final URL
          maxRedirects: 5,
          timeout: 5000,
        },
      );
      // After following redirects, the final URL is the CDN URL
      const finalUrl =
        response.request?.res?.responseUrl ?? response.request?.responseURL;
      if (typeof finalUrl === "string" && finalUrl.startsWith("http")) {
        return finalUrl;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Text Search using classic Places API (maps.googleapis.com).
   * Accepts descriptive queries → returns real venues with coordinates, rating, photos.
   */
  async searchByText(query: string): Promise<PlaceDetails | null> {
    if (!env.GOOGLE_PLACES_API_KEY) {
      logger.warn(
        "Google Places API key not configured — skipping Text Search",
      );
      return null;
    }

    try {
      logger.debug({ query }, "📍 [PLACES] Calling Google Places Text Search");

      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/place/textsearch/json",
        {
          params: { query, key: env.GOOGLE_PLACES_API_KEY },
          timeout: 6000,
        },
      );

      const responseBody = response.data;
      const status: string = responseBody?.status;
      const results = responseBody?.results;

      logger.info(
        { query, status, resultCount: results?.length ?? 0 },
        "📍 [PLACES] Text Search response",
      );

      if (status !== "OK" && status !== "ZERO_RESULTS") {
        logger.error(
          { query, status, errorMessage: responseBody?.error_message },
          "📍 [PLACES] Text Search non-OK status — check API key restrictions",
        );
        return null;
      }

      const result = results?.[0];
      if (!result) {
        logger.debug({ query }, "📍 [PLACES] No results found");
        return null;
      }

      logger.info(
        {
          query,
          name: result.name,
          lat: result.geometry?.location?.lat,
          lng: result.geometry?.location?.lng,
          rating: result.rating,
        },
        "📍 [PLACES] Text Search matched place",
      );

      const details: PlaceDetails = {
        placeId: result.place_id,
        name: result.name,
      };

      if (result.rating !== undefined) details.rating = result.rating;
      if (result.user_ratings_total !== undefined)
        details.reviewCount = result.user_ratings_total;
      if (result.price_level !== undefined)
        details.priceLevel = result.price_level;
      if (result.opening_hours?.open_now !== undefined)
        details.isOpen = result.opening_hours.open_now;
      if (result.types) details.categories = result.types;
      if (result.geometry?.location) {
        details.location = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        };
      }

      // Resolve photo: follow redirect to get CDN URL (no API key exposed)
      if (result.photos?.[0]?.photo_reference) {
        const cdnUrl = await this.resolvePhotoUrl(
          result.photos[0].photo_reference,
        );
        if (cdnUrl) {
          details.photoUrl = cdnUrl;
          logger.debug(
            { name: result.name },
            "📍 [PLACES] Photo CDN URL resolved",
          );
        }
      }

      return details;
    } catch (error: any) {
      logger.error(
        {
          query,
          status: error.response?.status,
          statusText: error.response?.statusText,
          error: error.message,
        },
        "📍 [PLACES] Text Search HTTP error",
      );
      return null;
    }
  }

  /**
   * Get full place details (opening hours) via Place Details API.
   */
  async getPlaceDetails(
    placeId: string,
  ): Promise<{ openingHours?: string; photoUrl?: string } | null> {
    if (!env.GOOGLE_PLACES_API_KEY) return null;

    try {
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/place/details/json",
        {
          params: {
            place_id: placeId,
            fields: "opening_hours,photos",
            key: env.GOOGLE_PLACES_API_KEY,
          },
          timeout: 5000,
        },
      );

      const place = response.data?.result;
      if (!place) return null;

      const result: { openingHours?: string; photoUrl?: string } = {};

      if (place.opening_hours?.weekday_text) {
        const todayHours = this.getTodayHours(place.opening_hours.weekday_text);
        if (todayHours) result.openingHours = todayHours;
      }

      // Resolve photo CDN URL (no API key exposed)
      if (place.photos?.[0]?.photo_reference) {
        const cdnUrl = await this.resolvePhotoUrl(
          place.photos[0].photo_reference,
        );
        if (cdnUrl) result.photoUrl = cdnUrl;
      }

      return result;
    } catch {
      return null;
    }
  }

  private getTodayHours(weekdayText: string[]): string | undefined {
    if (!weekdayText || weekdayText.length === 0) return undefined;
    const dayJs = new Date().getDay();
    const googleIdx = dayJs === 0 ? 6 : dayJs - 1;
    const entry = weekdayText[googleIdx];
    if (!entry) return undefined;
    const colonIdx = entry.indexOf(":");
    return colonIdx !== -1 ? entry.slice(colonIdx + 1).trim() : entry;
  }

  /** Legacy — kept for circuit breaker compatibility */
  async verifyPlace(
    _lat: number,
    _lng: number,
    _radius = 100,
  ): Promise<PlaceDetails | null> {
    return null;
  }
}

export const placesService = new PlacesService();
