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

export const placesBreaker = new CircuitBreaker(
  async (lat: number, lng: number, radius?: number) =>
    placesService.verifyPlace(lat, lng, radius),
  options,
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
  logger.error("Google Places circuit breaker opened");
});

placesBreaker.on("halfOpen", () => {
  logger.info("Google Places circuit breaker half-open, testing...");
});

placesBreaker.on("close", () => {
  logger.info("Google Places circuit breaker closed");
});
