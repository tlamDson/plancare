import { Router } from "express";
import { requireUserAuth } from "../../middlewares/auth";
import {
  createSession,
  deleteSession,
  getSession,
  getTripSuggestions,
  sendMessage,
  streamMessage,
} from "./controllers/assistant.controller";

const router = Router();

// Sessions
router.post("/sessions", requireUserAuth, createSession);
router.get("/sessions/:sessionId", requireUserAuth, getSession);
router.delete("/sessions/:sessionId", requireUserAuth, deleteSession);

// Messages
router.post("/sessions/:sessionId/messages", requireUserAuth, sendMessage);
router.post("/sessions/:sessionId/stream", requireUserAuth, streamMessage);

// Suggestions
router.get("/trips/:tripId/suggestions", requireUserAuth, getTripSuggestions);

export default router;
