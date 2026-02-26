# ETL Pipeline — Architecture & Upgrade Roadmap

## Current State (MVP)

The city budget pipeline (`backend/scripts/city-cost-scraper.ts`) uses a **hybrid data strategy**:

| Country    | Strategy         | Source                                        |
| ---------- | ---------------- | --------------------------------------------- |
| 🇻🇳 Vietnam | Static Hardcoded | Numbeo + Backpacker community data            |
| 🇫🇷 France  | Dynamic API      | Yelp Fusion API (food) + Amadeus API (hotels) |
| 🇺🇸 USA     | Dynamic API      | Yelp Fusion API (food) + Amadeus API (hotels) |

### Why Vietnam is hardcoded

**Yelp does not support Vietnam** — any request for a VN location returns `HTTP 400 Bad Request`. The Vietnamese market is not in Yelp's geographic database (no local team maintaining it). This is a known limitation called **Geographic Data Bias** — a common challenge in Data Engineering.

The hardcoded prices are embedded directly on each city object in `TARGET_CITIES` using two optional fields:

- `hardcodedFood?: number` — minimum meal cost in USD
- `hardcodedHotel?: number` — minimum hotel/hostel cost per night in USD

If either of these fields is present, the pipeline skips all external API calls and uses the static values directly. This is the **Static Fallback** pattern.

---

## Known Limitations

1. **VN prices never auto-refresh.** If the cost of living in Vietnam changes significantly, the values must be updated manually in `TARGET_CITIES`.
2. **No regional pricing differentiation.** Currently all cities in VN have flat hardcoded values. Tier 1 cities (Hanoi, HCMC) and Tier 3 rural cities currently differ in values but are not grouped systematically.
3. **No real API data for VN hotels.** Amadeus Test Env also returns errors for most VN city codes.

---

## Upgrade Roadmap

### Version 2 — Tier-based JSON Config (Recommended next step)

Instead of hardcoding prices on each city object, extract them into a separate config file `backend/config/vn_pricing_tiers.json`:

```json
{
  "tiers": {
    "tier1_megacity": {
      "label": "Mega Cities (Hanoi, Ho Chi Minh)",
      "minFoodUSD": 2.5,
      "minHotelUSD": 15
    },
    "tier2_tourist_hub": {
      "label": "Tourist Hubs (Da Nang, Hoi An, Phu Quoc)",
      "minFoodUSD": 3.0,
      "minHotelUSD": 18
    },
    "tier3_local": {
      "label": "Local / Rural (Da Lat, Ninh Binh, Sapa)",
      "minFoodUSD": 1.5,
      "minHotelUSD": 10
    }
  },
  "cityTierMap": {
    "hanoi_vn": "tier1_megacity",
    "hochiminh_vn": "tier1_megacity",
    "danang_vn": "tier2_tourist_hub",
    "hoian_vn": "tier2_tourist_hub",
    "phuquoc_vn": "tier2_tourist_hub",
    "dalat_vn": "tier3_local",
    "sapa_vn": "tier3_local"
  }
}
```

**Benefit:** Adding a new Vietnamese city requires only a one-line entry in the JSON map — no code changes needed.

---

### Version 2.5 — Foursquare API Integration for Vietnam

**Foursquare** has excellent venue data for Asia, including Vietnam.

- **Cost:** $200/month free credits (~40,000 requests/month at ~$0.005/call)
- **Actual VN usage:** ~30 cities × 1 run/month = **30 API calls** (< 0.01% of free quota)
- **Endpoint:** `GET https://api.foursquare.com/v3/places/search?near={city},Vietnam&categories=13000&price=1`
  - Category `13000` = Food & Drink
  - `price=1` = cheapest tier (equivalent to Yelp's `$`)

**Implementation steps:**

1. Add `FOURSQUARE_API_KEY` to GitHub Secrets and `.env`
2. Write `getFoursquareFoodCost(cityName)` function in the scraper
3. Route `VN` country through Foursquare instead of the static fallback

---

### Version 3 — Full Strategy Pattern (Production)

Implement a formal `DataRouter` that selects the best data source per country at runtime:

```typescript
// Pseudocode — future architecture
async function fetchCityCosts(city: CityConfig): Promise<CostResult> {
  switch (city.country) {
    case "VN":
      return FoursquareStrategy.fetch(city).catch(() =>
        StaticTierStrategy.fetch(city),
      );
    case "FR":
    case "US":
      return YelpAmadeusStrategy.fetch(city).catch(() =>
        GlobalFallbackStrategy.fetch(city),
      );
    default:
      return GlobalFallbackStrategy.fetch(city);
  }
}
```

**Architecture benefits:**

- **Fault Tolerance:** Each strategy has a fallback chain — the app never crashes if one API is down.
- **Easy to extend:** Adding Japan support = writing one new `JapanStrategy` class.
- **Testable:** Each strategy can be unit-tested in isolation with mocked API responses.

---

## Summary

| Phase                 | Effort | Impact                                             |
| --------------------- | ------ | -------------------------------------------------- |
| ✅ MVP (done)         | Low    | Covers all 105 cities with valid baseline data     |
| v2 — Tier JSON        | ~2h    | Easier maintenance, no more hardcoded prices       |
| v2.5 — Foursquare     | ~3h    | Real live data for Vietnam                         |
| v3 — Strategy Pattern | ~1 day | Full fault-tolerant, production-grade architecture |
