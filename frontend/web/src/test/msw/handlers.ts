import { http, HttpResponse } from "msw";

/**
 * Default MSW handlers shared across tests. Individual tests override with
 * `server.use(...)` for scenario-specific responses (see MSW docs on
 * request handler overrides). Keep this list minimal — only endpoints
 * hit by more than one test suite belong here.
 */
export const handlers = [
  http.get("*/health", () => HttpResponse.json({ status: "ok" })),
];
