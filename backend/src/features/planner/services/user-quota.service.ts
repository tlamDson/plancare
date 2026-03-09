import { tripRepository } from "../repositories/trip.repository";
import { logger } from "../../../lib/logger";
import { userRepository } from "../../user/repositories/user.repository";

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

export class UserQuotaService {
  private readonly FREE_LIMIT = 10;

  async canCreateTrip(userId: string): Promise<QuotaCheckResult> {
    const now = new Date();
    const user = await userRepository.findByClerkId(userId);
    const isPro = user?.tier === "pro";
    const cycleStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const resetAt = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const count = await tripRepository.countByUserIdSince(userId, cycleStart);
    const limit = isPro ? Number.MAX_SAFE_INTEGER : this.FREE_LIMIT;
    const remaining = isPro ? Number.MAX_SAFE_INTEGER : Math.max(0, limit - count);

    logger.debug(
      { userId, count, limit, remaining, isPro, cycleStart, resetAt },
      "User quota check",
    );

    return {
      allowed: isPro ? true : remaining > 0,
      remaining,
      resetAt,
      limit,
    };
  }
}

export const userQuotaService = new UserQuotaService();
