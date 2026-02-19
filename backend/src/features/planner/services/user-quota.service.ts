import { tripRepository } from "../repositories/trip.repository";
import { logger } from "../../../lib/logger";

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

export class UserQuotaService {
  private readonly DEFAULT_LIMIT = 10;

  async canCreateTrip(userId: string): Promise<QuotaCheckResult> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const count = await tripRepository.countByUserIdSince(userId, last24h);

    const limit = this.DEFAULT_LIMIT;
    const remaining = Math.max(0, limit - count);

    logger.debug(
      { userId, count, limit, remaining },
      "User quota check",
    );

    return {
      allowed: remaining > 0,
      remaining,
      resetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      limit,
    };
  }
}

export const userQuotaService = new UserQuotaService();
