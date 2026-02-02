/**
 * App Router
 *
 * Centralized routing configuration
 * Section 6: URL State via React Router
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { PageLoader } from "@/components/PageLoader";

// ============================================
// LAZY LOADED PAGES
// Section 5: Performance - Lazy load heavy components
// ============================================

// Public pages (can be eagerly loaded for better UX)
import LandingPage from "@/features/landing/pages/LandingPage";

// Auth pages
const SignInPage = lazy(() => import("@/features/auth/pages/SignInPage"));
const SignUpPage = lazy(() => import("@/features/auth/pages/SignUpPage"));
const SSOCallbackPage = lazy(
  () => import("@/features/auth/pages/SSOCallbackPage"),
);
const OnBoardingPage = lazy(
  () => import("@/features/auth/pages/OnBoardingPage"),
);

// Protected pages (lazy loaded)
const DashboardPage = lazy(
  () => import("@/features/dashboard/pages/DashboardPage"),
);
const TripsPage = lazy(() => import("@/features/trips/pages/TripsPage"));
const TripDetailPage = lazy(
  () => import("@/features/planner/pages/TripDetailPage"),
);
const AIAssistantPage = lazy(
  () => import("@/features/assistant/pages/AIAssistantPage"),
);
const MapPage = lazy(() => import("@/features/map/pages/MapPage"));

// Error pages
const NotFound = lazy(() => import("@/app/pages/NotFound"));

/**
 * Suspense wrapper for lazy loaded routes
 */
function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================================ */}
        {/* PUBLIC ROUTES */}
        {/* ================================ */}
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/signin"
          element={
            <LazyRoute>
              <SignInPage />
            </LazyRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <LazyRoute>
              <SignUpPage />
            </LazyRoute>
          }
        />

        {/* SSO Callback for Clerk OAuth */}
        <Route
          path="/sso-callback"
          element={
            <LazyRoute>
              <SSOCallbackPage />
            </LazyRoute>
          }
        />

        <Route
          path="/onboarding"
          element={
            <LazyRoute>
              <OnBoardingPage />
            </LazyRoute>
          }
        />

        {/* ================================ */}
        {/* PROTECTED ROUTES */}
        {/* ================================ */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <DashboardPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <TripsPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/trips/:tripId"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <TripDetailPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-assistant"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <AIAssistantPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <MapPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/map/:tripId"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <MapPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================ */}
        {/* 404 CATCH-ALL */}
        {/* ================================ */}
        <Route
          path="*"
          element={
            <LazyRoute>
              <NotFound />
            </LazyRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
