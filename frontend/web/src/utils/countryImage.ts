/**
 * Maps a trip title to a country image from `/images/countries/`.
 * The trip title follows the pattern: "Trip to {destination}"
 * where destination is something like "Paris, France" or "Ho Chi Minh, Vietnam".
 */

type CountryKey = "vietnam" | "america" | "france";

const COUNTRY_KEYWORDS: Record<CountryKey, string[]> = {
  vietnam: [
    "vietnam",
    "vnam",
    "việt nam",
    "viet nam",
    "hanoi",
    "ha noi",
    "hà nội",
    "ho chi minh",
    "hcm",
    "hcmc",
    "hồ chí minh",
    "saigon",
    "sài gòn",
    "da nang",
    "đà nẵng",
    "hoi an",
    "hội an",
    "nha trang",
    "phu quoc",
    "phú quốc",
    "hue",
    "huế",
    "da lat",
    "đà lạt",
    "sapa",
    "sa pa",
    "halong",
    "ha long",
    "hạ long",
    "can tho",
    "cần thơ",
    "vung tau",
    "vũng tàu",
  ],
  america: [
    "united states",
    "usa",
    "u.s.a",
    "america",
    "new york",
    "los angeles",
    "san francisco",
    "chicago",
    "miami",
    "las vegas",
    "washington",
    "boston",
    "seattle",
    "houston",
    "phoenix",
    "philadelphia",
    "san diego",
    "dallas",
    "austin",
    "denver",
    "atlanta",
    "portland",
    "orlando",
    "nashville",
    "hawaii",
    "mỹ",
    "hoa kỳ",
  ],
  france: [
    "france",
    "paris",
    "lyon",
    "marseille",
    "nice",
    "toulouse",
    "bordeaux",
    "strasbourg",
    "nantes",
    "montpellier",
    "lille",
    "provence",
    "normandy",
    "normandie",
    "versailles",
    "cannes",
    "monaco",
    "avignon",
    "pháp",
  ],
};

// Exact filenames from /images/countries/
const COUNTRY_IMAGES: Record<CountryKey, string[]> = {
  vietnam: [
    "/images/countries/vietnam_image1.jpg",
    "/images/countries/vietnam_image2.webp",
    "/images/countries/vietnam_image3.jpg",
    "/images/countries/vietnam_image4.jpg",
    "/images/countries/vietnam_image5.jpg",
    "/images/countries/vietnam_image6.jpg",
    "/images/countries/vietnam_image7.jpg",
    "/images/countries/vietnam_image8.jpg",
    "/images/countries/vietnam_image9.jpg",
    "/images/countries/vietnam_image10.jpg",
    "/images/countries/vietnam_image11.jpg",
  ],
  america: [
    "/images/countries/america_image1.jpg",
    "/images/countries/america_image2.jpg",
    "/images/countries/america_image3.png",
    "/images/countries/america_image4.jpg",
    "/images/countries/america_image5.avif",
    "/images/countries/america_image6.jpeg",
    "/images/countries/america_image7.jpg",
    "/images/countries/america_image8.jpg",
    "/images/countries/america_image9.jpg",
    "/images/countries/america_image10.jpg",
  ],
  france: [
    "/images/countries/france_image1.jpeg",
    "/images/countries/france_image2.jpg",
    "/images/countries/france_image5.webp",
    "/images/countries/france_image6.webp",
    "/images/countries/france_image7.webp",
    "/images/countries/france_image8.webp",
    "/images/countries/france_image9.webp",
    "/images/countries/france_image10.webp",
    "/images/countries/france_image11.webp",
    "/images/countries/france_image12.webp",
  ],
};

/**
 * Detects the country from a trip title string and returns
 * an image path for that country, or null if not matched.
 * Selection is deterministic per title (same title = same image).
 * If a seedString is provided (like an ID), it provides a stable random image for that ID.
 */
export function getCountryImage(
  tripTitle: string,
  seedString?: string,
): string | null {
  const lower = tripTitle.toLowerCase();

  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      const images = COUNTRY_IMAGES[country as CountryKey];

      let index = 0;
      if (seedString) {
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
          hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
        }
        index = Math.abs(hash) % images.length;
      } else {
        index = tripTitle.length % images.length;
      }

      return images[index];
    }
  }

  // Fallback to a random image from all available images if no keyword matches
  const allImages = Object.values(COUNTRY_IMAGES).flat();
  let index = 0;
  if (seedString) {
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
    }
    index = Math.abs(hash) % allImages.length;
  } else {
    index = tripTitle.length % allImages.length;
  }

  return allImages[index];
}
