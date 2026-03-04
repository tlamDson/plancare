import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../../config/env";
import { logger } from "../../../lib/logger";
import type { TripPreferences } from "@travelplan/shared";
import {
  buildTripPrompt,
  TRIP_PLANNER_SYSTEM_INSTRUCTION,
} from "../prompts/trip-generation.prompt";
import { intentParserService, type TripIntents } from "./intent-parser.service";

export class AIAgentService {
  private model: any;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      logger.warn("Gemini API key not configured, AI generation will fail");
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      this.model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        // System instruction = persona + rules (higher compliance than user turn)
        systemInstruction: TRIP_PLANNER_SYSTEM_INSTRUCTION,
      });
    } catch (error: any) {
      logger.error(
        { error: error.message },
        "Failed to initialize Gemini client",
      );
    }
  }

  async generateIntents(
    preferences: TripPreferences,
    language?: string,
    cityCost?: any,
  ): Promise<TripIntents> {
    if (!this.model) {
      logger.error(
        { hasApiKey: !!env.GEMINI_API_KEY },
        "❌ Gemini client not initialized - check GEMINI_API_KEY environment variable",
      );
      throw new Error(
        "Gemini client not initialized - GEMINI_API_KEY is missing or invalid",
      );
    }

    const prompt = buildTripPrompt(preferences, language, cityCost);

    logger.info(
      {
        destination: preferences.destination,
        budgetPerDay:
          prompt.match(/Budget: \$([0-9.]+)\/person\/day/)?.[1] || "unknown",
        promptCostContext: cityCost
          ? `Min ${cityCost.accommodationType ?? "any"}: ~$${cityCost.minHotelUSD}, Meals: ~$${cityCost.minFoodUSD}`
          : "None",
      },
      "🤖 Generating intents with Gemini (Prompt built)",
    );

    // 📌 LOG POINT: Print the exact text instructing Gemini on budgets so DEV can verify in terminal/docker
    logger.debug(
      { aiPrompt: prompt },
      "🔍 [DEV] Full AI Prompt generated (includes cost and budget instructions)",
    );

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();

      // 📌 LOG POINT A — full raw text from Gemini (before any parsing)
      logger.info(
        {
          responseLength: text.length,
          rawGeminiOutput: text, // full JSON string Gemini returned
        },
        "✅ [GEMINI RAW] Full response received",
      );

      const intents = intentParserService.parseIntents(text);

      // 📌 LOG POINT B — structured intents after parsing (day1/day2... → morning/afternoon/evening)
      logger.info(
        { parsedIntents: intents },
        "✅ [GEMINI PARSED] Structured intents (search queries per day/slot)",
      );

      return intents;
    } catch (error: any) {
      logger.error(
        { error: error.message, stack: error.stack },
        "❌ Gemini API call failed",
      );
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Called when validation yield < total slots needed.
  // Returns an array of raw search query strings (not day/slot structured).
  async generateSupplementaryQueries(
    count: number,
    destination: string,
    existingPlaceNames: string[],
  ): Promise<string[]> {
    if (!this.model) return [];

    const avoidList =
      existingPlaceNames.length > 0
        ? `Avoid suggesting: ${existingPlaceNames.slice(0, 20).join(", ")}.`
        : "";

    const prompt =
      `Generate exactly ${count} specific location search queries for places to visit in ${destination}. ` +
      `Each query must name a real district, landmark, or neighborhood in ${destination}. ` +
      `${avoidList} ` +
      `Return ONLY a valid JSON array of strings, no markdown, no explanation: ["query1", "query2", ...]`;

    try {
      const result = await this.model.generateContent(prompt);
      const text: string = result.response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const parsed: unknown = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) return [];

      return (parsed as unknown[])
        .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
        .slice(0, count);
    } catch (error: any) {
      logger.warn(
        { error: error.message, destination, count },
        "⚠️ Supplementary query generation failed — continuing without fill",
      );
      return [];
    }
  }

  async generateIntentsWithRetry(
    preferences: TripPreferences,
    language?: string,
    cityCost?: any,
    maxRetries = 4,
  ): Promise<TripIntents> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Wait before retrying (skip delay on first attempt)
        if (i > 0) {
          const waitMs = 2000 * i; // 2s, 4s, 6s
          logger.info({ attempt: i + 1, waitMs }, "⏳ Waiting before retry...");
          await this.delay(waitMs);
        }

        const intents = await this.generateIntents(
          preferences,
          language,
          cityCost,
        );

        if (intentParserService.isValidIntentFormat(intents)) {
          logger.info(
            { destination: preferences.destination, attempt: i + 1 },
            "Successfully generated valid intents",
          );
          return intents;
        }

        logger.warn({ attempt: i + 1 }, "Invalid intent format, retrying...");
      } catch (error: any) {
        const isRateLimit =
          error.message?.includes("429") ||
          error.message?.includes("Too Many Requests");

        logger.error(
          { attempt: i + 1, error: error.message, isRateLimit },
          "❌ AI generation attempt failed",
        );

        if (i === maxRetries - 1) {
          throw new Error(
            `AI failed to generate valid intents after ${maxRetries} attempts`,
          );
        }

        // Extra wait for rate limit errors
        if (isRateLimit) {
          const rateLimitWait = 3000;
          logger.info({ rateLimitWait }, "⏳ Rate limited, waiting extra...");
          await this.delay(rateLimitWait);
        }
      }
    }

    throw new Error("AI generation failed");
  }
}

export const aiAgentService = new AIAgentService();
