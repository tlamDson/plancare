import { Request, Response } from "express";
import { Country } from "../models/Country";
import { logger } from "../../../lib/logger";

/**
 * GET /api/destinations
 *
 * Returns all supported countries with their cities.
 * insightText is excluded to keep the payload lightweight.
 */
export async function getDestinations(_req: Request, res: Response) {
  try {
    const countries = await Country.find({ isSupported: true })
      .select("-cities.insightText -cities.insightUpdatedAt -__v")
      .lean();
    res.json({ success: true, countries });
  } catch (err) {
    logger.error({ err }, "Failed to fetch destinations");
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
