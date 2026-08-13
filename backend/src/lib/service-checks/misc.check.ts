import { interpretByStatus, runHttpCheck, skipped } from "./http-check";
import type { CheckResult, ServiceEnv } from "./types";

export async function checkMapbox(env: ServiceEnv): Promise<CheckResult> {
  const token = env.MAPBOX_ACCESS_TOKEN?.trim();
  if (!token) return skipped("Mapbox", "MAPBOX_ACCESS_TOKEN not set");

  return runHttpCheck({
    name: "Mapbox",
    url: `https://api.mapbox.com/geocoding/v5/mapbox.places/paris.json?limit=1&access_token=${encodeURIComponent(token)}`,
    interpret: interpretByStatus("token invalid or revoked"),
  });
}

export async function checkOpenWeather(env: ServiceEnv): Promise<CheckResult> {
  const key = (env.OPENWEATHER_API_KEY || env.VITE_OPENWEATHER_API_KEY)?.trim();
  if (!key) return skipped("OpenWeather", "OPENWEATHER_API_KEY not set");

  return runHttpCheck({
    name: "OpenWeather",
    url: `https://api.openweathermap.org/data/2.5/weather?q=Paris&appid=${encodeURIComponent(key)}`,
    interpret: interpretByStatus("API key invalid or not yet activated"),
  });
}

export async function checkSerper(env: ServiceEnv): Promise<CheckResult> {
  const key = env.SERPER_API_KEY?.trim();
  if (!key) return skipped("Serper (RAG scrape)", "SERPER_API_KEY not set");

  return runHttpCheck({
    name: "Serper (RAG scrape)",
    url: "https://google.serper.dev/search",
    init: {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q: "travelplan connectivity check", num: 1 }),
    },
    interpret: interpretByStatus("API key rejected"),
  });
}

export async function checkStripe(env: ServiceEnv): Promise<CheckResult> {
  const key = env.STRIPE_SECRET_KEY?.trim();
  if (!key) return skipped("Stripe", "STRIPE_SECRET_KEY not set");

  return runHttpCheck({
    name: "Stripe",
    url: "https://api.stripe.com/v1/balance",
    init: { headers: { Authorization: `Bearer ${key}` } },
    interpret: interpretByStatus("secret key invalid or revoked"),
  });
}
