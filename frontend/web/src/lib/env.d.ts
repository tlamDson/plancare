/**
 * Environment Variables Type Definitions
 *
 * Section 4.2: Secrets Management
 * - Provides type safety for import.meta.env
 * - NEVER expose API keys to client-side code
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  // ============================================
  // API Configuration
  // ============================================

  /** Backend API URL */
  readonly VITE_API_URL: string;

  /** API request timeout in ms */
  readonly VITE_API_TIMEOUT?: string;

  // ============================================
  // Feature Flags
  // ============================================

  /** Enable debug mode */
  readonly VITE_DEBUG?: string;

  /** Enable mock API responses */
  readonly VITE_MOCK_API?: string;

  // ============================================
  // Third-Party Services (PUBLIC KEYS ONLY)
  // Never expose secret keys!
  // ============================================

  /** Mapbox public access token */
  readonly VITE_MAPBOX_TOKEN?: string;

  /** Clerk publishable key (public) */
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;

  // ============================================
  // FORBIDDEN - NEVER ADD THESE:
  // - VITE_OPENAI_API_KEY
  // - VITE_AWS_SECRET_KEY
  // - Any private/secret keys
  // Backend should handle all secret operations
  // ============================================
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
