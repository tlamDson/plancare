/**
 * ActivityRegenService
 *
 * Handles regenerating a single itinerary activity with a unique, validated replacement.
 * Separate service to keep trip.controller.ts under the Rule-of-200 limit.
 *
 * Protocol:
 *  1. Generate a targeted search query via AI, passing existing names to avoid.
 *  2. Validate the query against Google Places / Mapbox.
 *  3. Confirm uniqueness (no name overlap with existing activities).
 *  4. Build a replacement IActivity-compatible object (same time/type as original).
 */

import { aiAgentService } from "./ai-agent.service";
import { validationService } from "./validation.service";
import { logger } from "../../../lib/logger";
import type { IActivity } from "../models/Trip.types";

interface RegenOneParams {
  target: IActivity;
  destination: string;
  existingNames: string[];
}

const MAX_ATTEMPTS = 3;

export class ActivityRegenService {
  async regenOne({ target, destination, existingNames }: RegenOneParams): Promise<IActivity> {
    const existingNamesLower = existingNames.map((n) => n.toLowerCase().trim());

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // 1. Generate a single replacement query, excluding all current places
      const queries = await aiAgentService.generateSupplementaryQueries(
        1,
        destination,
        existingNames,
      );

      if (queries.length === 0) {
        logger.warn(
          { destination, attempt },
          "⚠️ [REGEN] AI returned no queries — retrying",
        );
        continue;
      }

      const query = queries[0]!;

      // 2. Validate the query
      const validated = await validationService.validateIntent(query, destination);
      if (!validated) {
        logger.warn(
          { query, attempt },
          "⚠️ [REGEN] Validation returned null — retrying",
        );
        continue;
      }

      // 3. Uniqueness check — reject if same name as any existing activity
      const candidateName = validated.name.toLowerCase().trim();
      if (existingNamesLower.includes(candidateName)) {
        logger.info(
          { candidateName, attempt },
          "⚠️ [REGEN] Candidate is a duplicate — retrying",
        );
        continue;
      }

      // 4. Build replacement activity, preserving time/type from original
      const replacement: IActivity = {
        type: target.type,
        name: validated.name,
        status: "planned",
        order: target.order,
        ...(target.time && { time: target.time }),
        ...(target.endTime && { endTime: target.endTime }),
        ...(target.cost !== undefined && { cost: target.cost }),
        ...(validated.rating !== undefined && { rating: validated.rating }),
        ...(validated.priceLevel !== undefined && { priceLevel: validated.priceLevel }),
        ...(validated.photoUrl && { photoUrl: validated.photoUrl }),
        ...(validated.openingHours && { openingHours: validated.openingHours }),
        ...(validated.googlePlaceId && {
          location: {
            type: "Point",
            coordinates: validated.coordinates,
            googlePlaceId: validated.googlePlaceId,
          },
        }),
        ...(!validated.googlePlaceId && validated.coordinates && {
          location: {
            type: "Point",
            coordinates: validated.coordinates,
          },
        }),
      };

      logger.info(
        { name: replacement.name, attempt, destination },
        "✅ [REGEN] Replacement activity validated and unique",
      );
      return replacement;
    }

    logger.error(
      { destination, existingCount: existingNames.length },
      "❌ [REGEN] Exhausted all attempts — no unique alternative found",
    );
    throw new Error("NO_ALTERNATIVE_FOUND");
  }
}

export const activityRegenService = new ActivityRegenService();
