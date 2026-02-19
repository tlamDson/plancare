/**
 * Trip Detail Page
 *
 * Main planner view for a single trip
 */

import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useJobPoller, useTrip } from "@/features/planner/hooks";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AgentLockBanner } from "../components/AgentLockBanner";
import { DataError } from "@/components/DataError";
import { PageLoader } from "@/components/PageLoader";
import { retryJob } from "../api/jobs.api";
import { toast } from "sonner";

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { data: trip, isLoading, error } = useTrip(tripId);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (trip?.isAgentProcessing && trip.agentJobId) {
      setActiveJobId(trip.agentJobId);
      setJobError(null);
    }
  }, [trip?.agentJobId, trip?.isAgentProcessing]);

  const jobState = useJobPoller({
    jobId: activeJobId,
    onComplete: () => {
      setActiveJobId(null);
    },
    onError: (errorMessage) => {
      setJobError(errorMessage);
    },
  });

  const handleRetry = useCallback(async () => {
    if (!activeJobId) return;
    setIsRetrying(true);
    try {
      const result = await retryJob(activeJobId);
      setActiveJobId(result.jobId);
      setJobError(null);
      toast.success("Retry queued. The agent is working again.");
    } catch (retryError: any) {
      const message =
        retryError?.message || "Failed to retry trip generation";
      setJobError(message);
      toast.error(message);
    } finally {
      setIsRetrying(false);
    }
  }, [activeJobId]);

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
          currentStep={jobState.currentStep}
          status={
            trip.isAgentProcessing && jobState.status === "IDLE"
              ? "PROCESSING"
              : jobState.status
          }
          progress={jobState.progress}
          error={jobError || jobState.error}
          jobId={activeJobId}
          onRetry={activeJobId ? handleRetry : undefined}
          isRetrying={isRetrying}
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
