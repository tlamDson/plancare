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
  readonly VITE_MAPBOX_ACCESS_TOKEN: string;

  /** Environment name */
  readonly VITE_ENV: "development" | "staging" | "production";

  /** Enable debug mode */
  readonly VITE_DEBUG?: string;

  /**
   * Show Google Calendar sync in production bundle (default off).
   */
  readonly VITE_ENABLE_GOOGLE_CALENDAR_SYNC?: string;

  /** Comma-separated VIP emails for Calendar sync UI (client-visible). */
  readonly VITE_VIP_EMAILS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
