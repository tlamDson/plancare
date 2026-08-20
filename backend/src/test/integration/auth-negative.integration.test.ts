import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app";

const app = createApp();

// Table-driven guard against a route silently losing its requireUserAuth
// middleware. These groups (assistant, billing) call Gemini/Stripe once
// authenticated, so this 401-only check is the cheapest coverage that
// doesn't risk billing a real API — deeper cases belong in a dedicated file
// once those services are worth mocking end-to-end.
const authedRoutes: Array<["get" | "post" | "delete", string]> = [
  ["post", "/api/ai/sessions"],
  ["get", "/api/ai/sessions/placeholder-id"],
  ["delete", "/api/ai/sessions/placeholder-id"],
  ["post", "/api/ai/sessions/placeholder-id/messages"],
  ["post", "/api/ai/sessions/placeholder-id/stream"],
  ["get", "/api/ai/trips/000000000000000000000000/suggestions"],
  ["post", "/api/billing/create-checkout-session"],
  // /api/dev/* is NOT listed here: it's gated at the app.use() mount by
  // isDevRoutesEnabled() (env.NODE_ENV === "development"), so it 404s in the
  // "test" env this suite runs under rather than 401ing — see
  // misc-routes.integration.test.ts for its dedicated coverage.
];

describe("auth guard — requireUserAuth is present on every listed route", () => {
  it.each(authedRoutes)(
    "%s %s returns 401 without auth",
    async (method, path) => {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
    },
  );
});
