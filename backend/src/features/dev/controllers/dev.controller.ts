import { Response } from "express";
import { ClerkRequest } from "../../../types/express";
import { userRepository } from "../../user/repositories/user.repository";
import { env } from "../../../config/env";
import { logger } from "../../../lib/logger";

export const toggleProStatus = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    if (env.NODE_ENV !== "development") {
      res.status(403).json({ message: "Only available in local development" });
      return;
    }

    const userId = req.auth?.()?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await userRepository.findByClerkId(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const newTier = user.tier === "pro" ? "free" : "pro";
    await userRepository.updateByClerkId(userId, { tier: newTier });

    logger.info({ userId, newTier }, "Dev Backdoor: toggled pro status");

    res.json({ success: true, newTier });
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to toggle pro status");
    res.status(500).json({ message: "Failed to toggle pro status" });
  }
};
