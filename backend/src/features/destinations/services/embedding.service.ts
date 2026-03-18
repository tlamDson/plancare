import { GoogleGenAI } from "@google/genai";
import { env } from "../../../config/env";
import { logger } from "../../../lib/logger";

const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_DIMS = 768;

let client: GoogleGenAI | null = null;

/**
 * Lazy initialization of the GoogleGenAI client
 */
function getClient(): GoogleGenAI {
  if (!client) {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return client;
}

/**
 * Embed a single string into a 768-dim vector
 */
export async function embedText(text: string): Promise<number[]> {
  const ai = getClient();
  const res = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  });
  
  const embedding = res.embeddings?.[0]?.values;
  
  if (!embedding || embedding.length !== EMBEDDING_DIMS) {
    throw new Error(`Embedding failed or wrong dims: ${embedding?.length}`);
  }
  
  return embedding;
}

/**
 * Embed multiple strings into an array of vectors (batching)
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  const ai = getClient();
  const res = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: texts,
  });
  
  const embeddings = (res.embeddings ?? []).map((e) => e.values ?? []);
  
  if (embeddings.some((e) => e.length !== EMBEDDING_DIMS)) {
    throw new Error("Some embeddings have wrong dims");
  }
  
  return embeddings;
}

export { EMBEDDING_DIMS };
