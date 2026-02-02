/**
 * Protected Route Component
 *
 * Wraps routes that require authentication
 * Uses Clerk for auth state
 */

import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";
import { PageLoader } from "@/components/PageLoader";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Redirect path if not authenticated */
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = "/signin",
}: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  // Show loader while Clerk loads
  if (!isLoaded) {
    return <PageLoader />;
  }

  // Redirect to sign in if not authenticated
  if (!isSignedIn) {
    // Save the attempted URL for redirecting after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
