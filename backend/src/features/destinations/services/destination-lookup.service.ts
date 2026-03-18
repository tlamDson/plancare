/**
 * Destination Lookup Service (RAG)
 *
 * Fetches the insightText for a given destination from the Country database.
 *
 * Priority order:
 *   1. Precise lookup via countryIdKey + cityIdKey (set when user selects from dropdown)
 *   2. Parse "City, Country" string with case-insensitive RegEx (fallback for legacy data)
 */

import { Country } from "../models/Country";
import { logger } from "../../../lib/logger";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function resolveCityFromDestination(
  destination: string
): Promise<{ countryIdKey: string; cityIdKey: string; countryName: string; cityName: string } | null> {
  const parts = destination.split(",").map((s) => s.trim());
  const cityPart = parts[0] ?? "";
  const countryPart = parts[1] ?? "";
  if (!cityPart) return null;

  let country = null;

  if (countryPart) {
    country = await Country.findOne({
      nameEn: { $regex: new RegExp(`^${escapeRegex(countryPart)}$`, "i") },
    });
  }

  if (!country) {
    country = await Country.findOne({
      "cities.nameEn": {
        $regex: new RegExp(`^${escapeRegex(cityPart)}$`, "i"),
      },
    });
  }

  if (!country) return null;

  const city = country.cities.find(
    (c) =>
      c.nameEn.toLowerCase() === cityPart.toLowerCase() ||
      c.name.toLowerCase() === cityPart.toLowerCase(),
  );

  if (!city) return null;

  return {
    countryIdKey: country.idKey,
    cityIdKey: city.idKey,
    countryName: country.nameEn,
    cityName: city.nameEn,
  };
}

export async function getCityInsight(
  destination: string,
  opts?: { countryIdKey?: string; cityIdKey?: string },
): Promise<string | null> {
  // PATH 1 — Precise lookup via dropdown idKeys (fastest, no string parsing)
  if (opts?.countryIdKey && opts?.cityIdKey) {
    const country = await Country.findOne({
      idKey: opts.countryIdKey,
      "cities.idKey": opts.cityIdKey,
    });
    const city = country?.cities?.find((c) => c.idKey === opts!.cityIdKey);
    if (city?.insightText) {
      logger.info(
        { countryIdKey: opts.countryIdKey, cityIdKey: opts.cityIdKey },
        "RAG insight loaded via idKey lookup",
      );
    }
    return city?.insightText ?? null;
  }

  // PATH 2 — Parse "City, Country" string (legacy or free-text destinations)
  const resolved = await resolveCityFromDestination(destination);
  if (!resolved) return null;

  const country = await Country.findOne({
    idKey: resolved.countryIdKey,
    "cities.idKey": resolved.cityIdKey,
  });
  
  const city = country?.cities?.find((c) => c.idKey === resolved.cityIdKey);

  if (city?.insightText) {
    logger.info({ cityPart: resolved.cityName, countryPart: resolved.countryName }, "RAG insight loaded via string parse");
  }

  return city?.insightText ?? null;
}
