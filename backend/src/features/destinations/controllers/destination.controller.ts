import { Request, Response } from "express";
import { destinationsListResponseSchema } from "@travelplan/shared";
import { logger } from "../../../lib/logger";
import { listDestinationsForApi } from "../services/destination-list.service";

/**
 * GET /api/destinations
 *
 * Returns all countries with cities (alphabetical by nameEn). insightText stripped;
 * cities include hasRagInsight for UI highlighting.
 */
export async function getDestinations(_req: Request, res: Response) {
  try {
    const countries = await listDestinationsForApi();
    const payload = { success: true as const, countries };
    const parsed = destinationsListResponseSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error(
        { issues: parsed.error.flatten() },
        "Destinations response failed schema validation",
      );
      res.status(500).json({ success: false, message: "Internal server error" });
      return;
    }
    res.json(parsed.data);
  } catch (err) {
    logger.error({ err }, "Failed to fetch destinations");
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
