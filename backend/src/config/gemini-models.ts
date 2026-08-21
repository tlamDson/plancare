/**
 * Pinned, not "-latest" — verified 2026-08-15 by calling the real API with
 * this key (gemini-2.0-flash AND gemini-2.5-flash both returned a live 404
 * "no longer available"; gemini-3.6-flash was the newest non-preview flash
 * model this key could actually reach). Deliberately not `gemini-flash-latest`:
 * intent-parser.service's JSON extraction is fragile regex, not a real
 * parser (see `.claude/rules/tech-defaults.md`'s known `extractJson()` bug
 * with bare arrays) — an unannounced silent model swap changing output
 * formatting is a worse failure mode than a pinned model eventually
 * deprecating loudly. Re-verify with `npm run check:services` (note: that
 * only proves the API key is valid via the models-list endpoint, not that
 * this exact model string still resolves — a generateContent call, like
 * the one used to verify this pin, is the real test).
 *
 * Single source of truth — every Gemini generateContent call in the backend
 * imports this instead of hardcoding a model string. `ai-agent.service.ts`
 * used to own this constant privately; `insight-scraper.service.ts` had its
 * own hardcoded `"gemini-2.0-flash"` that the original fix missed entirely,
 * so every RAG scraping job was silently 404ing. Centralizing it here is
 * what makes that class of miss structurally impossible going forward.
 */
export const GEMINI_MODEL = "gemini-3.6-flash";
