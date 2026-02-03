import { Response } from "express";
import { ClerkRequest } from "../../../types/express";
import { logger } from "../../../lib/logger";
import { assistantService } from "../services/assistant.service";

export const createSession = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { tripId } = req.body;
    const session = await assistantService.createSession({
      clerkUserId,
      tripId,
    });

    res.status(201).json(session);
  } catch (error: any) {
    logger.error({ error }, "Failed to create AI session");
    res.status(400).json({ message: error.message || "Failed to create session" });
  }
};

export const getSession = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const session = await assistantService.getSession({
      clerkUserId,
      sessionId: req.params.sessionId,
    });

    if (!session) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    res.json(session);
  } catch (error: any) {
    logger.error({ error }, "Failed to fetch AI session");
    res.status(500).json({ message: error.message || "Failed to fetch session" });
  }
};

export const sendMessage = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { content } = req.body;
    if (!content || typeof content !== "string") {
      res.status(400).json({ message: "Content is required" });
      return;
    }

    const message = await assistantService.addMessage({
      clerkUserId,
      sessionId: req.params.sessionId,
      content,
    });

    res.json(message);
  } catch (error: any) {
    logger.error({ error }, "Failed to send AI message");
    res.status(400).json({ message: error.message || "Failed to send message" });
  }
};

export const streamMessage = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { content } = req.body;
    if (!content || typeof content !== "string") {
      res.status(400).json({ message: "Content is required" });
      return;
    }

    const responseText = await assistantService.streamMessage({
      clerkUserId,
      sessionId: req.params.sessionId,
      content,
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.write(responseText);
    res.end();
  } catch (error: any) {
    logger.error({ error }, "Failed to stream AI response");
    res.status(500).json({ message: error.message || "Failed to stream response" });
  }
};

export const getTripSuggestions = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { type } = req.query;
    const suggestions = await assistantService.getTripSuggestions({
      clerkUserId,
      tripId: req.params.tripId,
      type: typeof type === "string" ? type : undefined,
    });

    res.json(suggestions);
  } catch (error: any) {
    logger.error({ error }, "Failed to get AI suggestions");
    res.status(500).json({ message: error.message || "Failed to get suggestions" });
  }
};

export const deleteSession = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await assistantService.deleteSession({
      clerkUserId,
      sessionId: req.params.sessionId,
    });

    res.status(204).send();
  } catch (error: any) {
    logger.error({ error }, "Failed to delete AI session");
    res.status(500).json({ message: error.message || "Failed to delete session" });
  }
};
