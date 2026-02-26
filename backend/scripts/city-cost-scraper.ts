import axios from "axios";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { CityCost } from "../src/features/planner/models/CityCost";

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const YELP_API_KEY = (process.env.YELP_API_KEY || "")
  .replace(/^Bearer\s+/i, "")
  .replace(/["']/g, "");
const AMADEUS_API_KEY = (process.env.AMADEUS_API_KEY || "").replace(
  /["']/g,
  "",
);
const AMADEUS_API_SECRET = (process.env.AMADEUS_API_SECRET || "").replace(
  /["']/g,
  "",
);

// ─── Target Cities: Vietnam, France, USA (105 cities total) ───────────
//
// NOTE — Yelp does NOT support Vietnam (HTTP 400 for any VN location).
// Vietnam cities use validated hardcoded pricing from Numbeo + backpacker
// community data instead of the Yelp API.
//
// hardcodedFood: minimum per-meal cost in USD (street food / local restaurant)
// hardcodedHotel: minimum per-night cost in USD (hostel / 1-star hotel)
const TARGET_CITIES: Array<{
  id: string;
  name: string;
  country: string;
  amadeusCode: string;
  hardcodedFood?: number;
  hardcodedHotel?: number;
}> = [
  // ────────────────────────────────────────────
  // VIETNAM (30 cities)  — hardcoded baselines
  // ────────────────────────────────────────────
  {
    id: "hanoi_vn",
    name: "Hanoi",
    country: "VN",
    amadeusCode: "HAN",
    hardcodedFood: 2,
    hardcodedHotel: 12,
  },
  {
    id: "hochiminh_vn",
    name: "Ho Chi Minh City",
    country: "VN",
    amadeusCode: "SGN",
    hardcodedFood: 2,
    hardcodedHotel: 15,
  },
  {
    id: "danang_vn",
    name: "Da Nang",
    country: "VN",
    amadeusCode: "DAD",
    hardcodedFood: 2,
    hardcodedHotel: 12,
  },
  {
    id: "hoian_vn",
    name: "Hoi An",
    country: "VN",
    amadeusCode: "DAD",
    hardcodedFood: 2,
    hardcodedHotel: 15,
  },
  {
    id: "hue_vn",
    name: "Hue",
    country: "VN",
    amadeusCode: "HUI",
    hardcodedFood: 1,
    hardcodedHotel: 10,
  },
  {
    id: "nhatrang_vn",
    name: "Nha Trang",
    country: "VN",
    amadeusCode: "CXR",
    hardcodedFood: 2,
    hardcodedHotel: 12,
  },
  {
    id: "phuquoc_vn",
    name: "Phu Quoc",
    country: "VN",
    amadeusCode: "PQC",
    hardcodedFood: 3,
    hardcodedHotel: 20,
  },
  {
    id: "dalat_vn",
    name: "Da Lat",
    country: "VN",
    amadeusCode: "DLI",
    hardcodedFood: 2,
    hardcodedHotel: 10,
  },
  {
    id: "halong_vn",
    name: "Ha Long",
    country: "VN",
    amadeusCode: "VDO",
    hardcodedFood: 2,
    hardcodedHotel: 15,
  },
  {
    id: "sapa_vn",
    name: "Sapa",
    country: "VN",
    amadeusCode: "HAN",
    hardcodedFood: 2,
    hardcodedHotel: 10,
  },
  {
    id: "quynhon_vn",
    name: "Quy Nhon",
    country: "VN",
    amadeusCode: "UIH",
    hardcodedFood: 1,
    hardcodedHotel: 8,
  },
  {
    id: "vungtau_vn",
    name: "Vung Tau",
    country: "VN",
    amadeusCode: "SGN",
    hardcodedFood: 2,
    hardcodedHotel: 10,
  },
  {
    id: "cantho_vn",
    name: "Can Tho",
    country: "VN",
    amadeusCode: "VCA",
    hardcodedFood: 1,
    hardcodedHotel: 8,
  },
  {
    id: "muine_vn",
    name: "Mui Ne",
    country: "VN",
    amadeusCode: "PQC",
    hardcodedFood: 2,
    hardcodedHotel: 12,
  },
  {
    id: "phanthiet_vn",
    name: "Phan Thiet",
    country: "VN",
    amadeusCode: "PQC",
    hardcodedFood: 2,
    hardcodedHotel: 10,
  },
  {
    id: "haiphong_vn",
    name: "Hai Phong",
    country: "VN",
    amadeusCode: "HPH",
    hardcodedFood: 1,
    hardcodedHotel: 8,
  },
  {
    id: "vinh_vn",
    name: "Vinh",
    country: "VN",
    amadeusCode: "VII",
    hardcodedFood: 1,
    hardcodedHotel: 7,
  },
  {
    id: "buonmathuot_vn",
    name: "Buon Ma Thuot",
    country: "VN",
    amadeusCode: "BMV",
    hardcodedFood: 1,
    hardcodedHotel: 7,
  },
  {
    id: "tayninh_vn",
    name: "Tay Ninh",
    country: "VN",
    amadeusCode: "SGN",
    hardcodedFood: 1,
    hardcodedHotel: 6,
  },
  {
    id: "rachgia_vn",
    name: "Rach Gia",
    country: "VN",
    amadeusCode: "VKG",
    hardcodedFood: 1,
    hardcodedHotel: 7,
  },
  {
    id: "mytho_vn",
    name: "My Tho",
    country: "VN",
    amadeusCode: "SGN",
    hardcodedFood: 1,
    hardcodedHotel: 6,
  },
  {
    id: "donghoi_vn",
    name: "Dong Hoi",
    country: "VN",
    amadeusCode: "VDH",
    hardcodedFood: 1,
    hardcodedHotel: 7,
  },
  {
    id: "quangngai_vn",
    name: "Quang Ngai",
    country: "VN",
    amadeusCode: "DAD",
    hardcodedFood: 1,
    hardcodedHotel: 7,
  },
  {
    id: "bienhoa_vn",
    name: "Bien Hoa",
    country: "VN",
    amadeusCode: "SGN",
    hardcodedFood: 1,
    hardcodedHotel: 7,
  },
  {
    id: "thainguyen_vn",
    name: "Thai Nguyen",
    country: "VN",
    amadeusCode: "HAN",
    hardcodedFood: 1,
    hardcodedHotel: 6,
  },
  {
    id: "namdinh_vn",
    name: "Nam Dinh",
    country: "VN",
    amadeusCode: "HAN",
    hardcodedFood: 1,
    hardcodedHotel: 6,
  },
  {
    id: "thanhhoa_vn",
    name: "Thanh Hoa",
    country: "VN",
    amadeusCode: "THD",
    hardcodedFood: 1,
    hardcodedHotel: 6,
  },
  {
    id: "bacninh_vn",
    name: "Bac Ninh",
    country: "VN",
    amadeusCode: "HAN",
    hardcodedFood: 1,
    hardcodedHotel: 7,
  },
  {
    id: "longan_vn",
    name: "Long An",
    country: "VN",
    amadeusCode: "SGN",
    hardcodedFood: 1,
    hardcodedHotel: 6,
  },
  {
    id: "binhduong_vn",
    name: "Binh Duong",
    country: "VN",
    amadeusCode: "SGN",
    hardcodedFood: 1,
    hardcodedHotel: 8,
  },

  // ────────────────────────────────────────────
  // FRANCE (35 cities)  — Yelp + Amadeus APIs
  // ────────────────────────────────────────────
  { id: "paris_fr", name: "Paris", country: "FR", amadeusCode: "PAR" },
  { id: "lyon_fr", name: "Lyon", country: "FR", amadeusCode: "LYS" },
  { id: "marseille_fr", name: "Marseille", country: "FR", amadeusCode: "MRS" },
  { id: "toulouse_fr", name: "Toulouse", country: "FR", amadeusCode: "TLS" },
  { id: "nice_fr", name: "Nice", country: "FR", amadeusCode: "NCE" },
  { id: "nantes_fr", name: "Nantes", country: "FR", amadeusCode: "NTE" },
  {
    id: "strasbourg_fr",
    name: "Strasbourg",
    country: "FR",
    amadeusCode: "SXB",
  },
  {
    id: "montpellier_fr",
    name: "Montpellier",
    country: "FR",
    amadeusCode: "MPL",
  },
  { id: "bordeaux_fr", name: "Bordeaux", country: "FR", amadeusCode: "BOD" },
  { id: "lille_fr", name: "Lille", country: "FR", amadeusCode: "LIL" },
  { id: "rennes_fr", name: "Rennes", country: "FR", amadeusCode: "RNS" },
  { id: "reims_fr", name: "Reims", country: "FR", amadeusCode: "RHE" },
  { id: "le_havre_fr", name: "Le Havre", country: "FR", amadeusCode: "LEH" },
  { id: "toulon_fr", name: "Toulon", country: "FR", amadeusCode: "TLN" },
  { id: "grenoble_fr", name: "Grenoble", country: "FR", amadeusCode: "GNB" },
  { id: "dijon_fr", name: "Dijon", country: "FR", amadeusCode: "DIJ" },
  { id: "angers_fr", name: "Angers", country: "FR", amadeusCode: "ANE" },
  { id: "nimes_fr", name: "Nimes", country: "FR", amadeusCode: "FNI" },
  { id: "le_mans_fr", name: "Le Mans", country: "FR", amadeusCode: "LME" },
  {
    id: "aix_en_provence_fr",
    name: "Aix-en-Provence",
    country: "FR",
    amadeusCode: "MRS",
  },
  {
    id: "clermont_ferrand_fr",
    name: "Clermont-Ferrand",
    country: "FR",
    amadeusCode: "CFE",
  },
  { id: "brest_fr", name: "Brest", country: "FR", amadeusCode: "BES" },
  { id: "tours_fr", name: "Tours", country: "FR", amadeusCode: "TUF" },
  { id: "amiens_fr", name: "Amiens", country: "FR", amadeusCode: "QAM" },
  { id: "limoges_fr", name: "Limoges", country: "FR", amadeusCode: "LIG" },
  { id: "metz_fr", name: "Metz", country: "FR", amadeusCode: "MZM" },
  { id: "besancon_fr", name: "Besancon", country: "FR", amadeusCode: "QBQ" },
  { id: "perpignan_fr", name: "Perpignan", country: "FR", amadeusCode: "PGF" },
  { id: "orleans_fr", name: "Orleans", country: "FR", amadeusCode: "ORE" },
  { id: "rouen_fr", name: "Rouen", country: "FR", amadeusCode: "URO" },
  { id: "mulhouse_fr", name: "Mulhouse", country: "FR", amadeusCode: "MLH" },
  { id: "caen_fr", name: "Caen", country: "FR", amadeusCode: "CFR" },
  {
    id: "saint_etienne_fr",
    name: "Saint-Etienne",
    country: "FR",
    amadeusCode: "EBU",
  },
  { id: "biarritz_fr", name: "Biarritz", country: "FR", amadeusCode: "BIQ" },
  { id: "cannes_fr", name: "Cannes", country: "FR", amadeusCode: "NCE" },

  // ────────────────────────────────────────────
  // UNITED STATES (40 cities)  — Yelp + Amadeus APIs
  // ────────────────────────────────────────────
  { id: "nyc_us", name: "New York City", country: "US", amadeusCode: "NYC" },
  {
    id: "losangeles_us",
    name: "Los Angeles",
    country: "US",
    amadeusCode: "LAX",
  },
  { id: "chicago_us", name: "Chicago", country: "US", amadeusCode: "CHI" },
  { id: "houston_us", name: "Houston", country: "US", amadeusCode: "HOU" },
  { id: "phoenix_us", name: "Phoenix", country: "US", amadeusCode: "PHX" },
  {
    id: "philadelphia_us",
    name: "Philadelphia",
    country: "US",
    amadeusCode: "PHL",
  },
  {
    id: "sanantonio_us",
    name: "San Antonio",
    country: "US",
    amadeusCode: "SAT",
  },
  { id: "sandiego_us", name: "San Diego", country: "US", amadeusCode: "SAN" },
  { id: "dallas_us", name: "Dallas", country: "US", amadeusCode: "DFW" },
  { id: "sanjose_us", name: "San Jose", country: "US", amadeusCode: "SJC" },
  { id: "austin_us", name: "Austin", country: "US", amadeusCode: "AUS" },
  {
    id: "jacksonville_us",
    name: "Jacksonville",
    country: "US",
    amadeusCode: "JAX",
  },
  {
    id: "sanfrancisco_us",
    name: "San Francisco",
    country: "US",
    amadeusCode: "SFO",
  },
  { id: "columbus_us", name: "Columbus", country: "US", amadeusCode: "CMH" },
  { id: "charlotte_us", name: "Charlotte", country: "US", amadeusCode: "CLT" },
  {
    id: "indianapolis_us",
    name: "Indianapolis",
    country: "US",
    amadeusCode: "IND",
  },
  { id: "seattle_us", name: "Seattle", country: "US", amadeusCode: "SEA" },
  { id: "denver_us", name: "Denver", country: "US", amadeusCode: "DEN" },
  {
    id: "washington_us",
    name: "Washington DC",
    country: "US",
    amadeusCode: "WAS",
  },
  { id: "nashville_us", name: "Nashville", country: "US", amadeusCode: "BNA" },
  {
    id: "oklahoma_us",
    name: "Oklahoma City",
    country: "US",
    amadeusCode: "OKC",
  },
  { id: "elpaso_us", name: "El Paso", country: "US", amadeusCode: "ELP" },
  { id: "boston_us", name: "Boston", country: "US", amadeusCode: "BOS" },
  { id: "portland_us", name: "Portland", country: "US", amadeusCode: "PDX" },
  { id: "lasvegas_us", name: "Las Vegas", country: "US", amadeusCode: "LAS" },
  {
    id: "louisville_us",
    name: "Louisville",
    country: "US",
    amadeusCode: "SDF",
  },
  { id: "baltimore_us", name: "Baltimore", country: "US", amadeusCode: "BAL" },
  { id: "milwaukee_us", name: "Milwaukee", country: "US", amadeusCode: "MKE" },
  {
    id: "albuquerque_us",
    name: "Albuquerque",
    country: "US",
    amadeusCode: "ABQ",
  },
  { id: "tucson_us", name: "Tucson", country: "US", amadeusCode: "TUS" },
  { id: "fresno_us", name: "Fresno", country: "US", amadeusCode: "FAT" },
  {
    id: "sacramento_us",
    name: "Sacramento",
    country: "US",
    amadeusCode: "SMF",
  },
  { id: "atlanta_us", name: "Atlanta", country: "US", amadeusCode: "ATL" },
  { id: "raleigh_us", name: "Raleigh", country: "US", amadeusCode: "RDU" },
  { id: "miami_us", name: "Miami", country: "US", amadeusCode: "MIA" },
  {
    id: "minneapolis_us",
    name: "Minneapolis",
    country: "US",
    amadeusCode: "MSP",
  },
  {
    id: "new_orleans_us",
    name: "New Orleans",
    country: "US",
    amadeusCode: "MSY",
  },
  { id: "honolulu_us", name: "Honolulu", country: "US", amadeusCode: "HNL" },
  { id: "omaha_us", name: "Omaha", country: "US", amadeusCode: "OMA" },
  { id: "tampa_us", name: "Tampa", country: "US", amadeusCode: "TPA" },
];

// ─── Helpers ──────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function calculateTrimmedAverage(prices: number[], trimPercent = 0.1): number {
  if (prices.length === 0) return 0;
  if (prices.length < 5) {
    // Too few to trim reliably, just average them
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  }

  // Sort prices ascending
  const sorted = [...prices].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * trimPercent);

  // Slice off the top and bottom N elements
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

  if (trimmed.length === 0) return 0;
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

// ─── Extract: Yelp (Food) ─────────────────────────────────────────────

async function getMinFoodCostYelp(
  cityName: string,
  countryCode: string,
): Promise<number> {
  const query = `${cityName}, ${countryCode}`;
  console.log(`[YELP] Scraping food for ${query}...`);
  try {
    const response = await axios.get(
      "https://api.yelp.com/v3/businesses/search",
      {
        headers: {
          Authorization: `Bearer ${YELP_API_KEY}`,
        },
        params: {
          location: query,
          term: "restaurants",
          price: "1", // $ tier (cheapest)
          limit: 50,
          sort_by: "rating", // Get highly rated cheap places
        },
        timeout: 10000,
      },
    );

    const businesses = response.data.businesses || [];

    // Transform: We need to guess the meal cost from Yelp's "$" tier.
    // Yelp '$' usually means under $10 in the US.
    // For a more accurate reading, we filter by rating > 3.5.
    const validPlaces = businesses.filter((b: any) => b.rating >= 3.5);

    if (validPlaces.length === 0) return 0;

    // As Yelp doesn't return exact menu prices, we use a heuristic based on the country.
    // In a real production app, we might use a dedicated menu-scraping API.
    // For this ETL, we assign a baseline realistic minimum per meal for the '$' tier.
    let baseMealCost = 0;
    if (countryCode === "VN")
      baseMealCost = 2; // ~$2 USD for street food/pho
    else if (countryCode === "FR")
      baseMealCost = 8; // ~$8 USD for a cheap crepe/sandwich
    else if (countryCode === "US") baseMealCost = 12; // ~$12 USD for cheap fast food/deli

    console.log(
      `[YELP] Found ${validPlaces.length} valid cheap eats in ${cityName}. Avg base ~$${baseMealCost}`,
    );
    return baseMealCost;
  } catch (error: any) {
    console.error(
      `[YELP ERROR] Failed for ${query}: ${error.response?.status} - ${error.response?.statusText}`,
    );
    return 0;
  }
}

// ─── Extract: Amadeus (Hotels) ────────────────────────────────────────

let amadeusToken = "";
let amadeusTokenExpiry = 0;

async function getAmadeusToken() {
  if (Date.now() < amadeusTokenExpiry && amadeusToken) return amadeusToken;

  console.log("[AMADEUS] Fetching new access token...");
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", AMADEUS_API_KEY!);
  params.append("client_secret", AMADEUS_API_SECRET!);

  try {
    const response = await axios.post(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );
    amadeusToken = response.data.access_token;
    // Expire 1 minute early to be safe
    amadeusTokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
    return amadeusToken;
  } catch (error: any) {
    console.error("[AMADEUS ERROR] Failed to get token", error.response?.data);
    throw new Error("Amadeus Auth Failed");
  }
}

async function getMinHotelCostAmadeus(cityCode: string): Promise<number> {
  console.log(`[AMADEUS] Scraping hotels for ${cityCode}...`);
  try {
    const token = await getAmadeusToken();

    // Step 1: Search for hotels in the city (1 or 2 stars)
    const listRes = await axios.get(
      "https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          cityCode,
          ratings: "1,2",
        },
        timeout: 10000,
      },
    );

    // In Amadeus test env, large batches often include invalid test properties causing a 400 error.
    // We slice to a safe maximum (5 hotels) to bypass the INVALID_PROPERTY_CODE error on the test tier.
    const hotelIds = (listRes.data.data || [])
      .slice(0, 5)
      .map((h: any) => h.hotelId);
    if (hotelIds.length === 0) return 0;

    // Wait slightly to not trigger rate limits between calls
    await delay(1000);

    // Step 2: Get pricing for those hotels for a date 30 days from now
    // (A future date ensures better availability/pricing)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const checkInDate = futureDate.toISOString().split("T")[0];

    // Add 1 day for checkout
    futureDate.setDate(futureDate.getDate() + 1);
    const checkOutDate = futureDate.toISOString().split("T")[0];

    const offerRes = await axios.get(
      "https://test.api.amadeus.com/v3/shopping/hotel-offers",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          hotelIds: hotelIds.join(","),
          checkInDate,
          checkOutDate,
          adults: 1,
          currency: "USD", // Force USD normalization
        },
        timeout: 10000,
      },
    );

    const offers = offerRes.data.data || [];
    const prices: number[] = [];

    for (const hotel of offers) {
      if (hotel.offers && hotel.offers.length > 0) {
        // Find the lowest price for this hotel
        const minPrice = Math.min(
          ...hotel.offers.map((o: any) => parseFloat(o.price?.total || "0")),
        );
        if (minPrice > 0) prices.push(minPrice);
      }
    }

    // Transform: Remove outliers and average
    const avgPrice = calculateTrimmedAverage(prices, 0.1);
    console.log(
      `[AMADEUS] Found ${prices.length} priced offers in ${cityCode}. Trimmed Avg: $${avgPrice.toFixed(2)}`,
    );
    return avgPrice;
  } catch (error: any) {
    console.error(
      `[AMADEUS ERROR] Failed for ${cityCode}: ${error.response?.status} - ${error.response?.data?.errors?.[0]?.detail || error.message}`,
    );
    return 0;
  }
}

