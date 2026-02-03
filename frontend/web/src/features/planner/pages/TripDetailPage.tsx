/**
 * Trip Detail Page
 *
 * Main planner view for a single trip
 */

import { useParams } from "react-router-dom";
import { useTrip } from "@/features/planner/hooks";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AgentLockBanner } from "../components/AgentLockBanner";
import { DataError } from "@/components/DataError";
import { PageLoader } from "@/components/PageLoader";

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { data: trip, isLoading, error } = useTrip(tripId);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !trip) {
    return (
      <DashboardLayout>
        <DataError
          message={error?.message || "Trip not found"}
          onRetry={() => window.location.reload()}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Agent Lock Banner */}
        <AgentLockBanner
          isLocked={trip.isAgentProcessing}
          currentStep={null} // Would come from job status in real app
        />

        {/* Trip Header */}
        <div>
          <h1 className="text-3xl font-bold">{trip.title}</h1>
          {trip.description && (
            <p className="text-muted-foreground mt-2">{trip.description}</p>
          )}
        </div>

        {/* Trip content would go here */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Itinerary</h2>
            {trip.itinerary.length === 0 ? (
              <p className="text-muted-foreground">
                No itinerary yet. Use AI to generate one!
              </p>
            ) : (
              trip.itinerary.map((day) => (
                <div key={day.day} className="p-4 border rounded-lg">
                  <h3 className="font-medium">Day {day.day}</h3>
                  <p className="text-sm text-muted-foreground">
                    {day.activities.length} activities
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Budget</h2>
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Total</span>
                <span className="font-medium">
                  {trip.budget.currency} {trip.budget.totalSpent} /{" "}
                  {trip.budget.totalLimit}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${Math.min(
                      (trip.budget.totalSpent / trip.budget.totalLimit) * 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
