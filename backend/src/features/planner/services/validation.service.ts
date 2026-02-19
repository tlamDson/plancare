import { placeCacheRepository } from "../repositories/place-cache.repository";
import { mapboxBreaker, placesBreaker } from "../tools/circuit-breaker";
import { logger } from "../../../lib/logger";

export interface ValidatedPlace {
  name: string;
  coordinates: [number, number]; // [lng, lat]
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  googlePlaceId?: string;
  confidence: number;
  source: "cache" | "mapbox" | "google" | "both";
  categories?: string[];
}

export class ValidationService {
  async validateIntent(intent: string): Promise<ValidatedPlace | null> {
    try {
      const cached = await placeCacheRepository.findByQuery(intent);
      if (cached) {
        logger.debug({ intent }, "Validation: Cache hit");
        const result: ValidatedPlace = {
          name: cached.placeName,
          coordinates: cached.coordinates.coordinates as [number, number],
          confidence: cached.confidence,
          source: "cache",
        };

        if (cached.rating !== undefined) result.rating = cached.rating;
        if (cached.reviewCount !== undefined) result.reviewCount = cached.reviewCount;
        if (cached.priceLevel !== undefined) result.priceLevel = cached.priceLevel;
        if (cached.googlePlaceId) result.googlePlaceId = cached.googlePlaceId;
        if (cached.categories) result.categories = cached.categories;

        return result;
      }

      logger.debug({ intent }, "Validation: Cache miss, querying Mapbox");
      const geocode = await mapboxBreaker.fire(intent);

      if (!geocode) {
        logger.debug({ intent }, "Validation: Mapbox returned no results");
        return null;
      }

      const [lng, lat] = geocode.coordinates;

      if (geocode.confidence > 0.9) {
        logger.debug({ intent, confidence: geocode.confidence }, "High confidence, using Mapbox only");

        await placeCacheRepository.create({
          query: intent,
          coordinates: {
            type: "Point",
            coordinates: [lng, lat],
          },
          placeName: geocode.placeName,
          placeType: geocode.placeType,
          confidence: geocode.confidence,
          source: "mapbox",
          isVerified: true,
        });

        return {
          name: geocode.placeName,
          coordinates: [lng, lat],
          confidence: geocode.confidence,
          source: "mapbox",
        };
      }

      logger.debug({ intent }, "Low confidence, verifying with Google Places");
      const place = await placesBreaker.fire(lat, lng, 100);

      if (!place || (place.rating && place.rating < 4.0)) {
        logger.debug({ intent, rating: place?.rating }, "Place failed quality check");
        return null;
      }

      const result: ValidatedPlace = {
        name: place.name,
        coordinates: [lng, lat],
        googlePlaceId: place.placeId,
        confidence: geocode.confidence,
        source: "both",
      };

      if (place.rating !== undefined) result.rating = place.rating;
      if (place.reviewCount !== undefined) result.reviewCount = place.reviewCount;
      if (place.priceLevel !== undefined) result.priceLevel = place.priceLevel;
      if (place.categories) result.categories = place.categories;

      const cacheData: any = {
        query: intent,
        coordinates: {
          type: "Point",
          coordinates: [lng, lat],
        },
        placeName: place.name,
        placeType: geocode.placeType,
        confidence: geocode.confidence,
        googlePlaceId: place.placeId,
        source: "both",
        isVerified: true,
      };

      if (place.rating !== undefined) cacheData.rating = place.rating;
      if (place.reviewCount !== undefined) cacheData.reviewCount = place.reviewCount;
      if (place.priceLevel !== undefined) cacheData.priceLevel = place.priceLevel;
      if (place.categories) cacheData.categories = place.categories;

      await placeCacheRepository.create(cacheData);

      return result;
    } catch (error: any) {
      logger.error({ intent, error: error.message }, "Validation failed");
      return null;
    }
  }

  async validateBatch(intents: string[]): Promise<ValidatedPlace[]> {
    logger.info({ count: intents.length }, "Validating batch of intents");

    const results = await Promise.allSettled(
      intents.map((intent) => this.validateIntent(intent)),
    );

    const validated = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r: any) => r.value);

    logger.info(
      { total: intents.length, validated: validated.length },
      "Batch validation complete",
    );

    return validated;
  }
}

export const validationService = new ValidationService();
