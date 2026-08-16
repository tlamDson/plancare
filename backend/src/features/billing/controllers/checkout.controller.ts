import { Response } from "express";
import { ClerkRequest } from "../../../types/express";
import { createCheckoutSession } from "../services/stripe.service";
import { logger } from "../../../lib/logger";

export const createCheckout = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.()?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const session = await createCheckoutSession(userId);

    res.json({ url: session.url });
  } catch (error: any) {
    if (error?.message === "STRIPE_NOT_CONFIGURED") {
      res.status(503).json({ message: "Billing is not configured" });
      return;
    }
    logger.error(
      { error: error.message, userId: req.auth?.()?.userId },
      "Failed to create checkout session",
    );
    res.status(500).json({ message: "Failed to create checkout session" });
  }
};
