/**
 * Environment Configuration
 *
 * Section 4.2: Secrets Management
 * - No private keys in frontend (VITE_OPENAI_KEY must NEVER exist)
 * - Mapbox tokens are public but URL-restricted in dashboard
 */

// API Configuration
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const ENV = import.meta.env.VITE_ENV || "development";

// Clerk Authentication (Public Key)
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Mapbox (Public Token - URL restricted in Mapbox dashboard)
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Feature Flags
export const IS_DEV = ENV === "development";
export const IS_PROD = ENV === "production";
export const DEBUG = import.meta.env.VITE_DEBUG === "true";

// Validation: Fail fast if critical keys are missing
if (!CLERK_PUBLISHABLE_KEY && IS_PROD) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in production");
}
