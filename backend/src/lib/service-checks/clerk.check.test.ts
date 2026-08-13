import { describe, it, expect, vi, afterEach } from "vitest";
import { firstCall, headersOf, stubFetchResponse } from "../../test/fetch-mock";
import {
  parsePublishableKey,
  detectClerkInstanceMismatch,
  interpretClerkResponse,
  checkClerk,
} from "./clerk.check";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Clerk encodes `<frontend-api-host>$` as base64 in the publishable key suffix. */
const makePublishableKey = (kind: "test" | "live", host: string) =>
  `pk_${kind}_${Buffer.from(`${host}$`).toString("base64")}`;

describe("parsePublishableKey", () => {
  it("extracts the instance type and frontend API host from a test key", () => {
    const pk = makePublishableKey("test", "example.clerk.accounts.dev");
    expect(parsePublishableKey(pk)).toEqual({
      instanceType: "test",
      frontendApi: "example.clerk.accounts.dev",
    });
  });

  it("extracts a live key's frontend API host", () => {
    const pk = makePublishableKey("live", "clerk.travelplan.app");
    expect(parsePublishableKey(pk)).toEqual({
      instanceType: "live",
      frontendApi: "clerk.travelplan.app",
    });
  });

  it("returns null for a missing or malformed key", () => {
    expect(parsePublishableKey(undefined)).toBeNull();
    expect(parsePublishableKey("")).toBeNull();
    expect(parsePublishableKey("not-a-clerk-key")).toBeNull();
    expect(parsePublishableKey("pk_test_")).toBeNull();
  });
});

describe("detectClerkInstanceMismatch", () => {
  it("flags a live publishable key paired with a test secret key", () => {
    const msg = detectClerkInstanceMismatch(
      makePublishableKey("live", "clerk.travelplan.app"),
      "sk_test_abc",
    );
    expect(msg).toBeTruthy();
    expect(msg).toMatch(/mismatch/i);
  });

  it("flags a test publishable key paired with a live secret key", () => {
    const msg = detectClerkInstanceMismatch(
      makePublishableKey("test", "a.dev"),
      "sk_live_abc",
    );
    expect(msg).toBeTruthy();
  });

  it("stays quiet when both keys are the same instance type", () => {
    expect(
      detectClerkInstanceMismatch(
        makePublishableKey("test", "a.dev"),
        "sk_test_abc",
      ),
    ).toBeNull();
    expect(
      detectClerkInstanceMismatch(
        makePublishableKey("live", "a.app"),
        "sk_live_abc",
      ),
    ).toBeNull();
  });

  it("stays quiet when either key is absent or unparseable", () => {
    expect(detectClerkInstanceMismatch(undefined, "sk_test_abc")).toBeNull();
    expect(
      detectClerkInstanceMismatch(
        makePublishableKey("test", "a.dev"),
        undefined,
      ),
    ).toBeNull();
    expect(detectClerkInstanceMismatch("garbage", "garbage")).toBeNull();
  });
});

describe("interpretClerkResponse", () => {
  it("returns OK on 200", () => {
    expect(
      interpretClerkResponse({ ok: true, httpStatus: 200, body: "[]" }).status,
    ).toBe("OK");
  });

  it("calls out a revoked or wrong secret key on 401", () => {
    const out = interpretClerkResponse({
      ok: false,
      httpStatus: 401,
      body: "{}",
    });
    expect(out.status).toBe("FAIL");
    expect(out.detail).toMatch(/401/);
    expect(out.detail).toMatch(/secret key/i);
  });

  it("reports other failures with their status code", () => {
    const out = interpretClerkResponse({
      ok: false,
      httpStatus: 500,
      body: "oops",
    });
    expect(out.status).toBe("FAIL");
    expect(out.detail).toContain("500");
  });
});

describe("checkClerk", () => {
  it("SKIPs when CLERK_SECRET_KEY is absent", async () => {
    expect((await checkClerk({})).status).toBe("SKIP");
  });

  it("authenticates against the Clerk Backend API with a bearer token", async () => {
    const mock = stubFetchResponse(200, "[]");

    const result = await checkClerk({
      CLERK_SECRET_KEY: "sk_test_secret",
      VITE_CLERK_PUBLISHABLE_KEY: makePublishableKey(
        "test",
        "example.clerk.accounts.dev",
      ),
    });

    expect(result.status).toBe("OK");
    const { url, init } = firstCall(mock);
    expect(url).toContain("api.clerk.com");
    expect(headersOf(init).Authorization).toBe("Bearer sk_test_secret");
    expect(result.detail).toContain("example.clerk.accounts.dev");
  });

  it("appends the instance mismatch warning to an otherwise OK result", async () => {
    stubFetchResponse(200, "[]");

    const result = await checkClerk({
      CLERK_SECRET_KEY: "sk_test_secret",
      VITE_CLERK_PUBLISHABLE_KEY: makePublishableKey(
        "live",
        "clerk.travelplan.app",
      ),
    });

    expect(result.status).toBe("OK");
    expect(result.detail).toMatch(/mismatch/i);
  });
});
