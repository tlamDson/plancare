import { Router } from "express";
import { requireUserAuth } from "../../middlewares/auth";
import {
  getUserMe,
  updateUserMe,
} from "./controllers/user.controller";

const router = Router();

// Only authenticated users can access these
router.get("/me", requireUserAuth, getUserMe);
router.patch("/me", requireUserAuth, updateUserMe);

export default router;
