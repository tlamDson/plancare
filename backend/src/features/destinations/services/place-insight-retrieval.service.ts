import { PlaceInsight } from "../models/PlaceInsight";
import { embedText } from "./embedding.service";
import { resolveCityFromDestination, getCityInsight } from "./destination-lookup.service";
import { logger } from "../../../lib/logger";

const TOP_K = 10;

/**
 * Builds a search query string emphasizing the user's travel focus and constraints.
 */
function buildRetrievalQuery(
  destination: string,
  preferences: any // Typed loosely here since TripPreferences is in shared, could import if needed
): string {
  const parts: string[] = [destination];
  const focus = preferences.focus ?? [];
  
  if (focus.includes("Gastronomy")) parts.push("local food restaurants cafes culinary");
  if (focus.includes("Culture")) parts.push("museums history culture temples architecture");
  if (focus.includes("Nature")) parts.push("parks nature viewpoints outdoors scenery");
  if (focus.includes("Lifestyle")) parts.push("nightlife bars shopping local life");
  
  if (preferences.constraints?.foodAsMainActivities) parts.push("restaurants dining unique eats");
  
  // Example of using pace to influence verbosity
  if (preferences.pace === "Relaxed") parts.push("chill relaxing peaceful");
  
  return parts.join(" ");
}

/**
 * Performs a Semantic Vector Search (RAG) using MongoDB Atlas.
 * Retrieves top K places matching the user's trip preferences.
 */
export async function getRelevantPlaceInsights(
  destination: string,
  opts: {
    countryIdKey?: string;
    cityIdKey?: string;
    queryOverride?: string;
  },
  preferences: any
): Promise<string> {
  try {
    let { countryIdKey, cityIdKey } = opts;

    if (!cityIdKey && destination) {
      const resolved = await resolveCityFromDestination(destination);
      countryIdKey = resolved?.countryIdKey;
      cityIdKey = resolved?.cityIdKey;
    }

    if (!cityIdKey) return ""; // Cannot filter without a specific city

    const queryText = opts.queryOverride ?? buildRetrievalQuery(destination, preferences);
    
    // Embed the query using Gemini
    const queryVector = await embedText(queryText);

    // MongoDB Atlas $vectorSearch (requires Atlas M0+ and an active Search Index)
    const results = await PlaceInsight.aggregate([
      {
        $vectorSearch: {
          index: "placeinsights_vector_index",
          path: "embedding",
          queryVector,
          numCandidates: 100, // Search space
          limit: TOP_K,       // Final return size
          filter: { cityIdKey }, // Constrain search to this specific city
        },
      },
      { 
        $project: { 
          name: 1, 
          category: 1, 
          description: 1, 
          tags: 1,
          score: { $meta: "vectorSearchScore" },
          _id: 0 
        } 
      },
    ]);

    if (results.length === 0) {
      logger.info({ cityIdKey }, "Vector search returned no results, falling back to legacy insightText");
      const fallbackOpts = {
        ...(countryIdKey ? { countryIdKey } : {}),
        ...(cityIdKey ? { cityIdKey } : {})
      };
      return await getCityInsight(destination, fallbackOpts) ?? "";
    }

    // Format top places into a list for injecting into the LLM prompt
    const formatted = results
      .map((r, i) => `${i + 1}. ${r.name} (${r.category}): ${r.description}`)
      .join("\n");

    logger.info(
      { cityIdKey, resultCount: results.length, queryLen: queryText.length },
      "RAG: Vector search completed successfully"
    );

    return formatted;

  } catch (error) {
    logger.warn(
      { destination, error },
      "Vector search failed (Index might not be created or model failed). Falling back to legacy insightText."
    );
    const fallbackOpts = {
      ...(opts.countryIdKey ? { countryIdKey: opts.countryIdKey } : {}),
      ...(opts.cityIdKey ? { cityIdKey: opts.cityIdKey } : {})
    };
    return await getCityInsight(destination, fallbackOpts) ?? "";
  }
}
