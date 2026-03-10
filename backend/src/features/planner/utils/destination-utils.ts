const MVP_CITY_PATTERNS = [
  /vietnam|việt nam|viet nam/i,
  /united states|usa|america|u\.s\./i,
  /france|pháp/i,
];

const MVP_CITY_NAMES = new Set([
  "hanoi",
  "ho chi minh",
  "da nang",
  "hoi an",
  "nha trang",
  "da lat",
  "phu quoc",
  "ha long",
  "sapa",
  "hue",
  "can tho",
  "vung tau",
  "paris",
  "lyon",
  "marseille",
  "nice",
  "bordeaux",
  "toulouse",
  "new york",
  "los angeles",
  "san francisco",
  "chicago",
  "miami",
  "las vegas",
  "seattle",
  "boston",
  "washington",
  "austin",
]);

export function isMVPDestination(destination: string): boolean {
  if (!destination?.trim()) return false;
  const normalized = destination.toLowerCase().trim();
  const [cityPart, countryPart] = normalized.split(",").map((s) => s.trim());

  if (countryPart && MVP_CITY_PATTERNS.some((p) => p.test(countryPart))) {
    return true;
  }
  const cityKey = (cityPart ?? normalized).replace(/\s+/g, " ");
  return MVP_CITY_NAMES.has(cityKey) || MVP_CITY_NAMES.has(normalized);
}
