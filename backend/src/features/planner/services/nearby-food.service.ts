/**
 * NearbyFoodService
 *
 * For each activity anchor (a tourist attraction), finds nearby food & snack
 * places using Google Places Nearby Search. Results are cached in PlaceCache
 * so repeated calls (regenerate) cost 0 API calls.
 *
 * Cache TTL: 60 days (handled by MongoDB TTL index on PlaceCache.expiresAt)
 */
import axios from "axios";
import { env } from "../../../config/env";
import { logger } from "../../../lib/logger";
import PlaceCache from "../models/PlaceCache";
import { resolveBestPhotoUrl } from "./place-photo.service";
import type { TransportMode } from "./geo-validator.service";

export interface NearbyFoodResult {
  name: string;
  placeId: string;
  distanceKm: number;
  priceLevel?: number;
  photoUrl?: string;
}

// Search radius in metres. Walking mode = tight radius, car = wider
const SEARCH_RADIUS_M: Record<TransportMode, number> = {
  walking: 500,
  public_transport: 800,
  car: 1000,
};

export class NearbyFoodService {
  /**
   * Returns up to 3 nearby food/snack suggestions for an activity anchor.
   *
   * Flow:
   *  1. Check PlaceCache by googlePlaceId → if nearbyFood cached, return immediately
   *  2. Call Google Places Nearby Search
   *  3. Store results in PlaceCache.nearbyFood
   *  4. Return top 3
   */
  async getNearbyFood(
    anchor: {
      googlePlaceId?: string;
      coordinates: [number, number];
      name: string;
    },
    mode: TransportMode = "walking",
  ): Promise<NearbyFoodResult[]> {
    if (!env.GOOGLE_PLACES_API_KEY) {
      logger.debug(
        "NearbyFood: Google Places API key not configured, skipping",
      );
      return [];
    }

    // 1. Cache check — look up by googlePlaceId
    if (anchor.googlePlaceId) {
      const cached = await PlaceCache.findOne({
        googlePlaceId: anchor.googlePlaceId,
      });
      if (cached?.nearbyFood && cached.nearbyFood.length > 0) {
        logger.debug(
          { anchor: anchor.name },
          "🍜 [NearbyFood] Cache hit – returning stored suggestions",
        );
        return cached.nearbyFood as NearbyFoodResult[];
      }
    }

    // 2. Call Google Places Nearby Search
    const [lng, lat] = anchor.coordinates;
    const radius = SEARCH_RADIUS_M[mode];

    try {
      logger.info(
        { anchor: anchor.name, radius, mode },
        "🍜 [NearbyFood] Calling Nearby Search API",
      );

      const response = await axios.post(
        "https://places.googleapis.com/v1/places:searchNearby",
        {
          includedTypes: [
            "restaurant",
            "cafe",
            "bakery",
            "food",
            "meal_takeaway",
          ],
          maxResultCount: 10,
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius,
            },
          },
          rankPreference: "DISTANCE",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.priceLevel,places.rating,places.photos,places.location",
          },
          timeout: 6000,
        },
      );

      const places = (response.data?.places ?? []).slice(0, 5);
      if (places.length === 0) return [];

      const results: NearbyFoodResult[] = await Promise.all(
        places.map(async (p: any) => {
          const pLat = p.location?.latitude ?? lat;
          const pLng = p.location?.longitude ?? lng;
          const dLat = ((pLat - lat) * Math.PI) / 180;
          const dLng = ((pLng - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((pLat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          const distanceKm =
            Math.round(
              6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10,
            ) / 10;

          let priceLevel: number | undefined;
          if (p.priceLevel) {
            const levelMap: Record<string, number> = {
              PRICE_LEVEL_FREE: 0,
              PRICE_LEVEL_INEXPENSIVE: 1,
              PRICE_LEVEL_MODERATE: 2,
              PRICE_LEVEL_EXPENSIVE: 3,
              PRICE_LEVEL_VERY_EXPENSIVE: 4,
            };
            priceLevel = levelMap[p.priceLevel];
          }

          let photoUrl: string | undefined;
          if (p.photos?.length) {
            const resolved = await resolveBestPhotoUrl(p.photos).catch(
              () => undefined,
            );
            if (resolved) photoUrl = resolved;
          }

          return {
            name: p.displayName?.text ?? "Unknown",
            placeId: p.id,
            distanceKm,
            priceLevel,
            photoUrl,
          };
        }),
      );

      // 3. Cache results on the anchor's PlaceCache document
      if (anchor.googlePlaceId) {
        await PlaceCache.findOneAndUpdate(
          { googlePlaceId: anchor.googlePlaceId },
          { $set: { nearbyFood: results } },
          { new: false }, // don't need the updated doc
        );
      }

      logger.debug(
        { anchor: anchor.name, count: results.length },
        "🍜 [NearbyFood] Cached results",
      );
      return results.slice(0, 3); // surface top 3 to the itinerary
    } catch (error: any) {
      logger.warn(
        { anchor: anchor.name, error: error.message },
        "🍜 [NearbyFood] Nearby Search failed — returning empty",
      );
      return [];
    }
  }
}

export const nearbyFoodService = new NearbyFoodService();
