import { Router } from "express";
import { toggleProStatus } from "./controllers/dev.controller";
import { triggerInsightScraping } from "./controllers/insight-trigger.controller";
import { requireUserAuth } from "../../middlewares/auth";

const router = Router();

router.post("/toggle-pro", requireUserAuth, toggleProStatus);
router.post("/scrape-insights", triggerInsightScraping);

export default router;
