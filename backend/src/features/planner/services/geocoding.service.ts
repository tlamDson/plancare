import axios from "axios";
import { env } from "../../../config/env";
import { logger } from "../../../lib/logger";

export interface GeocodingResult {
  coordinates: [number, number]; // [lng, lat]
  placeName: string;
  placeType: string;
  confidence: number; // 0-1 (relevance score)
  context?: {
    region?: string;
    country?: string;
    city?: string;
  };
}

export class GeocodingService {
  private readonly baseUrl = "https://api.mapbox.com/geocoding/v5/mapbox.places";

  async getCoordinates(query: string): Promise<GeocodingResult | null> {
    if (!env.MAPBOX_ACCESS_TOKEN) {
      logger.warn("Mapbox API token not configured, skipping geocoding");
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/${encodeURIComponent(query)}.json`, {
        params: {
          access_token: env.MAPBOX_ACCESS_TOKEN,
          limit: 1,
          types: "poi,address,place",
        },
        timeout: 5000,
      });

      const feature = response.data?.features?.[0];
      if (!feature) {
        logger.debug({ query }, "Mapbox: No results found");
        return null;
      }

      const [lng, lat] = feature.center;
      const parsedContext = this.parseContext(feature.context);

      const result: GeocodingResult = {
        coordinates: [lng, lat],
        placeName: feature.place_name || feature.text,
        placeType: feature.place_type?.[0] || "unknown",
        confidence: feature.relevance || 0,
      };

      if (parsedContext && Object.keys(parsedContext).length > 0) {
        result.context = parsedContext;
      }

      return result;
    } catch (error: any) {
      if (error.response?.status === 429) {
        logger.error({ query }, "Mapbox rate limit exceeded");
      } else {
        logger.error({ query, error: error.message }, "Mapbox geocoding failed");
      }
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!env.MAPBOX_ACCESS_TOKEN) {
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/${lng},${lat}.json`, {
        params: {
          access_token: env.MAPBOX_ACCESS_TOKEN,
          types: "poi,address,place",
        },
        timeout: 5000,
      });

      return response.data?.features?.[0]?.place_name || null;
    } catch (error: any) {
      logger.error({ lat, lng, error: error.message }, "Reverse geocoding failed");
      return null;
    }
  }

  private parseContext(context?: any[]): GeocodingResult["context"] {
    if (!context) return {};

    const result: GeocodingResult["context"] = {};

    context.forEach((item) => {
      const id = item.id?.split(".")?.[0];
      if (id === "region") result.region = item.text;
      if (id === "country") result.country = item.text;
      if (id === "place") result.city = item.text;
    });

    return result;
  }
}

export const geocodingService = new GeocodingService();
