import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { logger } from "../../../lib/logger";

export const handleClerkWebhook = async (req: Request, res: Response) => {
  try {
    await authService.handleWebhooks(req.headers, req.body);
    res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error: any) {
    logger.error({ error }, "Webhook processing failed");
    res.status(400).json({ success: false, message: error.message });
  }
};
