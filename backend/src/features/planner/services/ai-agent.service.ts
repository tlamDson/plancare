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

  async generateIntents(preferences: TripPreferences): Promise<TripIntents> {
    if (!this.model) {
      logger.error(
        { hasApiKey: !!env.GEMINI_API_KEY },
        "❌ Gemini client not initialized - check GEMINI_API_KEY environment variable",
      );
      throw new Error(
        "Gemini client not initialized - GEMINI_API_KEY is missing or invalid",
      );
    }

    const prompt = buildTripPrompt(preferences);

    logger.info(
      { destination: preferences.destination },
      "🤖 Generating intents with Gemini",
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

  async generateIntentsWithRetry(
    preferences: TripPreferences,
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

        const intents = await this.generateIntents(preferences);

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
