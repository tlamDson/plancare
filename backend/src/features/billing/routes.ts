import { Router } from "express";
import { createCheckout } from "./controllers/checkout.controller";
import { requireUserAuth } from "../../middlewares/auth";

const router = Router();

// Endpoint for creating a checkout session
router.post("/create-checkout-session", requireUserAuth, createCheckout);

export default router;