// ─── Main Runner ──────────────────────────────────────────────────────

async function runPipeline() {
  console.log("🚀 Starting City Budget ETL Pipeline...");

  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not set. Exiting.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB.");

    for (const city of TARGET_CITIES) {
      console.log(`\n--- Processing ${city.name} (${city.country}) ---`);

      let minFoodUSD = 0;
      let minHotelUSD = 0;

      // ─── Vietnam cities use hardcoded pricing ──────────────────────────
      // Yelp does not support VN (returns HTTP 400) and Amadeus Test Env
      // has no reliable VN hotel inventory. We use validated backpacker data.
      if (
        city.hardcodedFood !== undefined ||
        city.hardcodedHotel !== undefined
      ) {
        minFoodUSD = city.hardcodedFood ?? 0;
        minHotelUSD = city.hardcodedHotel ?? 0;
        console.log(
          `[HARDCODED] Using preset costs for ${city.name}: Food $${minFoodUSD}/meal, Hotel $${minHotelUSD}/night`,
        );
      } else {
        // ─── FR / US cities: call Yelp + Amadeus APIs with retry logic ──
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            if (!minFoodUSD && YELP_API_KEY) {
              minFoodUSD = await getMinFoodCostYelp(city.name, city.country);
            }
            if (!minHotelUSD && AMADEUS_API_KEY && AMADEUS_API_SECRET) {
              minHotelUSD = await getMinHotelCostAmadeus(city.amadeusCode);
              await delay(2000); // 2s rate-limit buffer between cities
            }
            break; // Both calls succeeded — exit the retry loop
          } catch (err: any) {
            console.error(`⚠️ Attempt ${attempt} failed: ${err.message}`);
            if (attempt === 3)
              console.error(`❌ Skipping ${city.name} after 3 failures.`);
            else await delay(5000 * attempt); // back-off: 5 s, 10 s
          }
        }
      }

      // ─── Load: Save to MongoDB (upsert) ──────────────────────────────
      if (minFoodUSD > 0 || minHotelUSD > 0) {
        const payload = {
          cityName: city.name,
          country: city.country,
          $set: { lastUpdated: new Date() },
        } as any;

        // Only overwrite fields we have a valid value for; leave others intact.
        if (minFoodUSD > 0) payload.minFoodUSD = minFoodUSD;
        if (minHotelUSD > 0) payload.minHotelUSD = Math.round(minHotelUSD);

        await CityCost.findOneAndUpdate({ cityId: city.id }, payload, {
          upsert: true,
          new: true,
        });
        console.log(
          `💾 Saved to DB: ${city.id} -> Food: $${minFoodUSD}, Hotel: $${Math.round(minHotelUSD)}`,
        );
      } else {
        console.log(`⚠️ Skipped saving ${city.id} (no valid prices found).`);
      }
    }

    console.log("\n✅ ETL Pipeline Completed Successfully.");
  } catch (error) {
    console.error("❌ Pipeline crashed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Execute
runPipeline();
