import { describe, it, expect, vi, afterEach } from "vitest";
import { firstCall, stubFetch } from "../../test/fetch-mock";
import { runHttpCheck, describeNetworkError, skipped } from "./http-check";

afterEach(() => {
  vi.unstubAllGlobals();
});

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status });

describe("skipped", () => {
  it("builds a SKIP result with no latency", () => {
    expect(skipped("Stripe", "no key")).toEqual({
      name: "Stripe",
      status: "SKIP",
      detail: "no key",
    });
  });
});

describe("runHttpCheck", () => {
  it("passes the parsed status and body to interpret and returns its verdict", async () => {
    stubFetch(async () => jsonResponse(200, { hello: "world" }));
    const interpret = vi.fn(() => ({
      status: "OK" as const,
      detail: "reachable",
    }));

    const result = await runHttpCheck({
      name: "Demo",
      url: "https://x.test",
      interpret,
    });

    expect(interpret).toHaveBeenCalledWith({
      ok: true,
      httpStatus: 200,
      body: '{"hello":"world"}',
    });
    expect(result.name).toBe("Demo");
    expect(result.status).toBe("OK");
    expect(result.detail).toBe("reachable");
  });

  it("records latency on success", async () => {
    stubFetch(async () => jsonResponse(200, {}));
    const result = await runHttpCheck({
      name: "Demo",
      url: "https://x.test",
      interpret: () => ({ status: "OK", detail: "" }),
    });
    expect(typeof result.latencyMs).toBe("number");
  });

  it("lets interpret return FAIL for a non-2xx response", async () => {
    stubFetch(async () => jsonResponse(401, { error: "nope" }));
    const result = await runHttpCheck({
      name: "Demo",
      url: "https://x.test",
      interpret: ({ httpStatus }) => ({
        status: "FAIL",
        detail: `HTTP ${httpStatus}`,
      }),
    });
    expect(result).toMatchObject({ status: "FAIL", detail: "HTTP 401" });
  });

  it("converts a thrown network error into FAIL without rethrowing", async () => {
    stubFetch(async () => {
      throw Object.assign(new TypeError("fetch failed"), {
        cause: { code: "ENOTFOUND" },
      });
    });
    const result = await runHttpCheck({
      name: "Demo",
      url: "https://x.test",
      interpret: () => ({ status: "OK", detail: "unused" }),
    });
    expect(result.status).toBe("FAIL");
    expect(result.detail).toContain("ENOTFOUND");
  });

  it("passes the caller's init through to fetch", async () => {
    const mock = stubFetch(async () => jsonResponse(200, {}));
    await runHttpCheck({
      name: "Demo",
      url: "https://x.test",
      init: { method: "POST", headers: { "X-Test": "1" } },
      interpret: () => ({ status: "OK", detail: "" }),
    });
    const { init } = firstCall(mock);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "X-Test": "1" });
    expect(init.signal).toBeDefined();
  });
});

describe("describeNetworkError", () => {
  it("reports a timeout by name", () => {
    expect(
      describeNetworkError(
        Object.assign(new Error("x"), { name: "TimeoutError" }),
      ),
    ).toBe("timeout");
  });

  it("surfaces the underlying cause code that fetch hides behind 'fetch failed'", () => {
    const err = Object.assign(new TypeError("fetch failed"), {
      cause: { code: "ECONNREFUSED" },
    });
    expect(describeNetworkError(err)).toContain("ECONNREFUSED");
  });

  it("falls back to the message when there is no cause code", () => {
    expect(describeNetworkError(new Error("boom"))).toBe("boom");
  });

  it("stringifies non-Error throwables", () => {
    expect(describeNetworkError("weird")).toBe("weird");
  });
});
