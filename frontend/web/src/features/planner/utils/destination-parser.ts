import { COUNTRIES, CITIES_BY_COUNTRY } from "../constants/destinations";

export function parseDestinationToCountryCity(savedDestination: string): {
  countryId: string;
  cityId?: string;
  freeTextCity?: string;
} {
  if (!savedDestination?.trim()) return { countryId: "" };

  const normalized = savedDestination.toLowerCase().trim();

  // 1. Tìm xem có thuộc MVP City không
  for (const [countryId, cities] of Object.entries(CITIES_BY_COUNTRY)) {
    const matchedCity = cities.find(
      (c) =>
        normalized === c.destinationValue.toLowerCase() ||
        normalized.includes(c.name.toLowerCase()) ||
        normalized.includes(c.nameEn.toLowerCase()),
    );

    if (matchedCity) {
      return { countryId, cityId: matchedCity.id };
    }
  }

  // 2. Nếu không phải MVP City, tìm xem có chứa tên quốc gia nào không
  const matchedCountry = COUNTRIES.find(
    (c) =>
      normalized.includes(c.name.toLowerCase()) ||
      normalized.includes(c.nameEn.toLowerCase()),
  );

  if (matchedCountry) {
    // Tách lấy phần tên thành phố trước dấu phẩy (xử lý "Tokyo ,Japan", "Tokyo,Japan")
    const parts = savedDestination.split(/,\s*/);
    const freeText = parts[0]?.trim() ?? "";
    const isCityDifferent =
      freeText &&
      freeText.toLowerCase() !== matchedCountry.nameEn.toLowerCase() &&
      freeText.toLowerCase() !== matchedCountry.name.toLowerCase();
    return {
      countryId: matchedCountry.id,
      freeTextCity: isCityDifferent ? freeText : "",
    };
  }

  // 3. Fallback: không map được → "Other" + toàn bộ làm freeText
  return { countryId: "other", freeTextCity: savedDestination };
}
