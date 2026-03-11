/**
 * Insight Scraper Service
 *
 * Fetches local search snippets for a city via Serper API and summarizes them
 * using Gemini to produce a 250-word "local guide" for injection into the AI prompt (RAG).
 */

import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../../config/env";
import { logger } from "../../../lib/logger";

const SERPER_URL = "https://google.serper.dev/search";

interface SerperOrganic {
  snippet?: string;
  [key: string]: unknown;
}

interface SerperResponse {
  organic?: SerperOrganic[];
}

export async function scrapeCityInsight(
  cityNameEn: string,
  countryNameEn: string,
): Promise<string | null> {
  const query = `top hidden gems, must try local food and unique experiences in ${cityNameEn} ${countryNameEn}`;

  logger.info(
    { city: cityNameEn, country: countryNameEn, query },
    "Fetching Serper search results",
  );

  const res = await axios.post<SerperResponse>(
    SERPER_URL,
    { q: query, num: 5 },
    { headers: { "X-API-KEY": env.SERPER_API_KEY } },
  );

  const snippets = (res.data?.organic ?? [])
    .slice(0, 5)
    .map((o) => o.snippet)
    .filter((s): s is string => Boolean(s));

  if (snippets.length === 0) {
    logger.warn(
      { city: cityNameEn },
      "No organic snippets returned from Serper",
    );
    return null;
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a travel expert. Summarize the following web snippets about ${cityNameEn}, ${countryNameEn} into a 250-300 word local guide for tourists. Focus on: hidden gems, must-try local foods, unique experiences, and practical tips from locals. Output plain text only, no markdown, no bullet points:\n\n${snippets.join("\n\n")}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text()?.trim();

  if (!text) {
    logger.warn({ city: cityNameEn }, "Gemini returned empty summary");
    return null;
  }

  logger.info(
    { city: cityNameEn, chars: text.length },
    "Insight text generated",
  );
  return text;
}
