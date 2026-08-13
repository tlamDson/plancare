import { describe, it, expect, vi, afterEach } from "vitest";
import { firstCall, headersOf, stubFetchResponse } from "../../test/fetch-mock";
import {
  interpretGoogleResponse,
  checkGemini,
  checkGooglePlaces,
} from "./google.check";

afterEach(() => {
  vi.unstubAllGlobals();
});

const googleError = (status: number, errStatus: string, message: string) =>
  JSON.stringify({ error: { code: status, status: errStatus, message } });

describe("interpretGoogleResponse", () => {
  it("returns OK for a 2xx response", () => {
    expect(
      interpretGoogleResponse({ ok: true, httpStatus: 200, body: "{}" }).status,
    ).toBe("OK");
  });

  it("classifies an invalid API key (400 INVALID_ARGUMENT)", () => {
    const out = interpretGoogleResponse({
      ok: false,
      httpStatus: 400,
      body: googleError(
        400,
        "INVALID_ARGUMENT",
        "API key not valid. Please pass a valid API key.",
      ),
    });
    expect(out.status).toBe("FAIL");
    expect(out.detail).toContain("400");
    expect(out.detail).toContain("INVALID_ARGUMENT");
    expect(out.detail).toContain("API key not valid");
  });

  it("classifies a disabled service / restricted key (403)", () => {
    const out = interpretGoogleResponse({
      ok: false,
      httpStatus: 403,
      body: googleError(
        403,
        "PERMISSION_DENIED",
        "Places API has not been used in project 123",
      ),
    });
    expect(out.status).toBe("FAIL");
    expect(out.detail).toContain("403");
    expect(out.detail).toContain("PERMISSION_DENIED");
  });

  it("classifies quota exhaustion (429)", () => {
    const out = interpretGoogleResponse({
      ok: false,
      httpStatus: 429,
      body: googleError(429, "RESOURCE_EXHAUSTED", "Quota exceeded"),
    });
    expect(out.status).toBe("FAIL");
    expect(out.detail).toContain("429");
    expect(out.detail).toContain("Quota exceeded");
  });

  it("does not swallow an unparseable error body", () => {
    const out = interpretGoogleResponse({
      ok: false,
      httpStatus: 500,
      body: "<html>Internal Error</html>",
    });
    expect(out.status).toBe("FAIL");
    expect(out.detail).toContain("500");
  });

  it("truncates an absurdly long Google message instead of flooding the table", () => {
    const out = interpretGoogleResponse({
      ok: false,
      httpStatus: 403,
      body: googleError(403, "PERMISSION_DENIED", "x".repeat(500)),
    });
    expect(out.detail.length).toBeLessThan(220);
  });
});

describe("checkGemini", () => {
  it("SKIPs when GEMINI_API_KEY is absent", async () => {
    const result = await checkGemini({});
    expect(result.status).toBe("SKIP");
    expect(result.name).toContain("Gemini");
  });

  it("calls the models endpoint with the key and reports OK", async () => {
    const mock = stubFetchResponse(200, JSON.stringify({ models: [] }));

    const result = await checkGemini({ GEMINI_API_KEY: "k123" });

    expect(result.status).toBe("OK");
    expect(firstCall(mock).url).toContain("generativelanguage.googleapis.com");
    expect(firstCall(mock).url).toContain("k123");
  });

  it("reports FAIL with Google's own status when the key is disabled", async () => {
    stubFetchResponse(
      400,
      googleError(400, "INVALID_ARGUMENT", "API key not valid"),
    );
    const result = await checkGemini({ GEMINI_API_KEY: "dead" });
    expect(result.status).toBe("FAIL");
    expect(result.detail).toContain("INVALID_ARGUMENT");
  });
});

describe("checkGooglePlaces", () => {
  it("SKIPs when GOOGLE_PLACES_API_KEY is absent", async () => {
    expect((await checkGooglePlaces({})).status).toBe("SKIP");
  });

  it("POSTs a field-masked searchText request with the key in the header", async () => {
    const mock = stubFetchResponse(200, JSON.stringify({ places: [] }));

    const result = await checkGooglePlaces({ GOOGLE_PLACES_API_KEY: "pk123" });

    expect(result.status).toBe("OK");
    const { url, init } = firstCall(mock);
    expect(url).toContain("places.googleapis.com");
    expect(init.method).toBe("POST");
    expect(headersOf(init)["X-Goog-Api-Key"]).toBe("pk123");
    expect(headersOf(init)["X-Goog-FieldMask"]).toBeTruthy();
  });

  it("reports FAIL with the Google status when Places is disabled", async () => {
    stubFetchResponse(
      403,
      googleError(403, "PERMISSION_DENIED", "Places API has not been used"),
    );
    const result = await checkGooglePlaces({ GOOGLE_PLACES_API_KEY: "dead" });
    expect(result.status).toBe("FAIL");
    expect(result.detail).toContain("PERMISSION_DENIED");
  });
});
