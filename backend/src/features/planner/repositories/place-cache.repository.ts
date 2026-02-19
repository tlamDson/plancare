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

  async upsert(query: string, data: Partial<IPlaceCache>): Promise<IPlaceCache> {
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

  async findStale(days: number = 30): Promise<IPlaceCache[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return PlaceCache.find({
      lastVerifiedAt: { $lt: cutoff },
    }).exec();
  }

  async deleteStale(days: number = 90): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await PlaceCache.deleteMany({
      lastVerifiedAt: { $lt: cutoff },
      hitCount: { $lt: 5 },
    }).exec();

    return result.deletedCount;
  }
}

export const placeCacheRepository = new PlaceCacheRepository();
