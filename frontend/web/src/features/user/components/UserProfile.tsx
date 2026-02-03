/**
 * User Profile Component
 *
 * Feature-specific user profile display
 */

import { DataError } from "@/components/DataError";
import { PageLoader } from "@/components/PageLoader";
import { useUserMe } from "../hooks/useUser";

export function UserProfile() {
  const { data: user, isLoading, error } = useUserMe();

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !user) {
    return (
      <DataError
        title="Failed to load profile"
        message={error?.message || "User profile unavailable"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.firstName} ${user.lastName}`}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Preferences
          </h3>
          <div className="mt-2 space-y-1 text-sm">
            <p>Currency: {user.preferences?.currency || "USD"}</p>
            <p>
              Budget Range:{" "}
              {user.preferences?.budgetRange
                ? `$${user.preferences.budgetRange}`
                : "Not set"}
            </p>
            <p>
              Travel Style:{" "}
              {user.preferences?.travelStyle?.length
                ? user.preferences.travelStyle.join(", ")
                : "Not set"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Notifications
          </h3>
          <div className="mt-2 space-y-1 text-sm">
            <p>
              Trip reminders:{" "}
              {user.notificationPreferences?.tripReminders ? "On" : "Off"}
            </p>
            <p>
              Budget alerts:{" "}
              {user.notificationPreferences?.budgetAlerts ? "On" : "Off"}
            </p>
            <p>
              Trip invites:{" "}
              {user.notificationPreferences?.tripInvites ? "On" : "Off"}
            </p>
            <p>
              AI suggestions:{" "}
              {user.notificationPreferences?.aiSuggestions ? "On" : "Off"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
