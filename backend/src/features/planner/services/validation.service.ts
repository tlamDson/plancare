import { placeCacheRepository } from "../repositories/place-cache.repository";
import { mapboxBreaker } from "../tools/circuit-breaker";
import { placesService } from "./places.service";
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
  photoUrl?: string;
  openingHours?: string;
}

const BROAD_MAPBOX_TYPES = new Set(["place", "region", "country"]);

export class ValidationService {
  private isBroadCachedPlace(place: any): boolean {
    const type = place?.placeType?.toLowerCase?.() ?? "";
    if (BROAD_MAPBOX_TYPES.has(type)) return true;

    const name = place?.placeName?.toLowerCase?.() ?? "";
    if (place?.source === "mapbox" && name.includes("united states"))
      return true;

    return false;
  }

  async validateIntent(intent: string): Promise<ValidatedPlace | null> {
    try {
      // 1. Cache check
      const cached = await placeCacheRepository.findByQuery(intent);
      if (cached) {
        if (this.isBroadCachedPlace(cached)) {
          logger.info(
            { intent, placeName: cached.placeName, placeType: cached.placeType },
            "Validation: Ignoring broad cached location",
          );
        } else {
        logger.debug({ intent }, "Validation: Cache hit");
        const result: ValidatedPlace = {
          name: cached.placeName,
          coordinates: cached.coordinates.coordinates as [number, number],
          confidence: cached.confidence,
          source: "cache",
        };
        if (cached.rating !== undefined) result.rating = cached.rating;
        if (cached.reviewCount !== undefined)
          result.reviewCount = cached.reviewCount;
        if (cached.priceLevel !== undefined)
          result.priceLevel = cached.priceLevel;
        if (cached.googlePlaceId) result.googlePlaceId = cached.googlePlaceId;
        if (cached.categories) result.categories = cached.categories;
        return result;
        }
      }

      // 2. PRIMARY: Google Places Text Search
      //    v1 single-call hydration: returns name, coords, rating, photos, hours in one request.
      logger.info(
        { intent },
        "Validation: Querying Google Places v1 Text Search",
      );
      const place = await placesService.searchByText(intent);

      if (place && place.location) {
        const [lat, lng] = [place.location.lat, place.location.lng];

        const result: ValidatedPlace = {
          name: place.name,
          coordinates: [lng, lat],
          googlePlaceId: place.placeId,
          confidence: 0.95,
          source: "google",
        };
        if (place.rating !== undefined) result.rating = place.rating;
        if (place.reviewCount !== undefined)
          result.reviewCount = place.reviewCount;
        if (place.priceLevel !== undefined)
          result.priceLevel = place.priceLevel;
        if (place.categories) result.categories = place.categories;
        if (place.photoUrl) result.photoUrl = place.photoUrl;
        if (place.openingHours) result.openingHours = place.openingHours;

        // Cache the result
        const cacheData: any = {
          query: intent,
          coordinates: { type: "Point", coordinates: [lng, lat] },
          placeName: place.name,
          placeType: place.categories?.[0] ?? "poi",
          confidence: 0.95,
          googlePlaceId: place.placeId,
          source: "google",
          isVerified: true,
        };
        if (place.rating !== undefined) cacheData.rating = place.rating;
        if (place.reviewCount !== undefined)
          cacheData.reviewCount = place.reviewCount;
        if (place.priceLevel !== undefined)
          cacheData.priceLevel = place.priceLevel;
        if (place.categories) cacheData.categories = place.categories;

        await placeCacheRepository.create(cacheData);

        logger.debug(
          { intent, name: place.name, lat, lng, rating: place.rating },
          "Validation: Google Places match found",
        );
        return result;
      }

      // 3. FALLBACK: Mapbox geocoding (when Google Places fails or key missing)
      logger.debug(
        { intent },
        "Validation: Google Places failed, falling back to Mapbox",
      );
      const geocode = await mapboxBreaker.fire(intent);

      if (!geocode) {
        logger.debug({ intent }, "Validation: Mapbox returned no results");
        return null;
      }

      if (BROAD_MAPBOX_TYPES.has(geocode.placeType)) {
        logger.info(
          { intent, placeName: geocode.placeName, placeType: geocode.placeType },
          "Validation: Ignoring broad Mapbox location",
        );
        return null;
      }

      const [lng, lat] = geocode.coordinates;

      const mapboxResult: ValidatedPlace = {
        name: geocode.placeName,
        coordinates: [lng, lat],
        confidence: geocode.confidence,
        source: "mapbox",
      };

      await placeCacheRepository.create({
        query: intent,
        coordinates: { type: "Point", coordinates: [lng, lat] },
        placeName: geocode.placeName,
        placeType: geocode.placeType,
        confidence: geocode.confidence,
        source: "mapbox",
        isVerified: true,
      });

      return mapboxResult;
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
