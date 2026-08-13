import {
  runHttpCheck,
  skipped,
  truncate,
  type HttpVerdict,
} from "./http-check";
import type { CheckResult, ServiceEnv } from "./types";

const GEMINI_MODELS_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const PLACES_SEARCH_TEXT_URL =
  "https://places.googleapis.com/v1/places:searchText";

type GoogleErrorBody = {
  error?: { code?: number; status?: string; message?: string };
};

/**
 * Google's own `error.status` is the only reliable way to tell "key revoked"
 * (INVALID_ARGUMENT) from "API disabled / key restricted" (PERMISSION_DENIED)
 * from "billing or quota" (RESOURCE_EXHAUSTED) — so surface it verbatim rather
 * than collapsing everything into "request failed".
 */
export function interpretGoogleResponse({
  ok,
  httpStatus,
  body,
}: {
  ok: boolean;
  httpStatus: number;
  body: string;
}): HttpVerdict {
  if (ok) return { status: "OK", detail: `HTTP ${httpStatus}` };

  let parsed: GoogleErrorBody | null = null;
  try {
    parsed = JSON.parse(body) as GoogleErrorBody;
  } catch {
    parsed = null;
  }

  const googleStatus = parsed?.error?.status;
  const message = parsed?.error?.message;
  const parts = [`HTTP ${httpStatus}`];
  if (googleStatus) parts.push(googleStatus);
  if (message) parts.push(truncate(message, 120));
  if (!googleStatus && !message) parts.push(truncate(body, 80));

  return { status: "FAIL", detail: parts.join(" ").trim() };
}

export async function checkGemini(env: ServiceEnv): Promise<CheckResult> {
  const key = env.GEMINI_API_KEY?.trim();
  if (!key) return skipped("Gemini (AI)", "GEMINI_API_KEY not set");

  return runHttpCheck({
    name: "Gemini (AI)",
    url: `${GEMINI_MODELS_URL}?key=${encodeURIComponent(key)}`,
    interpret: interpretGoogleResponse,
  });
}

export async function checkGooglePlaces(env: ServiceEnv): Promise<CheckResult> {
  const key = env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) return skipped("Google Places", "GOOGLE_PLACES_API_KEY not set");

  return runHttpCheck({
    name: "Google Places",
    url: PLACES_SEARCH_TEXT_URL,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id",
      },
      body: JSON.stringify({ textQuery: "Eiffel Tower", maxResultCount: 1 }),
    },
    interpret: interpretGoogleResponse,
  });
}
