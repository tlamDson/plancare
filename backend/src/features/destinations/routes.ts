import { Router } from "express";
import { getDestinations } from "./controllers/destination.controller";

const router = Router();

router.get("/", getDestinations);

export default router;
