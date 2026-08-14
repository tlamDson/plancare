import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ProtectedRoute } from "../ProtectedRoute";

vi.mock("@clerk/clerk-react", () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from "@clerk/clerk-react";

function renderProtected(route = "/dashboard") {
  return renderWithProviders(
    <Routes>
      <Route path="/signin" element={<div>Sign In Page</div>} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <div>Dashboard Content</div>
          </ProtectedRoute>
        }
      />
    </Routes>,
    { route },
  );
}

describe("ProtectedRoute", () => {
  it("shows the page loader while Clerk auth state is still loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
      // Clerk's real UseAuthReturn is a discriminated union keyed on
      // isLoaded — when false, every other field (userId, sessionId,
      // signOut, getToken, ...) is typed as `undefined` too. This partial
      // mock only needs isLoaded/isSignedIn for the component under test,
      // so cast through unknown rather than fleshing out every field.
    } as unknown as ReturnType<typeof useAuth>);
    renderProtected();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();
  });

  it("redirects to /signin when loaded but not signed in", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    } as ReturnType<typeof useAuth>);
    renderProtected();
    expect(screen.getByText("Sign In Page")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();
  });

  it("renders children when loaded and signed in", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    } as ReturnType<typeof useAuth>);
    renderProtected();
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });
});
