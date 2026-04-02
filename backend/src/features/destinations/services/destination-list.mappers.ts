/**
 * Pure mappers + sort for GET /destinations (testable without Mongo).
 */

import type { DestinationCountryApi } from "@travelplan/shared";

type LeanCity = {
  idKey: string;
  name: string;
  nameEn: string;
  timezone: string;
  insightText?: string | null;
};

export type LeanCountryDoc = {
  idKey: string;
  name: string;
  nameEn: string;
  flagEmoji?: string;
  isSupported: boolean;
  cities: LeanCity[];
};

export function mapCityToApiDto(c: LeanCity) {
  return {
    idKey: c.idKey,
    name: c.name,
    nameEn: c.nameEn,
    timezone: c.timezone,
    hasRagInsight: Boolean(c.insightText && String(c.insightText).trim().length > 0),
  };
}

export function mapCountryToApiDto(doc: LeanCountryDoc): DestinationCountryApi {
  return {
    idKey: doc.idKey,
    name: doc.name,
    nameEn: doc.nameEn,
    flagEmoji: doc.flagEmoji,
    isSupported: doc.isSupported,
    cities: doc.cities.map(mapCityToApiDto),
  };
}

export function sortDestinationsAlphabeticallyByNameEn<T extends { nameEn: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) =>
    a.nameEn.localeCompare(b.nameEn, "en", { sensitivity: "base" }),
  );
}

export function assertEveryCountryHasCities(
  countries: { idKey: string; cities: unknown[] }[],
): void {
  for (const c of countries) {
    if (!Array.isArray(c.cities) || c.cities.length === 0) {
      throw new Error(`Country ${c.idKey} must have at least one city`);
    }
  }
}
