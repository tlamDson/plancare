/**
 * Merge canonical world payloads (world-countries + extended-cities.json)
 * with Mongo Country docs so GET /destinations always returns every ISO country
 * and full city lists, while RAG insight text still comes from the DB.
 */

import type { DestinationCountryApi } from "@travelplan/shared";
import type { CountrySeedPayload } from "./world-destinations.builder";
import {
  mapCountryToApiDto,
  sortDestinationsAlphabeticallyByNameEn,
  type LeanCountryDoc,
} from "./destination-list.mappers";

export function mergeWorldPayloadsWithMongoCountries(
  built: CountrySeedPayload[],
  dbLean: LeanCountryDoc[],
): DestinationCountryApi[] {
  const dbByKey = new Map(dbLean.map((d) => [d.idKey, d]));

  const merged = built.map((b) => {
    const db = dbByKey.get(b.idKey);
    const insightByCity = new Map(
      (db?.cities ?? []).map((c) => [c.idKey, c.insightText]),
    );
    const cities = b.cities.map((c) => ({
      idKey: c.idKey,
      name: c.name,
      nameEn: c.nameEn,
      timezone: c.timezone,
      insightText: insightByCity.get(c.idKey) ?? null,
    }));
    const flagEmoji = db?.flagEmoji ?? b.flagEmoji;
    const doc: LeanCountryDoc = {
      idKey: b.idKey,
      name: db?.name ?? b.name,
      nameEn: db?.nameEn ?? b.nameEn,
      isSupported: b.isSupported,
      cities,
    };
    if (flagEmoji !== undefined && flagEmoji !== "") {
      doc.flagEmoji = flagEmoji;
    }
    return mapCountryToApiDto(doc);
  });

  return sortDestinationsAlphabeticallyByNameEn(merged);
}
