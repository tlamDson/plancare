import Stripe from "stripe";
import { env } from "../../../config/env";

// Initialize Stripe singleton
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia" as any,
});

/**
 * Creates a Stripe Checkout Session for upgrading to Pro.
 */
export const createCheckoutSession = async (userId: string) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "TravelPlan Pro",
            description:
              "Unlimited trips, Chunked Generation, AI Recommendations",
          },
          unit_amount: 999, // $9.99/mo
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId, // Required to map back to the DB upon webhook completion
    },
    success_url: `${env.FRONTEND_URL}?upgrade=success`,
    cancel_url: `${env.FRONTEND_URL}?upgrade=canceled`,
  });

  return session;
};
