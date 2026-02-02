/// <reference types="vite/client" />

/**
 * Environment Variables Type Declarations
 *
 * Section 3.2: Type-safe environment variables
 */

interface ImportMetaEnv {
  /** API base URL */
  readonly VITE_API_URL: string;

  /** Clerk Publishable Key */
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;

  /** Mapbox Access Token */
  readonly VITE_MAPBOX_TOKEN: string;

  /** Environment name */
  readonly VITE_ENV: "development" | "staging" | "production";

  /** Enable debug mode */
  readonly VITE_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
