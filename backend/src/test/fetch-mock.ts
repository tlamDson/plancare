import { vi } from "vitest";

type FetchArgs = [input: RequestInfo | URL, init?: RequestInit];
type FetchMock = ReturnType<
  typeof vi.fn<(...args: FetchArgs) => Promise<Response>>
>;

/**
 * Stubs global `fetch` with a *typed* mock, so `.mock.calls` destructures
 * without tripping `noUncheckedIndexedAccess` in the connectivity-check tests.
 */
export function stubFetch(
  handler: (...args: FetchArgs) => Promise<Response>,
): FetchMock {
  const mock = vi.fn<(...args: FetchArgs) => Promise<Response>>(handler);
  vi.stubGlobal("fetch", mock);
  return mock;
}

/** Stubs fetch with a fixed status/body. */
export function stubFetchResponse(status: number, body = "{}"): FetchMock {
  return stubFetch(async () => new Response(body, { status }));
}

export function firstCall(mock: FetchMock): { url: string; init: RequestInit } {
  const call = mock.mock.calls[0];
  if (!call) throw new Error("expected fetch to have been called");
  return { url: String(call[0]), init: call[1] ?? {} };
}

export function headersOf(init: RequestInit): Record<string, string> {
  return (init.headers ?? {}) as Record<string, string>;
}
