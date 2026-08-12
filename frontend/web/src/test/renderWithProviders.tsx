import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

/**
 * Render helper for components that read TanStack Query and/or the router —
 * the two providers every planner/trip component sits inside in the real
 * AppProviders tree (see frontend/web/src/app/providers/index.tsx).
 *
 * Deliberately does NOT wrap the real ClerkProvider: it requires a valid
 * publishable key and talks to Clerk's network on mount, which unit tests
 * must never do. If the component under test calls a Clerk hook
 * (useAuth/useUser/...), mock "@clerk/clerk-react" with vi.mock() at the
 * top of the test file instead.
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface Options extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = "/", queryClient = createTestQueryClient(), ...options }: Options = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
