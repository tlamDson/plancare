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
  photoUrl?: string; // resolved CDN URL (no API key exposed)
  openingHours?: string; // today's hours text (legacy)
  openingHoursArray?: string[]; // full week descriptions from Google v1
  categories?: string[];
  location?: {
    lat: number;
    lng: number;
  };
}

// ─── Field mask: request ONLY the fields we need (cost optimization) ──────
// Billing is based on the highest-tier field requested.
// places.id, places.displayName, places.location, places.types → Basic (free-ish)
// places.rating, places.userRatingCount, places.priceLevel   → Basic
// places.currentOpeningHours                                   → Advanced
// places.photos                                                → Basic
const TEXT_SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.currentOpeningHours",
  "places.photos",
  "places.types",
].join(",");

const BROAD_PLACE_TYPES = new Set([
  "locality",
  "sublocality",
  "sublocality_level_1",
  "sublocality_level_2",
  "administrative_area_level_1",
  "administrative_area_level_2",
  "administrative_area_level_3",
  "country",
  "postal_code",
  "postal_code_suffix",
  "political",
  "route",
  "street_address",
  "premise",
  "neighborhood",
  "colloquial_area",
  "intersection",
]);

export class PlacesService {
  private readonly v1Base = "https://places.googleapis.com/v1";

  /**
   * Resolve a v1 photo resource name to a public CDN URL.
   * Uses skipHttpRedirect=true → returns JSON { photoUri: "https://lh3.googleusercontent.com/..." }
   * This way the API key is NEVER sent to the frontend.
   */
  private async resolvePhotoUrl(
    photoResourceName: string,
    maxWidthPx = 1200,
  ): Promise<string | undefined> {
    if (!env.GOOGLE_PLACES_API_KEY) return undefined;
    try {
      const res = await axios.get(`${this.v1Base}/${photoResourceName}/media`, {
        params: {
          maxWidthPx,
          skipHttpRedirect: true,
          key: env.GOOGLE_PLACES_API_KEY,
        },
        timeout: 5000,
      });
      const uri = res.data?.photoUri;
      return typeof uri === "string" ? uri : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Pick the best photo candidates (largest first, prefer landscape).
   */
  private getPhotoCandidates(
    photos: Array<{
      name?: string;
      widthPx?: number;
      heightPx?: number;
    }>,
  ) {
    const withMeta = photos.map((photo, index) => {
      const width = photo.widthPx ?? 0;
      const height = photo.heightPx ?? 0;
      const area = width * height;
      const aspect = height > 0 ? width / height : undefined;
      return { ...photo, index, area, aspect };
    });

    const landscape = withMeta.filter(
      (photo) => photo.aspect === undefined || photo.aspect >= 1.1,
    );

    const ranked = (landscape.length > 0 ? landscape : withMeta).sort(
      (a, b) => b.area - a.area || a.index - b.index,
    );

    return ranked;
  }

  /**
   * Resolve the best available photo URL with minimal retries.
   */
  private async resolveBestPhotoUrl(
    photos: Array<{
      name?: string;
      widthPx?: number;
      heightPx?: number;
    }>,
  ): Promise<string | undefined> {
    const candidates = this.getPhotoCandidates(photos).slice(0, 3);

    for (const candidate of candidates) {
      if (!candidate.name) continue;

      const hiRes = await this.resolvePhotoUrl(candidate.name, 1200);
      if (hiRes) return hiRes;

      const midRes = await this.resolvePhotoUrl(candidate.name, 800);
      if (midRes) return midRes;
    }

    return undefined;
  }

  private isBroadPlace(types?: string[]): boolean {
    if (!types || types.length === 0) return false;
    return types.some((type) => BROAD_PLACE_TYPES.has(type));
  }

  /**
   * PRIMARY: Text Search via Places API v1 (POST).
   * Single-call hydration: returns name, coords, rating, photos, hours in one request.
   * Field masking minimizes billing tier.
   */
  async searchByText(query: string): Promise<PlaceDetails | null> {
    if (!env.GOOGLE_PLACES_API_KEY) {
      logger.warn(
        "Google Places API key not configured — skipping Text Search",
      );
      return null;
    }

    try {
      logger.info({ query }, "📍 [PLACES v1] Calling searchText");

      const response = await axios.post(
        `${this.v1Base}/places:searchText`,
        { textQuery: query },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": TEXT_SEARCH_FIELD_MASK,
          },
          timeout: 6000,
        },
      );

      const places = response.data?.places;

      if (!places || places.length === 0) {
        logger.debug({ query }, "📍 [PLACES v1] No results found");
        return null;
      }

      const place =
        places.find((candidate: any) => !this.isBroadPlace(candidate.types)) ??
        places[0];

      if (!place || this.isBroadPlace(place.types)) {
        logger.info(
          {
            query,
            topTypes: place?.types ?? [],
            topName: place?.displayName?.text,
          },
          "📍 [PLACES v1] Broad location match ignored",
        );
        return null;
      }

      // v1 uses displayName.text instead of name
      const name = place.displayName?.text || "Unknown Place";

      logger.info(
        {
          query,
          name,
          lat: place.location?.latitude,
          lng: place.location?.longitude,
          rating: place.rating,
          photoCount: place.photos?.length ?? 0,
          hasHours: !!place.currentOpeningHours,
        },
        "📍 [PLACES v1] Text Search matched place",
      );

      const details: PlaceDetails = {
        placeId: place.id,
        name,
      };

      if (place.rating !== undefined) details.rating = place.rating;
      if (place.userRatingCount !== undefined)
        details.reviewCount = place.userRatingCount;

      // v1 priceLevel is an enum string: "PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE", etc.
      if (place.priceLevel) {
        const match = place.priceLevel.match(/PRICE_LEVEL_(\w+)/);
        if (match) {
          const levelMap: Record<string, number> = {
            FREE: 0,
            INEXPENSIVE: 1,
            MODERATE: 2,
            EXPENSIVE: 3,
            VERY_EXPENSIVE: 4,
          };
          const level = levelMap[match[1]];
          if (level !== undefined) details.priceLevel = level;
        }
      }

      if (place.types) details.categories = place.types;

      if (place.location) {
        details.location = {
          lat: place.location.latitude,
          lng: place.location.longitude,
        };
      }

      // Opening hours — full array passed to processor for date-matching
      if (place.currentOpeningHours) {
        if (place.currentOpeningHours.openNow !== undefined) {
          details.isOpen = place.currentOpeningHours.openNow;
        }
        if (place.currentOpeningHours.weekdayDescriptions) {
          details.openingHoursArray =
            place.currentOpeningHours.weekdayDescriptions;
        }
      }

      // Photo — resolve resource name to CDN URL (no API key in URL)
      if (place.photos && place.photos.length > 0) {
        const cdnUrl = await this.resolveBestPhotoUrl(place.photos);
        if (cdnUrl) {
          details.photoUrl = cdnUrl;
          logger.debug({ name }, "📍 [PLACES v1] Photo CDN URL resolved");
        }
      }

      return details;
    } catch (error: any) {
      logger.error(
        {
          query,
          status: error.response?.status,
          statusText: error.response?.statusText,
          errorBody: error.response?.data?.error?.message,
          error: error.message,
        },
        "📍 [PLACES v1] Text Search failed",
      );
      return null;
    }
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
