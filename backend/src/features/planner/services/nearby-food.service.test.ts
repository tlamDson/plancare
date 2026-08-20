import { describe, it, expect, vi, beforeEach } from "vitest";

const findByGooglePlaceId = vi.fn();
const updateNearbyFood = vi.fn();

vi.mock("../repositories/place-cache.repository", () => ({
  placeCacheRepository: {
    findByGooglePlaceId: (...args: unknown[]) => findByGooglePlaceId(...args),
    updateNearbyFood: (...args: unknown[]) => updateNearbyFood(...args),
  },
}));

vi.mock("./place-photo.service", () => ({
  resolveBestPhotoUrl: vi.fn().mockResolvedValue(undefined),
}));

const axiosPost = vi.fn();
vi.mock("axios", () => ({
  default: { post: (...args: unknown[]) => axiosPost(...args) },
}));

vi.mock("../../../config/env", () => ({
  env: { GOOGLE_PLACES_API_KEY: "test-key", NODE_ENV: "test" },
  appEnv: "test",
}));

import { nearbyFoodService } from "./nearby-food.service";

const ANCHOR = {
  googlePlaceId: "anchor-1",
  coordinates: [105.85, 21.03] as [number, number],
  name: "Old Quarter",
};

beforeEach(() => {
  findByGooglePlaceId.mockReset().mockResolvedValue(null);
  updateNearbyFood.mockReset().mockResolvedValue(undefined);
  axiosPost.mockReset().mockResolvedValue({
    data: {
      places: [
        {
          id: "food-1",
          displayName: { text: "Pho Place" },
          location: { latitude: 21.031, longitude: 105.851 },
          priceLevel: "PRICE_LEVEL_INEXPENSIVE",
        },
      ],
    },
  });
});

describe("nearbyFoodService.getNearbyFood — cache access goes through the repository", () => {
  it("looks up the cache via placeCacheRepository.findByGooglePlaceId, not a raw Mongoose query", async () => {
    await nearbyFoodService.getNearbyFood(ANCHOR);

    expect(findByGooglePlaceId).toHaveBeenCalledWith("anchor-1");
  });

  it("returns cached nearbyFood without calling the Nearby Search API", async () => {
    findByGooglePlaceId.mockResolvedValue({
      nearbyFood: [
        { name: "Cached Cafe", placeId: "cached-1", distanceKm: 0.2 },
      ],
    });

    const result = await nearbyFoodService.getNearbyFood(ANCHOR);

    expect(result).toEqual([
      { name: "Cached Cafe", placeId: "cached-1", distanceKm: 0.2 },
    ]);
    expect(axiosPost).not.toHaveBeenCalled();
  });

  it("writes fresh results via placeCacheRepository.updateNearbyFood, not a raw Mongoose write", async () => {
    await nearbyFoodService.getNearbyFood(ANCHOR);

    expect(updateNearbyFood).toHaveBeenCalledTimes(1);
    const [googlePlaceId, results] = updateNearbyFood.mock.calls[0] ?? [];
    expect(googlePlaceId).toBe("anchor-1");
    expect(results).toEqual([
      expect.objectContaining({ name: "Pho Place", placeId: "food-1" }),
    ]);
  });
});
