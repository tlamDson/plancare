import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * [Guard] gemini-2.0-flash returns a real, live 404 as of 2026-08-15
 * (verified with a real API call, not just a stale doc note):
 *   { "error": { "code": 404, "status": "NOT_FOUND",
 *     "message": "This model models/gemini-2.0-flash is no longer
 *     available. ... use a newer model ..." } }
 * Every trip generation attempt was failing all 4 retries and silently
 * falling back to the static template — jobs still reported "COMPLETED"
 * with no AI involved. gemini-2.5-flash was also dead ("no longer
 * available to new users") — gemini-3.6-flash was the newest non-preview
 * flash model this key could actually reach (verified with a real
 * generateContent call, not just the models-list endpoint). Pins the
 * model string so this can't regress unnoticed the way the original
 * deprecation did.
 */

const getGenerativeModel = vi.fn().mockReturnValue({});

vi.mock("@google/generative-ai", () => ({
  // `new GoogleGenerativeAI(...)` requires a real constructor — an arrow
  // function passed to mockImplementation isn't one.
  GoogleGenerativeAI: vi.fn().mockImplementation(function GoogleGenerativeAI() {
    return { getGenerativeModel };
  }),
}));

describe("AIAgentService model selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes both models with a currently-supported Gemini model, not the dead gemini-2.0-flash", async () => {
    const { AIAgentService } = await import("./ai-agent.service");
    // The module also constructs a module-level singleton
    // (`export const aiAgentService = new AIAgentService()`) at import
    // time — drop those calls so this assertion only covers the instance
    // this test controls, regardless of import/caching order.
    getGenerativeModel.mockClear();
    new AIAgentService();

    const usedModels = getGenerativeModel.mock.calls.map(
      (call) => (call[0] as { model: string }).model,
    );

    expect(usedModels).not.toContain("gemini-2.0-flash");
    expect(usedModels).not.toContain("gemini-2.5-flash");
    expect(usedModels).toEqual(["gemini-3.6-flash", "gemini-3.6-flash"]);
  });
});
