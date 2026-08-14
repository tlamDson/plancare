import { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../../../config/env";
import { userRepository } from "../../user/repositories/user.repository";
import { logger } from "../../../lib/logger";
import { getStripe } from "../services/stripe.service";

export const handleStripeWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (err: any) {
    if (err?.message === "STRIPE_NOT_CONFIGURED") {
      res.status(503).json({ message: "Billing is not configured" });
      return;
    }
    throw err;
  }

  const sig = req.headers["stripe-signature"];

  if (!sig) {
    logger.warn("Stripe webhook missing signature");
    res.status(400).send("Webhook Error: Missing stripe-signature header");
    return;
  }

  let event: Stripe.Event;

  try {
    // req.body MUST be a Buffer because of express.raw() in index.ts
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err: any) {
    logger.error({ err }, "Stripe webhook signature verification failed");
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // The ID of the user should be passed during checkout session creation
        const userId = session.metadata?.userId;

        if (userId) {
          await userRepository.updateByClerkId(userId, { tier: "pro" });
          logger.info(
            { userId, sessionId: session.id },
            "User upgraded to PRO via Stripe webhook",
          );
        } else {
          logger.warn(
            { sessionId: session.id },
            "Checkout session completed but missing userId in metadata",
          );
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        // Metadata on subscription carries over from checkout session if configured, or can be queried
        const userId = subscription.metadata?.userId;

        if (userId) {
          await userRepository.updateByClerkId(userId, { tier: "free" });
          logger.info(
            { userId, subId: subscription.id },
            "User downgraded to FREE via Stripe webhook (subscription deleted)",
          );
        } else {
          logger.warn(
            { subId: subscription.id },
            "Subscription deleted but missing userId in metadata",
          );
        }
        break;
      }
      default:
        logger.info(
          { type: event.type },
          "Unhandled Stripe webhook event type",
        );
    }

    res.json({ received: true });
  } catch (err: any) {
    logger.error(
      { err, type: event.type },
      "Error processing Stripe webhook event",
    );
    res.status(500).send("Internal Server Error");
  }
};
