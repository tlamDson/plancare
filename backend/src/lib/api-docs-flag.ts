import { env } from "../config/env";

/**
 * Swagger UI (`/api/docs`) is available in development and test, but never
 * in production — the spec has no auth of its own and previously had no env
 * gate at all.
 */
export function isApiDocsEnabled(): boolean {
  return env.NODE_ENV !== "production";
}
