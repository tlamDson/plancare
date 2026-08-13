import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, type RenderHookOptions } from "@testing-library/react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // NOTE: gcTime is intentionally left at its default (not 0) — several
      // hooks under test (e.g. useLoadNextChunk) read/write the cache via
      // setQueryData/getQueryData without an active useQuery subscriber, and
      // gcTime: 0 would garbage-collect that data almost immediately.
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/** renderHook variant wrapped in a fresh QueryClientProvider — mirrors renderWithProviders.tsx for hooks. */
export function renderHookWithQuery<TResult, TProps>(
  callback: (props: TProps) => TResult,
  options: Omit<RenderHookOptions<TProps>, "wrapper"> & {
    queryClient?: QueryClient;
  } = {},
) {
  const { queryClient = createTestQueryClient(), ...rest } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return {
    ...renderHook(callback, { wrapper: Wrapper, ...rest }),
    queryClient,
  };
}
