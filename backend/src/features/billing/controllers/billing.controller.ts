import { Response } from "express";
import { ClerkRequest } from "../../../types/express";

/**
 * POST /api/billing/create-checkout-session
 *
 * Minimal checkout session bootstrap.
 * In this phase we use STRIPE_CHECKOUT_URL from env as redirect target.
 */
export const createCheckoutSession = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  const userId = req.auth?.()?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const checkoutUrl = process.env.STRIPE_CHECKOUT_URL;
  if (!checkoutUrl) {
    res.status(503).json({
      message: "Checkout is currently unavailable.",
    });
    return;
  }

  res.json({
    url: checkoutUrl,
  });
};

