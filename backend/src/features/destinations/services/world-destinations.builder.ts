import fs from "fs";
import path from "path";
import worldCountries from "world-countries";
import { getCountry } from "countries-and-timezones";

export const RAG_ISO2 = new Set([
  "VN", "US", "FR", "JP", "TH", "KR", "SG", "AU", "GB", "IT", "ES", "DE", "NL",
  "CA", "MX", "ID", "MY", "IN", "CN", "BR", "PT", "TR", "AE", "NZ", "CH", "AT",
]);

export type ExtCity = { idKey: string; name: string; nameEn: string; timezone: string };

export type CountrySeedPayload = {
  idKey: string;
  name: string;
  nameEn: string;
  flagEmoji?: string;
  isSupported: boolean;
  cities: { idKey: string; name: string; nameEn: string; timezone: string }[];
};

function slugifyCity(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return base || "city";
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function primaryTz(iso2: string): string {
  const c = getCountry(iso2 as Parameters<typeof getCountry>[0]);
  return c?.timezones?.[0] ?? "UTC";
}

function mergeExtCityParts(
  parts: Record<string, ExtCity[]>[],
): Record<string, ExtCity[]> {
  const merged: Record<string, ExtCity[]> = {};
  for (const part of parts) {
    for (const [iso, cities] of Object.entries(part)) {
      const prev = merged[iso] ?? [];
      const seen = new Set(prev.map((c) => c.idKey));
      const next = [...prev];
      for (const c of cities) {
        if (seen.has(c.idKey)) continue;
        next.push(c);
        seen.add(c.idKey);
      }
      merged[iso] = next;
    }
  }
  return merged;
}

export function loadExtendedCities(
  seedDataDir: string,
): Record<string, ExtCity[]> {
  const names = ["extended-cities.json", "extended-cities.rag-pack.json"];
  const parts: Record<string, ExtCity[]>[] = [];
  for (const n of names) {
    const p = path.join(seedDataDir, n);
    if (!fs.existsSync(p)) continue;
    parts.push(
      JSON.parse(
        fs.readFileSync(p, "utf8").replace(/^\uFEFF/, ""),
      ) as Record<string, ExtCity[]>,
    );
  }
  return mergeExtCityParts(parts);
}

function mergeCapitalIfMissing(
  cities: ExtCity[],
  capitalName: string | undefined,
  countryTz: string,
): ExtCity[] {
  if (!capitalName) return cities.length ? cities : [];
  const capNorm = norm(capitalName);
  const hasCap = cities.some(
    (x) => norm(x.nameEn) === capNorm || norm(x.name) === capNorm,
  );
  if (hasCap) return cities;
  const slug = slugifyCity(capitalName);
  const capCity: ExtCity = {
    idKey: cities.some((c) => c.idKey === slug) ? `${slug}_capital` : slug,
    name: capitalName,
    nameEn: capitalName,
    timezone: countryTz,
  };
  return [capCity, ...cities];
}

/** Deterministic world list for seed + tests (no DB). */
export function buildAllCountrySeedPayloads(
  seedDataDir: string,
): CountrySeedPayload[] {
  const extended = loadExtendedCities(seedDataDir);
  const out: CountrySeedPayload[] = [];

  for (const wc of worldCountries) {
    const iso = wc.cca2;
    if (!iso) continue;

    const idKey = iso.toLowerCase();
    const nameEn = wc.name.common;
    const nameVi = wc.translations?.vie?.common ?? nameEn;
    const countryTz = primaryTz(iso);
    const cap = wc.capital?.[0];

    let citiesRaw = extended[idKey] ?? [];
    citiesRaw = mergeCapitalIfMissing(citiesRaw, cap, countryTz);

    if (citiesRaw.length === 0) {
      citiesRaw = [
        {
          idKey: `${idKey}_main`,
          name: nameEn,
          nameEn,
          timezone: countryTz,
        },
      ];
    }

    const cities = citiesRaw.map((c) => ({
      idKey: c.idKey,
      name: c.name,
      nameEn: c.nameEn,
      timezone: c.timezone || countryTz,
    }));

    out.push({
      idKey,
      name: nameVi,
      nameEn,
      flagEmoji: wc.flag,
      isSupported: RAG_ISO2.has(iso),
      cities,
    });
  }

  return out;
}
