# ETL Pipeline — Trade-off Mitigation Plan

> This document maps each known architectural trade-off of the City Budget ETL Pipeline
> to a concrete mitigation strategy, prioritized by implementation effort and user impact.

---

## Trade-off 1: Data Staleness (Độ trễ dữ liệu)

**Problem:** The bot runs twice a month. Between runs, the cached prices can be up to 29 days stale. Demand surges (concerts, holidays, F1 weekends) can triple hotel prices overnight, making the AI's budget estimates inaccurate.

### Mitigation Plan

| Priority         | Action                                                                                                                                                      | Effort  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| ✅ **Now (MVP)** | Add `lastUpdated` date to AI prompt context so the model explicitly knows how fresh the data is                                                             | ~30 min |
| ✅ **Now (MVP)** | Display `"Prices are estimates, last updated [date]"` disclaimer on Trip Detail page                                                                        | ~1h     |
| 🔵 **v2**        | Increase cron frequency from 2×/month to weekly (`0 2 * * 1`) for popular cities (Paris, NYC) only                                                          | ~30 min |
| 🔵 **v2**        | Add a `staleThresholdDays` field to `CityCost`. If `lastUpdated` exceeds threshold, AI prompt warns: `"Note: price data for this city is over X days old."` | ~2h     |

**Key insight for interviews:** Emphasize this is an _estimator_, not a _booking engine_. Users are planning trips, not buying tickets — a ±20% price delta is acceptable and expected.

---

## Trade-off 2: API Fragility (Phụ thuộc vào API bên thứ 3)

**Problem:** If Yelp or Amadeus changes their JSON schema, the ETL bot silently fails. Because it runs in the background on GitHub Actions, the failure may not be noticed until the data is months stale.

### Mitigation Plan

| Priority         | Action                                                                                                                                                                       | Effort  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| ✅ **Now (MVP)** | Enable GitHub Actions email notification on workflow failure (built-in, zero code needed — see setup below)                                                                  | ~10 min |
| 🔵 **v2**        | Add a post-run sanity check: if fewer than 50% of cities were saved, fail the workflow loudly                                                                                | ~1h     |
| 🔵 **v2**        | Wrap all API calls in a schema validator (e.g., check `typeof response.data.businesses === 'array'` before mapping). If schema mismatch, skip and log — never crash silently | ~2h     |
| 🟡 **v3**        | Write automated integration tests for the `extract` functions using recorded API responses (snapshot testing with `nock`)                                                    | ~1 day  |

**Setup email alerts in GitHub Actions (zero code):**

1. Go to your repo → **Settings** → **Notifications**
2. Under "Actions", enable "Send email for failed workflows"
3. Done — GitHub will email you anytime `data-pipeline.yml` fails.

---

## Trade-off 3: Granularity vs. Storage (Một giá không đủ cho mọi loại khách)

**Problem:** A single `minHotelUSD` value is too coarse. A solo backpacker in a hostel dorm and a family of 4 needing a private room have completely different floor prices. Using one number gives the AI the wrong budget context.

### Mitigation Plan

| Priority         | Action                                                                                                                                                                       | Effort  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| ✅ **Now (MVP)** | In the AI prompt, describe the current `minHotelUSD` as _"budget solo traveler (hostel/dorm)"_ so the model understands the context and scales up for families automatically | ~30 min |
| 🔵 **v2**        | Extend `CityCost` schema with a `costs` sub-document in place of flat fields                                                                                                 | ~2h     |
| 🔵 **v2**        | Update scraper to calculate tier-based costs from Amadeus data (1-star = solo budget, 3-star = couple, 4-star = family)                                                      | ~3h     |

**Target v2 MongoDB schema:**

```typescript
costs: {
  solo_budget: number; // hostel / 1-star (minHotelUSD current)
  couple_midrange: number; // 3-star, double room
  family_standard: number; // 3-4 star, family room/suite
}
```

**In `trip.processor.ts`**, select the tier based on `preferences.travelers`:

```typescript
const hotelBaseline =
  totalTravelers <= 1
    ? cityCost.costs.solo_budget
    : totalTravelers <= 2
      ? cityCost.costs.couple_midrange
      : cityCost.costs.family_standard;
```

---

## Trade-off 4: Cold Start Complexity (Gánh nặng thiết lập ban đầu)

**Problem:** The ETL pipeline adds setup overhead: GitHub Secrets management, YAML workflow authoring, separate API key provisioning (Yelp + Amadeus), and MongoDB upsert logic. This is extra cognitive load on the developer and extra failure surface area.

### Mitigation Plan

| Priority    | Action                                                                                                             | Status                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| ✅ **Done** | `backend/scripts/README.md` — step-by-step setup guide with exact commands                                         | ✅ Complete            |
| ✅ **Done** | `docs/technicalspecification/etl-pipeline-upgrade-roadmap.md` — architecture decisions documented                  | ✅ Complete            |
| ✅ **Done** | `.github/workflows/data-pipeline.yml` — cron automation so manual runs are never required                          | ✅ Complete            |
| 🔵 **v2**   | Add a `npm run pipeline:dry-run` script that validates API keys and DB connectivity without writing any data       | ~1h                    |
| 🔵 **v2**   | Add `workflow_dispatch` manual trigger to the GitHub Action so the team can re-run on demand without touching code | ✅ Already configured! |

---

## Summary Table

| Trade-off      | Severity | Mitigated at MVP?           | Full fix in |
| -------------- | -------- | --------------------------- | ----------- |
| Data Staleness | Medium   | ✅ Partial (disclaimer)     | v2          |
| API Fragility  | High     | ✅ Partial (email alerts)   | v2          |
| Granularity    | Low      | ✅ Partial (prompt context) | v2          |
| Cold Start     | High     | ✅ Complete (README + docs) | Done        |
