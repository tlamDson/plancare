/**
 * SSO Callback Page
 *
 * Handles OAuth callback from Clerk
 */

import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { PageLoader } from "@/components/PageLoader";

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/onboarding"
      />
      <PageLoader />
    </div>
  );
}
