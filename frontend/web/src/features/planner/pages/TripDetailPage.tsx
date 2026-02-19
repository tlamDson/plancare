/**
 * Trip Detail Page
 *
 * Main planner view for a single trip — shows a rich itinerary timeline.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { useJobPoller, useTrip } from "@/features/planner/hooks";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AgentLockBanner } from "../components/AgentLockBanner";
import { ItineraryDayCard } from "../components/ItineraryDayCard";
import { DataError } from "@/components/DataError";
import { PageLoader } from "@/components/PageLoader";
import { retryJob } from "../api/jobs.api";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";

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
    onComplete: () => setActiveJobId(null),
    onError: (errorMessage) => setJobError(errorMessage),
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
      const message = retryError?.message || "Failed to retry trip generation";
      setJobError(message);
      toast.error(message);
    } finally {
      setIsRetrying(false);
    }
  }, [activeJobId]);

  if (isLoading) return <PageLoader />;

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

  // ── Date range label ──────────────────────────────────────
  const dateRange = (() => {
    try {
      const s = format(new Date(trip.startDate), "MMM d");
      const e = format(new Date(trip.endDate), "MMM d, yyyy");
      return `${s} – ${e}`;
    } catch {
      return "";
    }
  })();

  const totalDays = trip.itinerary.length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
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
            <p className="text-muted-foreground mt-1">{trip.description}</p>
          )}
          {dateRange && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              <span>
                {dateRange}
                {totalDays > 0 && ` · ${totalDays}-day trip`}
              </span>
            </div>
          )}
        </div>

        {/* Itinerary */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Itinerary</h2>

          {trip.itinerary.length === 0 ? (
            <div className="rounded-xl border bg-muted/30 p-8 text-center">
              <CalendarDays className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium mb-1">No itinerary yet</p>
              <p className="text-sm text-muted-foreground">
                Use the AI Assistant to generate your trip plan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {trip.itinerary
                .slice()
                .sort((a, b) => a.day - b.day)
                .map((day) => (
                  <ItineraryDayCard
                    key={day._id ?? day.day}
                    day={day}
                    currency={trip.budget.currency}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
