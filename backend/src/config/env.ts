import { cleanEnv, str, port, url } from "envalid";
import dotenv from "dotenv";

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "test", "production"],
    default: "development",
  }),
  PORT: port({ default: 3000 }),
  MONGO_URI: str({ desc: "MongoDB Connection String" }),
  CLERK_SECRET_KEY: str({ desc: "Clerk Secret Key" }),
  CLERK_WEBHOOK_SIGNING_SECRET: str({ desc: "Clerk Webhook Signing Secret" }),
  REDIS_HOST: str({ default: "localhost" }),
  REDIS_PORT: port({ default: 6379 }),
  REDIS_PASSWORD: str({ desc: "Redis Password", default: "" }), // Optional for local dev
  /** If set (e.g. Railway `redis://...`), overrides REDIS_HOST/PORT/PASSWORD for connection. Use `redis://` (plain) or `rediss://` (TLS). */
  REDIS_URL: str({ default: "" }),
  /** Empty = autodetect (TLS for Upstash-style hosts; plain TCP for Docker `redis`, localhost, railway.internal). Set "true"/"false" to override. */
  REDIS_TLS: str({ default: "" }),
  GEMINI_API_KEY: str({ desc: "Gemini API Key — required for Worker service" }), // Fail Fast: crash if missing
  MAPBOX_ACCESS_TOKEN: str({ desc: "Mapbox Access Token", default: "" }), // Week 3
  GOOGLE_PLACES_API_KEY: str({ desc: "Google Places API Key", default: "" }), // Week 3
  FRONTEND_URL: str({
    desc: "Frontend URL for CORS and redirects",
    default: "http://localhost:5173",
  }),
  /** Comma-separated extra browser origins allowed by CORS (e.g. alternate domains). */
  CORS_ALLOWED_ORIGINS: str({ default: "" }),
  STRIPE_SECRET_KEY: str({ desc: "Stripe Secret Key", default: "" }),
  STRIPE_WEBHOOK_SECRET: str({
    desc: "Stripe Webhook Secret for Local Dev",
    default: "",
  }),
  SERPER_API_KEY: str({
    desc: "Serper.dev API Key for local insight scraping (RAG)",
    default: "",
  }),
  /** When "true", POST /trips/:id/sync-calendar is allowed. When unset in production, calendar sync is off. */
  ENABLE_GOOGLE_CALENDAR_SYNC: str({ default: "" }),
  /**
   * Comma-separated emails allowed to sync (production). Empty in production = no one.
   * Empty in development = all users allowed (convenience).
   */
  VIP_EMAILS: str({ default: "" }),
  /** OpenWeather API key (server-only). Used by GET /api/weather/forecast proxy. */
  OPENWEATHER_API_KEY: str({ default: "" }),
  /** Override OpenWeather API base (default https://api.openweathermap.org/data/2.5) */
  OPENWEATHER_BASE_URL: str({ default: "" }),
});
