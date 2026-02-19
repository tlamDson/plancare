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
  photos?: string[];
  categories?: string[];
  location?: {
    lat: number;
    lng: number;
  };
}

export class PlacesService {
  private readonly baseUrl = "https://places.googleapis.com/v1/places";

  async verifyPlace(lat: number, lng: number, radius = 100): Promise<PlaceDetails | null> {
    if (!env.GOOGLE_PLACES_API_KEY) {
      logger.warn("Google Places API key not configured");
      return null;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}:searchNearby`,
        {
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius,
            },
          },
          maxResultCount: 1,
          rankPreference: "POPULARITY",
        },
        {
          headers: {
            "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.photos,places.types,places.location",
          },
          timeout: 5000,
        },
      );

      const place = response.data?.places?.[0];
      if (!place) {
        logger.debug({ lat, lng }, "Google Places: No results");
        return null;
      }

      const details: PlaceDetails = {
        placeId: place.id,
        name: place.displayName?.text || "Unknown",
      };

      if (place.rating !== undefined) details.rating = place.rating;
      if (place.userRatingCount !== undefined) details.reviewCount = place.userRatingCount;
      const parsedPriceLevel = this.parsePriceLevel(place.priceLevel);
      if (parsedPriceLevel !== undefined) details.priceLevel = parsedPriceLevel;
      if (place.currentOpeningHours?.openNow !== undefined) {
        details.isOpen = place.currentOpeningHours.openNow;
      }
      if (place.photos) details.photos = place.photos.slice(0, 3).map((p: any) => p.name);
      if (place.types) details.categories = place.types;
      if (place.location) {
        details.location = { lat: place.location.latitude, lng: place.location.longitude };
      }

      return details;
    } catch (error: any) {
      if (error.response?.status === 429) {
        logger.error({ lat, lng }, "Google Places rate limit exceeded");
      } else {
        logger.error({ lat, lng, error: error.message }, "Google Places verification failed");
      }
      return null;
    }
  }

  async searchByCategory(
    category: string,
    coords: [number, number],
    radius: number,
  ): Promise<PlaceDetails[]> {
    if (!env.GOOGLE_PLACES_API_KEY) {
      return [];
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}:searchNearby`,
        {
          includedTypes: [category],
          locationRestriction: {
            circle: {
              center: { latitude: coords[1], longitude: coords[0] },
              radius,
            },
          },
          maxResultCount: 5,
          rankPreference: "POPULARITY",
        },
        {
          headers: {
            "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.photos,places.types,places.location",
          },
          timeout: 5000,
        },
      );

      const places = response.data?.places || [];

      return places.map((place: any) => {
        const details: PlaceDetails = {
          placeId: place.id,
          name: place.displayName?.text || "Unknown",
        };

        if (place.rating !== undefined) details.rating = place.rating;
        if (place.userRatingCount !== undefined) details.reviewCount = place.userRatingCount;
        const parsedPriceLevel = this.parsePriceLevel(place.priceLevel);
        if (parsedPriceLevel !== undefined) details.priceLevel = parsedPriceLevel;
        if (place.photos) details.photos = place.photos.slice(0, 3).map((p: any) => p.name);
        if (place.types) details.categories = place.types;
        if (place.location) {
          details.location = { lat: place.location.latitude, lng: place.location.longitude };
        }

        return details;
      });
    } catch (error: any) {
      logger.error({ category, coords, error: error.message }, "Google Places search failed");
      return [];
    }
  }

  private parsePriceLevel(priceLevel: string | undefined): number | undefined {
    if (!priceLevel || typeof priceLevel !== 'string') return undefined;
    const match = priceLevel.match(/PRICE_LEVEL_(\d)/);
    return match && match[1] ? parseInt(match[1]) : undefined;
  }
}

export const placesService = new PlacesService();
