import type { TripPreferences } from "@travelplan/shared";
import { PACE_CONFIG } from "../config/trip-pace.config";

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
- Group activities geographically. All activities within the same day MUST be located in the same neighborhood or reasonably close to each other to minimize travel distance.
- Each day must have structured slots like "morning", "afternoon", "evening".
- Every query must be actionable and location-specific (e.g., "best rooftop bar Midtown Manhattan New York").
- Never use vague queries like "visit a museum" — always include a city, district, or landmark.
- CRITICAL: Do NOT suggest activities that are in a different city from the destination. For example, if destination is "Hanoi", do NOT suggest "Halong Bay tour", "Sapa trip", or any day trip that requires leaving the city. Only suggest things TO DO IN THE DESTINATION CITY ITSELF.
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
  } = preferences;

  const days = daysBetween(startDate, endDate);
  const totalTravelers = travelers.adults + travelers.children;
  const budgetPerDay = budget.total / days / totalTravelers;

  const dealBreakersContext =
    preferences.dealBreakers && preferences.dealBreakers.length > 0
      ? `Avoid (legacy): ${preferences.dealBreakers.join(", ")}.`
      : "";

  // ─── Pace ──────────────────────────────────────────────────────────────
  const pace = preferences.pace ?? "balanced";
  const paceConfig = PACE_CONFIG[pace];
  const activitiesPerDay = paceConfig.activitiesPerDay;

  // ─── Focus → slot pattern ───────────────────────────────────────────────
  type SlotPattern = { m: string; a: string; e: string };
  const FOCUS_SLOT_MAP: Record<string, SlotPattern> = {
    Culture: {
      m: "museum or historical site",
      a: "art gallery or heritage walk",
      e: "cultural show or local dinner",
    },
    Nature: {
      m: "park, beach, or trail entrance",
      a: "viewpoint or nature activity",
      e: "seafood or dinner near nature area",
    },
    Gastronomy: {
      m: "local market or street food area",
      a: "landmark or attraction (NOT a restaurant)",
      e: "restaurant or rooftop bar",
    },
    Lifestyle: {
      m: "boutique shopping street",
      a: "wellness/spa or local experience",
      e: "bar or nightlife venue",
    },
  };

  const focus = preferences.focus ?? [];
  const constraints = preferences.constraints ?? {};

  // Softened Nature slots when mobility_friendly is set
  if (constraints.mobility_friendly && focus.includes("Nature")) {
    FOCUS_SLOT_MAP["Nature"] = {
      m: "scenic viewpoint accessible by car or cable car",
      a: "nature café or pavilion with scenic view",
      e: "dinner near nature area",
    };
  }

  // Build slot skeleton driven by focus (round-robin if multiple, fallback to city_break)
  type SlotKey = "m" | "a" | "e";
  const focusList = focus.length > 0 ? focus : ["Culture"];
  const slotOrder: SlotKey[] = ["m", "a", "e"];

  // Build per-day slot instructions (rotating through focus areas)
  const buildSlotLine = (
    slot: string,
    slotIdx: number,
    dayN: number,
  ): string => {
    const focusForSlot = focusList[slotIdx % focusList.length]!;
    const pattern = FOCUS_SLOT_MAP[focusForSlot]!;
    const slotKey = slotOrder[slotIdx % 3]!;
    const descriptor = pattern[slotKey];
    // Apply constraints as suffix filters
    const filters: string[] = [];
    if (constraints.avoid_crowds)
      filters.push("avoid tourist traps and crowded areas");
    if (constraints.no_street_food && descriptor.includes("street food")) {
      // Replace street food descriptor with restaurant
      return `    "${slot}": "[day ${dayN}] restaurant or café IN ${destination}${filters.length ? ` — ${filters.join(", ")}` : ""}"`;
    }
    if (constraints.indoor_only) filters.push("indoor venues only");
    const filterSuffix = filters.length ? ` — ${filters.join(", ")}` : "";
    return `    "${slot}": "[day ${dayN}] ${descriptor} IN ${destination}${filterSuffix}"`;
  };

  // ─── Constraints text block ─────────────────────────────────────────────
  const constraintLines: string[] = [];
  if (constraints.mobility_friendly)
    constraintLines.push(
      "All locations MUST be within 800m walking distance or accessible by short taxi/cable car.",
    );
  if (constraints.avoid_crowds)
    constraintLines.push(
      "Focus on hidden gems and quiet neighborhoods. AVOID peak-hour tourist traps.",
    );
  if (constraints.start_late)
    constraintLines.push(
      "Schedule MUST start after 10:00 AM. No early morning activities.",
    );
  if (constraints.indoor_only)
    constraintLines.push(
      "All activities must be indoors (museums, galleries, malls). No outdoor walks.",
    );
  if (constraints.no_street_food)
    constraintLines.push(
      "No street stalls or outdoor markets. Use restaurants and cafés instead.",
    );
  if (constraints.no_late_nights)
    constraintLines.push(
      "Evening activities must end before 22:00. No late-night bars or clubs.",
    );
  const constraintsBlock =
    constraintLines.length > 0
      ? `Constraints (MUST follow):\n${constraintLines.map((l) => `- ${l}`).join("\n")}`
      : "";

  // ─── Special requirements ───────────────────────────────────────────────
  const specialReqBlock = preferences.specialRequirements?.trim()
    ? `CRITICAL special requirements from traveler: "${preferences.specialRequirements}"\nYou MUST respect this requirement in EVERY query. Override conflicting suggestions.`
    : "";

  // Transport mode context
  const transportMode = preferences.transportMode ?? "walking";
  const TRANSPORT_DISTANCE_RULE: Record<string, string> = {
    walking:
      "Transport: WALKING — all activities within 1.5 km of each other. Same neighborhood only.",
    public_transport:
      "Transport: PUBLIC TRANSIT — same district or connected by a single metro/bus line.",
    car: "Transport: CAR — logical driving route. Up to 15-20 km between activities acceptable.",
  };
  const transportContext =
    TRANSPORT_DISTANCE_RULE[transportMode] ??
    TRANSPORT_DISTANCE_RULE["walking"];

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
      ` Minimum ~$${cityCost.minHotelUSD}/night for ${accomLabel} and ~$${cityCost.minFoodUSD}/meal.`
    : "";
  const slotLabels =
    activitiesPerDay <= 2
      ? ["morning", "evening"]
      : activitiesPerDay === 3
        ? ["morning", "afternoon", "evening"]
        : activitiesPerDay === 4
          ? ["morning", "late morning", "afternoon", "evening"]
          : activitiesPerDay === 5
            ? [
                "morning",
                "late morning",
                "afternoon",
                "late afternoon",
                "evening",
              ]
            : [
                "morning",
                "late morning",
                "afternoon",
                "late afternoon",
                "evening",
                "night",
              ];

  const daySkeletonLines = Array.from({ length: days }, (_, i) => {
    const n = i + 1;
    const slotLines = slotLabels
      .map((slot, slotIdx) => buildSlotLine(slot, slotIdx, n))
      .join(",\n");
    return `  "day${n}": {\n${slotLines}\n  }`;
  }).join(",\n");

  const languageInstruction = language
    ? `CRITICAL: You MUST write the location search queries entirely in ${language}.`
    : "";

  const moodContext = preferences.mood
    ? `Legacy mood hint: "${preferences.mood}" — blend this vibe into focus selections.`
    : "";
  const prioritiesContext = priorities
    ? `Priorities: Money (${priorities.money}/10), Comfort (${priorities.comfort}/10), Unique (${priorities.unique}/10).`
    : "";

  return `
Trip details:
- Destination: ${destination}
- Dates: ${new Date(startDate).toLocaleDateString()} → ${new Date(endDate).toLocaleDateString()} (${days} days)
- Budget: $${budgetPerDay.toFixed(0)}/person/day
- Group: ${travelers.adults} adult${travelers.adults !== 1 ? "s" : ""}${travelers.children > 0 ? `, ${travelers.children} child${travelers.children !== 1 ? "ren" : ""}` : ""}
- ${paceConfig.paceInstruction}
- ${transportContext}
${prioritiesContext}
${moodContext}
${dealBreakersContext}
${constraintsBlock}
${specialReqBlock}
${baseCostContext}

CRITICAL: You MUST output exactly ${days} day entries (day1 through day${days}). Do NOT stop early.
CRITICAL: Do NOT suggest any location outside ${destination} city.
${languageInstruction}

Replace every placeholder with a real, specific query. Follow the slot descriptors exactly. Return ALL ${days} keys:
{
${daySkeletonLines}
}
`.trim();
}
