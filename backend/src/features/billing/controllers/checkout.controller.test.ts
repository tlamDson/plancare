import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { createCheckout } from "./checkout.controller";
import { createCheckoutSession } from "../services/stripe.service";
import type { ClerkRequest } from "../../../types/express";

vi.mock("../services/stripe.service", () => ({
  createCheckoutSession: vi.fn(),
}));

function makeRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function makeReq(userId: string | undefined): ClerkRequest {
  return { auth: () => ({ userId }) } as unknown as ClerkRequest;
}

describe("checkout.controller — createCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const res = makeRes();
    await createCheckout(makeReq(undefined), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 503 (not 500, not a crash) when Stripe is not configured", async () => {
    vi.mocked(createCheckoutSession).mockRejectedValue(
      new Error("STRIPE_NOT_CONFIGURED"),
    );
    const res = makeRes();
    await createCheckout(makeReq("user-1"), res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  it("returns the checkout url on success", async () => {
    vi.mocked(createCheckoutSession).mockResolvedValue({
      url: "https://stripe.test/checkout",
    } as Awaited<ReturnType<typeof createCheckoutSession>>);
    const res = makeRes();
    await createCheckout(makeReq("user-1"), res);
    expect(res.json).toHaveBeenCalledWith({
      url: "https://stripe.test/checkout",
    });
  });
});
