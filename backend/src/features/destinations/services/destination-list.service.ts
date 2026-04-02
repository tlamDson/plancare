import fs from "fs";
import path from "path";
import { Country } from "../models/Country";
import type { LeanCountryDoc } from "./destination-list.mappers";
import {
  buildAllCountrySeedPayloads,
  type CountrySeedPayload,
} from "./world-destinations.builder";
import { mergeWorldPayloadsWithMongoCountries } from "./destination-list.merge";
import type { DestinationCountryApi } from "@travelplan/shared";

/** In-memory cache: world list is static until process restart or JSON changes. */
let builtPayloadsCache: CountrySeedPayload[] | null = null;

export function clearDestinationsBuiltCacheForTests(): void {
  builtPayloadsCache = null;
}

function resolveSeedDataDir(): string {
  if (process.env.DESTINATIONS_SEED_DATA_DIR) {
    return process.env.DESTINATIONS_SEED_DATA_DIR;
  }
  const candidates = [
    path.join(process.cwd(), "scripts", "seed-data"),
    path.join(process.cwd(), "backend", "scripts", "seed-data"),
  ];
  for (const dir of candidates) {
    try {
      if (fs.statSync(dir).isDirectory()) {
        return dir;
      }
    } catch {
      /* try next */
    }
  }
  return path.join(process.cwd(), "backend", "scripts", "seed-data");
}

function getBuiltPayloadsCached(): CountrySeedPayload[] {
  if (!builtPayloadsCache) {
    builtPayloadsCache = buildAllCountrySeedPayloads(resolveSeedDataDir());
  }
  return builtPayloadsCache;
}

/**
 * Full world list from code + seed JSON, merged with Mongo for localized names
 * and per-city RAG insight text. Country RAG flag comes from builder (RAG_ISO2);
 * city highlight uses non-empty insightText in DB.
 */
export async function listDestinationsForApi(): Promise<DestinationCountryApi[]> {
  const built = getBuiltPayloadsCached();
  const raw = await Country.find({})
    .select(
      "idKey name nameEn flagEmoji cities.idKey cities.name cities.nameEn cities.timezone cities.insightText",
    )
    .lean();

  return mergeWorldPayloadsWithMongoCountries(
    built,
    raw as unknown as LeanCountryDoc[],
  );
}
