import { Router } from "express";
import { toggleProStatus } from "./controllers/dev.controller";
import { requireUserAuth } from "../../middlewares/auth";

const router = Router();

router.post("/toggle-pro", requireUserAuth, toggleProStatus);

export default router;
