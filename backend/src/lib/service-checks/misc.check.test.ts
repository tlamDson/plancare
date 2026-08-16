import { describe, it, expect, vi, afterEach } from "vitest";
import { firstCall, headersOf, stubFetchResponse } from "../../test/fetch-mock";
import {
  checkMapbox,
  checkOpenWeather,
  checkSerper,
  checkStripe,
} from "./misc.check";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("checkMapbox", () => {
  it("SKIPs without a token", async () => {
    expect((await checkMapbox({})).status).toBe("SKIP");
  });

  it("geocodes a known place and returns OK", async () => {
    const mock = stubFetchResponse(200, JSON.stringify({ features: [] }));
    const result = await checkMapbox({ MAPBOX_ACCESS_TOKEN: "pk.abc" });
    expect(result.status).toBe("OK");
    expect(firstCall(mock).url).toContain("api.mapbox.com");
  });

  it("reports a revoked token (401) as FAIL", async () => {
    stubFetchResponse(
      401,
      JSON.stringify({ message: "Not Authorized - Invalid Token" }),
    );
    const result = await checkMapbox({ MAPBOX_ACCESS_TOKEN: "pk.dead" });
    expect(result.status).toBe("FAIL");
    expect(result.detail).toContain("401");
  });

  it("does not echo the token back in the detail", async () => {
    stubFetchResponse(401);
    const result = await checkMapbox({
      MAPBOX_ACCESS_TOKEN: "pk.supersecrettoken",
    });
    expect(result.detail).not.toContain("supersecrettoken");
  });
});

describe("checkOpenWeather", () => {
  it("SKIPs without a key", async () => {
    expect((await checkOpenWeather({})).status).toBe("SKIP");
  });

  it("returns OK on 200", async () => {
    stubFetchResponse(200, JSON.stringify({ weather: [] }));
    expect((await checkOpenWeather({ OPENWEATHER_API_KEY: "k" })).status).toBe(
      "OK",
    );
  });

  it("reports an invalid key (401) as FAIL", async () => {
    stubFetchResponse(401);
    expect((await checkOpenWeather({ OPENWEATHER_API_KEY: "k" })).status).toBe(
      "FAIL",
    );
  });

  it("accepts VITE_OPENWEATHER_API_KEY as a fallback source", async () => {
    stubFetchResponse(200);
    const result = await checkOpenWeather({ VITE_OPENWEATHER_API_KEY: "k" });
    expect(result.status).toBe("OK");
  });
});

describe("checkSerper", () => {
  it("SKIPs without a key", async () => {
    expect((await checkSerper({})).status).toBe("SKIP");
  });

  it("POSTs a search with the X-API-KEY header", async () => {
    const mock = stubFetchResponse(200, JSON.stringify({ organic: [] }));
    const result = await checkSerper({ SERPER_API_KEY: "s3rp3r" });
    expect(result.status).toBe("OK");
    const { url, init } = firstCall(mock);
    expect(url).toContain("serper.dev");
    expect(init.method).toBe("POST");
    expect(headersOf(init)["X-API-KEY"]).toBe("s3rp3r");
  });

  it("reports a rejected key as FAIL", async () => {
    stubFetchResponse(403);
    expect((await checkSerper({ SERPER_API_KEY: "bad" })).status).toBe("FAIL");
  });
});

describe("checkStripe", () => {
  it("SKIPs without a key", async () => {
    expect((await checkStripe({})).status).toBe("SKIP");
  });

  it("reads the balance endpoint with a bearer token", async () => {
    const mock = stubFetchResponse(
      200,
      JSON.stringify({ object: "balance", livemode: false }),
    );
    const result = await checkStripe({ STRIPE_SECRET_KEY: "sk_test_x" });
    expect(result.status).toBe("OK");
    const { url, init } = firstCall(mock);
    expect(url).toContain("api.stripe.com");
    expect(headersOf(init).Authorization).toBe("Bearer sk_test_x");
  });

  it("reports an invalid key (401) as FAIL", async () => {
    stubFetchResponse(401);
    expect(
      (await checkStripe({ STRIPE_SECRET_KEY: "sk_test_bad" })).status,
    ).toBe("FAIL");
  });
});
