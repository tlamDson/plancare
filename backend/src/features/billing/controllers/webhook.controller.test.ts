import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { handleStripeWebhook } from "./webhook.controller";
import { getStripe } from "../services/stripe.service";

vi.mock("../services/stripe.service", () => ({
  getStripe: vi.fn(),
}));

function makeRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

describe("webhook.controller — handleStripeWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 503 (not a boot/request crash) when Stripe is not configured, before touching the signature header", async () => {
    vi.mocked(getStripe).mockImplementation(() => {
      throw new Error("STRIPE_NOT_CONFIGURED");
    });
    // No stripe-signature header at all — if this were checked first, the
    // failure would be a 400 "Missing stripe-signature header" instead,
    // masking the real STRIPE_NOT_CONFIGURED cause.
    const req = { headers: {}, body: Buffer.from("{}") } as unknown as Request;
    const res = makeRes();

    await handleStripeWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});
