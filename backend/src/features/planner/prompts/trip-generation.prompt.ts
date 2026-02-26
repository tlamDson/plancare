import type { TripPreferences } from "@travelplan/shared";

function daysBetween(startDate: string | Date, endDate: string | Date): number {
  // Strip time component — compare calendar days only (inclusive both ends).
  // e.g. startDate=Feb 19, endDate=Feb 21 → 3 travel days (19, 20, 21)
  const startStr = new Date(startDate).toISOString().slice(0, 10);
  const endStr = new Date(endDate).toISOString().slice(0, 10);
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays =
    (new Date(endStr).getTime() - new Date(startStr).getTime()) / msPerDay;
  return Math.round(diffDays) + 1; // +1: both start AND end are travel days
}

/**
 * Static system instruction — defines the AI's persona, rules, and output schema.
 * Passed as `systemInstruction` to getGenerativeModel so the model treats it
 * with higher priority than the user turn.
 */
export const TRIP_PLANNER_SYSTEM_INSTRUCTION = `
You are a travel planner agent. Your ONLY job is to output a JSON object of location search queries.

RULES (follow exactly):
- Return ONLY a valid JSON object — no markdown, no code fences, no explanations, no comments.
- Keys must be exactly "day1", "day2", etc. (lowercase, no spaces).
- Each day must have exactly three slots: "morning", "afternoon", "evening".
- Every query must be actionable and location-specific (e.g., "best rooftop bar Midtown Manhattan New York").
- Never use vague queries like "visit a museum" — always include a city, district, or landmark.
- You MUST include every day key the user requests. Do NOT stop early.
`.trim();

/**
 * Dynamic user message — contains only the trip-specific variables.
 * Kept intentionally short since the system instruction carries the heavy rules.
 */
export function buildTripPrompt(
  preferences: TripPreferences,
  language?: string,
  cityCost?: any,
): string {
  const {
    destination,
    startDate,
    endDate,
    budget,
    travelers,
    mood,
    priorities,
    dealBreakers,
  } = preferences;

  const days = daysBetween(startDate, endDate);
  const totalTravelers = travelers.adults + travelers.children;
  const budgetPerDay = budget.total / days / totalTravelers;

  const moodContext = mood
    ? `Mood: "${mood}" — prioritise activities that match this vibe.`
    : "";

  const prioritiesContext = priorities
    ? `Priorities: Money (${priorities.money}/10), Comfort (${priorities.comfort}/10), Unique (${priorities.unique}/10).`
    : "";

  const dealBreakersContext =
    dealBreakers && dealBreakers.length > 0
      ? `Avoid: ${dealBreakers.join(", ")}.`
      : "";

  // Map accommodation type to human-readable label for the AI context
  const ACCOMMODATION_LABEL: Record<string, string> = {
    hostel: "hostel / dorm bed",
    airbnb: "Airbnb / private apartment",
    hotel: "budget hotel",
    resort: "resort / full-service hotel",
    any: "budget accommodation",
  };
  const accomType = (cityCost as any)?.accommodationType ?? "any";
  const accomLabel = ACCOMMODATION_LABEL[accomType] ?? "budget accommodation";

  // Format lastUpdated for a human-readable freshness note
  const lastUpdatedStr = (cityCost as any)?.lastUpdated
    ? new Date((cityCost as any).lastUpdated).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const baseCostContext = cityCost
    ? `\nBase Costs for ${cityCost.cityName} (prices as of ${lastUpdatedStr ?? "recent estimate"}):` +
      ` Minimum ~$${cityCost.minHotelUSD}/night for ${accomLabel} and ~$${cityCost.minFoodUSD}/meal.` +
      ` Balance the itinerary budget around these localized floor prices.`
    : "";

  // Expand all N day keys explicitly — never use "// repeat for N days"
  // because the AI stops at whatever example it sees.
  const daySkeletonLines = Array.from({ length: days }, (_, i) => {
    const n = i + 1;
    return `  "day${n}": {
    "morning": "search query for day ${n} morning activity in ${destination}",
    "afternoon": "search query for day ${n} afternoon activity in ${destination}",
    "evening": "search query for day ${n} evening activity in ${destination}"
  }`;
  }).join(",\n");

  const languageInstruction = language
    ? `CRITICAL: You MUST write the location search queries entirely in ${language}.`
    : "";

  return `
Trip details:
- Destination: ${destination}
- Dates: ${new Date(startDate).toLocaleDateString()} → ${new Date(endDate).toLocaleDateString()} (${days} days)
- Budget: $${budgetPerDay.toFixed(0)}/person/day — factor this into query types (e.g. "free", "budget-friendly", "luxury")
- Group: ${travelers.adults} adult${travelers.adults !== 1 ? "s" : ""}${travelers.children > 0 ? `, ${travelers.children} child${travelers.children !== 1 ? "ren" : ""}` : ""}
${moodContext}
${prioritiesContext}
${dealBreakersContext}${baseCostContext}

CRITICAL: You MUST output exactly ${days} day entries (day1 through day${days}). Do NOT stop early.
${languageInstruction}

Replace every placeholder with a real query. Return ALL ${days} keys:
{
${daySkeletonLines}
}
`.trim();
}
