import CircuitBreaker from "opossum";
import { logger } from "../../../lib/logger";
import { geocodingService } from "../services/geocoding.service";
import { placesService } from "../services/places.service";

const options: CircuitBreaker.Options = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
};

export const mapboxBreaker = new CircuitBreaker(
  async (query: string) => geocodingService.getCoordinates(query),
  options,
);

// Legacy verifyPlace breaker (kept for compatibility)
export const placesBreaker = new CircuitBreaker(
  async (lat: number, lng: number, radius?: number) =>
    placesService.verifyPlace(lat, lng, radius),
  options,
);

// Primary text-search breaker used in validation.service.ts
// Opens after 3 consecutive failures, resets after 30s
export const placesTextBreaker = new CircuitBreaker(
  async (query: string) => placesService.searchByText(query),
  {
    timeout: 7000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    volumeThreshold: 3,
  },
);

mapboxBreaker.on("open", () => {
  logger.error("Mapbox circuit breaker opened");
});
mapboxBreaker.on("halfOpen", () => {
  logger.info("Mapbox circuit breaker half-open, testing...");
});
mapboxBreaker.on("close", () => {
  logger.info("Mapbox circuit breaker closed");
});

placesBreaker.on("open", () => {
  logger.error("Google Places (verify) circuit breaker opened");
});
placesBreaker.on("halfOpen", () => {
  logger.info("Google Places (verify) circuit breaker half-open, testing...");
});
placesBreaker.on("close", () => {
  logger.info("Google Places (verify) circuit breaker closed");
});

placesTextBreaker.on("open", () => {
  logger.error(
    "⚡ Google Places Text Search circuit breaker OPEN — falling back to cache/Mapbox",
  );
});
placesTextBreaker.on("halfOpen", () => {
  logger.info("Google Places Text Search circuit breaker half-open, testing...");
});
placesTextBreaker.on("close", () => {
  logger.info("Google Places Text Search circuit breaker closed — resuming normal flow");
});
