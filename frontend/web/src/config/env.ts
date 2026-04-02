/**
 * Environment Configuration
 *
 * Section 4.2: Secrets Management
 * - No private keys in frontend (VITE_GEMINI_API_KEY must NEVER exist)
 * - Mapbox tokens are public but URL-restricted in dashboard
 */

// API Configuration
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const ENV = import.meta.env.VITE_ENV || "development";

// Clerk Authentication (Public Key)
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Mapbox (Public Token - URL restricted in Mapbox dashboard)
export const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN;

// OpenWeather (Public key usage on client for short-term forecast)
export const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
export const OPENWEATHER_BASE_URL =
  import.meta.env.VITE_OPENWEATHER_BASE_URL ||
  "https://api.openweathermap.org/data/2.5";

// Feature Flags
export const IS_DEV = ENV === "development";
export const IS_PROD = ENV === "production";
export const DEBUG = import.meta.env.VITE_DEBUG === "true";

/**
 * Google Calendar sync UI:
 * - **Vite dev** (`npm run dev`): shown by default for local testing.
 * - **Production build**: hidden unless `VITE_ENABLE_GOOGLE_CALENDAR_SYNC=true` (staging / rollout).
 * - Set `VITE_ENABLE_GOOGLE_CALENDAR_SYNC=false` to hide even in dev (optional).
 */
const calendarExplicitOff =
  import.meta.env.VITE_ENABLE_GOOGLE_CALENDAR_SYNC === "false";
const calendarExplicitOn =
  import.meta.env.VITE_ENABLE_GOOGLE_CALENDAR_SYNC === "true";
export const ENABLE_GOOGLE_CALENDAR_SYNC =
  !calendarExplicitOff && (import.meta.env.DEV || calendarExplicitOn);

// Validation: Fail fast if critical keys are missing
if (!CLERK_PUBLISHABLE_KEY && IS_PROD) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in production");
}
