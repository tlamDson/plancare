import { describe, it, expect } from "vitest";
import request from "supertest";
import { Webhook } from "svix";
import { createApp } from "../../app";
import User from "../../features/user/models/User";

const app = createApp();

// authService.handleWebhooks() constructs its own `new Webhook(secret)` per
// request using CLERK_WEBHOOK_SIGNING_SECRET — sign with the same secret
// integration-setup.ts sets, so verification succeeds server-side.
const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET!;
const signer = new Webhook(webhookSecret);

function sign(msgId: string, payload: string) {
  return signer.sign(msgId, new Date(), payload);
}

function svixHeaders(msgId: string, payload: string) {
  return {
    "svix-id": msgId,
    "svix-timestamp": Math.floor(Date.now() / 1000).toString(),
    "svix-signature": sign(msgId, payload),
  };
}

function userCreatedEvent(clerkUserId: string, email: string) {
  return JSON.stringify({
    type: "user.created",
    object: "event",
    data: {
      id: clerkUserId,
      email_addresses: [{ email_address: email }],
      image_url: "https://example.test/avatar.png",
      first_name: "Ada",
      last_name: "Lovelace",
    },
  });
}

describe("POST /api/webhooks/clerk", () => {
  it("rejects a request missing the svix headers", async () => {
    const res = await request(app)
      .post("/api/webhooks/clerk")
      .set("Content-Type", "application/json")
      .send(userCreatedEvent("user-clerk-1", "ada1@example.test"));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Missing Svix headers/);
  });

  it("rejects a request with an invalid signature", async () => {
    const payload = userCreatedEvent("user-clerk-2", "ada2@example.test");
    const res = await request(app)
      .post("/api/webhooks/clerk")
      .set("Content-Type", "application/json")
      .set("svix-id", "msg_bad")
      .set("svix-timestamp", Math.floor(Date.now() / 1000).toString())
      .set("svix-signature", "v1,not-a-real-signature")
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/verification failed/);
  });

  it("creates a User document on a valid user.created event", async () => {
    // Load-bearing for the same raw-body-before-express.json() ordering as
    // the Stripe webhook: if express.json() ran first, payload.toString()
    // inside handleWebhooks would not match what was signed.
    const payload = userCreatedEvent("user-clerk-3", "ada3@example.test");
    const res = await request(app)
      .post("/api/webhooks/clerk")
      .set("Content-Type", "application/json")
      .set(svixHeaders("msg_ok", payload))
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await User.findOne({ clerkUserId: "user-clerk-3" });
    expect(user).not.toBeNull();
    expect(user?.email).toBe("ada3@example.test");
  });

  it("returns 200 no-op for an unhandled event type", async () => {
    const payload = JSON.stringify({
      type: "user.updated",
      object: "event",
      data: { id: "user-clerk-4" },
    });
    const res = await request(app)
      .post("/api/webhooks/clerk")
      .set("Content-Type", "application/json")
      .set(svixHeaders("msg_unhandled", payload))
      .send(payload);

    expect(res.status).toBe(200);
    const user = await User.findOne({ clerkUserId: "user-clerk-4" });
    expect(user).toBeNull();
  });
});
