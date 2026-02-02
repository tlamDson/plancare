import express, { Router } from "express";
import { handleClerkWebhook } from "../features/auth/controllers/webhook.controller";

const router: Router = express.Router();
//Routes call the sign up function from the controllers
// express.raw() is already applied in index.ts for /api/webhooks
router.post("/clerk", handleClerkWebhook);

export default router;
