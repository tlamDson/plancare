/**
 * Weather routes
 */

import { Router } from "express";
import { requireUserAuth } from "../../middlewares/auth";
import { getWeatherForecast } from "./controllers/weather.controller";

const router = Router();

router.get("/weather/forecast", requireUserAuth, getWeatherForecast);

export default router;
