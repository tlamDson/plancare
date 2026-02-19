import type { TripPreferences } from "@travelplan/shared";

function daysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function buildTripPrompt(preferences: TripPreferences): string {
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
    ? `The trip mood is "${mood}". Focus on activities that match this vibe.`
    : "";

  const prioritiesContext = priorities
    ? `Priorities: Money (${priorities.money}/10), Comfort (${priorities.comfort}/10), Unique Experiences (${priorities.unique}/10).`
    : "";

  const dealBreakersContext =
    dealBreakers && dealBreakers.length > 0
      ? `IMPORTANT: Avoid these: ${dealBreakers.join(", ")}.`
      : "";

  return `
You are a travel planner agent. Generate SEARCH QUERIES ONLY (not final facts).

**User Profile:**
- Destination: ${destination}
- Duration: ${days} days (${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()})
- Budget: $${budgetPerDay.toFixed(0)}/person/day
- Group: ${travelers.adults} adults${travelers.children > 0 ? `, ${travelers.children} children` : ""}
${moodContext}
${prioritiesContext}
${dealBreakersContext}

**Instructions:**
1. Create a day-by-day plan with SEARCH QUERIES for each time slot (morning, afternoon, evening)
2. Each query should be actionable and location-specific (e.g., "museum in Paris city center", NOT "visit a museum")
3. Respect the budget (if budget is low, suggest free or affordable activities)
4. Match the mood (romantic → cafes/sunset spots, adventure → hiking/water sports, foodie → local restaurants)
5. Consider the group composition (families need kid-friendly activities, couples need romantic spots)

**Output Format (JSON ONLY):**
\`\`\`json
{
  "day1": {
    "morning": "search query for morning activity",
    "afternoon": "search query for afternoon activity",
    "evening": "search query for evening activity"
  },
  "day2": {
    "morning": "search query",
    "afternoon": "search query",
    "evening": "search query"
  }
  // ... repeat for ${days} days
}
\`\`\`

**Important Rules:**
- Return ONLY the JSON object, no markdown code blocks, no explanations
- Use keys exactly as "day1", "day2", ... (lowercase, no spaces)
- Use time slots exactly as "morning", "afternoon", "evening"
- Each query must include the destination name or nearby landmark
- Queries should be specific enough to geocode (include neighborhood/district if possible)
- Prioritize activities that match the user's budget and mood

Generate the itinerary now:
`.trim();
}
