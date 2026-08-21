import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

/**
 * [Guard] `insight-scraper.service.ts` hardcoded its own copy of the model
 * string instead of importing the shared `GEMINI_MODEL` pin from
 * `config/gemini-models.ts` — so when `gemini-2.0-flash` was confirmed dead
 * (404, see `ai-agent.service.test.ts`) and fixed in `ai-agent.service.ts`,
 * this file kept calling the dead model. Every RAG scraping job was
 * silently producing zero entities (`extractCityEntities` swallows the
 * Gemini error per-theme and just logs a warning), which meant
 * `PlaceInsight` never got populated — discovered while building the eval
 * harness in `.claude/plans/1-rag-eval-eventual-hickey.md`. Pins to the
 * shared constant so this can't drift out of sync again.
 */

vi.mock("axios");

const getGenerativeModel = vi.fn().mockReturnValue({
  generateContent: vi.fn().mockResolvedValue({
    response: { text: () => "[]" },
  }),
});

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function GoogleGenerativeAI() {
    return { getGenerativeModel };
  }),
}));

describe("insight-scraper.service model selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.post).mockResolvedValue({
      data: { organic: [{ snippet: "A great place to visit." }] },
    });
  });

  it("calls Gemini with the shared pinned model, not the dead gemini-2.0-flash", async () => {
    const { extractCityEntities } = await import("./insight-scraper.service");

    await extractCityEntities("Hanoi", "Vietnam");

    const usedModels = getGenerativeModel.mock.calls.map(
      (call) => (call[0] as { model: string }).model,
    );

    expect(usedModels.length).toBeGreaterThan(0);
    expect(usedModels).not.toContain("gemini-2.0-flash");
    expect(usedModels).not.toContain("gemini-2.5-flash");
    expect(usedModels.every((m) => m === "gemini-3.6-flash")).toBe(true);
  });
});
