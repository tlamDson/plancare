import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../../config/env";
import { logger } from "../../../lib/logger";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMS = 3072; // gemini-embedding-001 outputs 3072 dimensions

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return genAI;
}

export async function embedText(text: string): Promise<number[]> {
  const ai = getClient();
  const model = ai.getGenerativeModel({ model: EMBEDDING_MODEL });
  
  const res = await model.embedContent(text);
  const embedding = res.embedding?.values;
  
  if (!embedding || embedding.length !== EMBEDDING_DIMS) {
    throw new Error(`Embedding failed or wrong dims: ${embedding?.length}`);
  }
  
  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  // gemini-embedding-001 supports single embedContent. Run in parallel.
  const embeddings = await Promise.all(
    texts.map(text => embedText(text))
  );
  
  return embeddings;
}

export { EMBEDDING_DIMS };
