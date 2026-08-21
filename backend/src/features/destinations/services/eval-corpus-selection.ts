/**
 * Picks 1 representative city per RAG-supported country for the eval
 * corpus scrape (Phase 0.4 of the RAG eval harness). Scraping every city
 * in extended-cities.json/rag-pack.json for all 26 RAG_ISO2 countries
 * would be ~283 cities (~850 Serper + ~850 Gemini calls) — deliberately
 * scoped down to exactly one city per country to keep the seeding cost
 * small and bounded.
 */
import type { CountrySeedPayload } from "./world-destinations.builder";
import type { ScrapeCityPayload } from "../jobs/insight-queue";

export function selectEvalCorpusCities(
  payloads: CountrySeedPayload[],
): ScrapeCityPayload[] {
  const selected: ScrapeCityPayload[] = [];

  for (const country of payloads) {
    if (!country.isSupported) continue;
    const city = country.cities[0];
    if (!city) continue;

    selected.push({
      countryIdKey: country.idKey,
      countryNameEn: country.nameEn,
      cityIdKey: city.idKey,
      cityNameEn: city.nameEn,
    });
  }

  return selected;
}
