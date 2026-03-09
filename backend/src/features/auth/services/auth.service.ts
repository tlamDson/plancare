import { Webhook } from "svix";
import { userRepository } from "../../user/repositories/user.repository";
import { env } from "../../../config/env";
import { logger } from "../../../lib/logger";

interface WebhookEvent {
  data: any;
  object: "event";
  type: string;
}

export class AuthService {
  async handleWebhooks(headers: any, payload: any) {
    const svixId = headers["svix-id"] as string;
    const svixTimestamp = headers["svix-timestamp"] as string;
    const svixSignature = headers["svix-signature"] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new Error("Missing Svix headers");
    }

    const wh = new Webhook(env.CLERK_WEBHOOK_SIGNING_SECRET);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(payload.toString(), {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as WebhookEvent;
    } catch (err: any) {
      logger.error({ err }, "Webhook verification failed");
      throw new Error("Webhook verification failed");
    }

    const eventType = evt.type;

    if (eventType === "user.created") {
      const { id, email_addresses, image_url, first_name, last_name } =
        evt.data;

      await userRepository.create({
        clerkUserId: id,
        email: email_addresses[0].email_address,
        avatarUrl: image_url,
        firstName: first_name,
        lastName: last_name,
        gender: "not_specified",
        dateOfBirth: new Date(), // Default or handle appropriately
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
      } as any); // Type assertion needed or fix User model interface to allow partials better or map correctly

      logger.info({ userId: id }, "User created via webhook");
    }

    return { success: true };
  }
}

export const authService = new AuthService();
