import PlaceCache, { IPlaceCache } from "../models/PlaceCache";
import { logger } from "../../../lib/logger";

export class PlaceCacheRepository {
  async findByQuery(query: string): Promise<IPlaceCache | null> {
    const normalized = query.toLowerCase().trim();
    const cached = await PlaceCache.findOne({
      query: normalized,
      isVerified: true,
    }).exec();

    if (cached) {
      await this.incrementHitCount(cached._id.toString());
      logger.debug({ query, hitCount: cached.hitCount }, "Cache hit");
    }

    return cached;
  }

  async create(data: Partial<IPlaceCache>): Promise<IPlaceCache> {
    const normalized = data.query?.toLowerCase().trim();
    const cache = new PlaceCache({
      ...data,
      query: normalized,
      hitCount: 0,
      lastVerifiedAt: new Date(),
    });
    return cache.save();
  }

  async upsert(
    query: string,
    data: Partial<IPlaceCache>,
  ): Promise<IPlaceCache> {
    const normalized = query.toLowerCase().trim();

    const existing = await PlaceCache.findOne({ query: normalized }).exec();

    if (existing) {
      Object.assign(existing, data, {
        lastVerifiedAt: new Date(),
        hitCount: existing.hitCount + 1,
      });
      return existing.save();
    }

    return this.create({ ...data, query: normalized });
  }

  async incrementHitCount(id: string): Promise<void> {
    await PlaceCache.findByIdAndUpdate(id, { $inc: { hitCount: 1 } }).exec();
  }

  /** Nearby-food suggestions are keyed by googlePlaceId (the anchor place),
   * not by `query` — a separate lookup path from findByQuery() above. */
  async findByGooglePlaceId(
    googlePlaceId: string,
  ): Promise<IPlaceCache | null> {
    return PlaceCache.findOne({ googlePlaceId }).exec();
  }

  async updateNearbyFood(
    googlePlaceId: string,
    nearbyFood: IPlaceCache["nearbyFood"],
  ): Promise<void> {
    await PlaceCache.findOneAndUpdate(
      { googlePlaceId },
      { $set: { nearbyFood } },
    ).exec();
  }
}

export const placeCacheRepository = new PlaceCacheRepository();
