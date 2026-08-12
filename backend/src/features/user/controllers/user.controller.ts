import { Response } from "express";
import { userRepository } from "../repositories/user.repository";
import { ClerkRequest } from "../../../types/express";
import { updateUserSchema } from "../schemas/user.schema";
import { userQuotaService } from "../../planner/services/user-quota.service";
import axios from "axios";
import { env } from "../../../config/env";
import { logger } from "../../../lib/logger";

export const getUserMe = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const clerkId = req.auth?.()?.userId;
    if (!clerkId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    let user = await userRepository.findByClerkId(clerkId);

    // Fallback for local development missing webhooks
    if (!user) {
      try {
        const clerkRes = await axios.get(
          `https://api.clerk.com/v1/users/${clerkId}`,
          {
            headers: {
              Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
            },
          },
        );

        const clerkUser = clerkRes.data;
        const primaryEmailObj =
          clerkUser.email_addresses?.find(
            (e: any) => e.id === clerkUser.primary_email_address_id,
          ) || clerkUser.email_addresses?.[0];

        user = await userRepository.create({
          clerkUserId: clerkId,
          email: primaryEmailObj?.email_address || "",
          avatarUrl: clerkUser.image_url,
          firstName: clerkUser.first_name || "",
          lastName: clerkUser.last_name || "",
          gender: "not_specified",
          dateOfBirth: new Date(),
          preferences: {
            currency: "USD",
            budgetRange: 0,
            travelStyle: [],
          },
          notificationPreferences: {
            tripReminders: true,
            budgetAlerts: true,
            tripInvites: true,
            aiSuggestions: true,
            doNotDisturb: false,
          },
        } as any);

        logger.info(
          { userId: clerkId },
          "Sync created missing user from Clerk via API fallback",
        );
      } catch (err: any) {
        logger.error(
          { err: err.message || err },
          "Failed to sync missing user from Clerk API",
        );
        res.status(404).json({
          message: "User not found and could not be synced from Clerk",
        });
        return;
      }
    }

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const quota = await userQuotaService.canCreateTrip(clerkId);
    res.json({
      ...user.toObject(),
      usage: {
        tripsUsedThisCycle:
          quota.limit === Number.MAX_SAFE_INTEGER
            ? 0
            : Math.max(0, quota.limit - quota.remaining),
        tripLimit: quota.limit === Number.MAX_SAFE_INTEGER ? -1 : quota.limit,
        quotaResetsAt: quota.resetAt.toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserMe = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const clerkId = req.auth?.()?.userId;
    if (!clerkId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // 1. Validate Input (Security: Prevent Mass Assignment)
    const validationResult = updateUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        message: "Invalid input",
        errors: validationResult.error.flatten(),
      });
      return;
    }

    const validatedData = validationResult.data;

    // 2. Efficient Update (Performance: Single DB Hit)
    const updatedUser = await userRepository.updateByClerkId(
      clerkId,
      validatedData,
    );

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
