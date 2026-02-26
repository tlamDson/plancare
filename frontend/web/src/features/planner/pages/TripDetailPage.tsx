/**
 * Trip Detail Page
 *
 * Main planner view for a single trip — shows a rich itinerary timeline.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useJobPoller, useTrip } from "@/features/planner/hooks";
import {
  formatDateRange,
  getTripDuration,
  getLocalizedTripTitle,
} from "@/utils/format";
import { useTranslationStore } from "@/stores/useTranslationStore";
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
  const { language, t } = useTranslationStore();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (trip?.isAgentProcessing && trip.agentJobId) {
      setActiveJobId(trip.agentJobId);
      setJobError(null);
    }
  }, [trip?.agentJobId, trip?.isAgentProcessing]);

  // ── Debug: log trip data whenever it loads or is refreshed ──
  useEffect(() => {
    if (!trip) return;
    const title = getLocalizedTripTitle(trip.title, t);
    console.groupCollapsed(
      `[TripDetailPage] 🗺️ Trip loaded — "${title}" (${trip._id})`,
    );
    console.log(
      "Status:",
      trip.status,
      "| isAgentProcessing:",
      trip.isAgentProcessing,
    );
    console.log("Dates:", trip.startDate, "→", trip.endDate);
    console.log("Itinerary days:", trip.itinerary.length);
    trip.itinerary.forEach((day) => {
      console.groupCollapsed(`  Day ${day.day} — ${day.date}`);
      day.activities.forEach((a, i) =>
        console.log(
          `    [${i + 1}] ${a.time ?? "?:??"} | ${a.type} | ${a.name}`,
        ),
      );
      console.groupEnd();
    });
    console.log("Full trip object:", trip);
    console.groupEnd();
  }, [trip]);

  // ── Debug: log when AI job finishes and itinerary is ready to render ──
  useEffect(() => {
    if (!trip || trip.isAgentProcessing || trip.itinerary.length === 0) return;
    const title = getLocalizedTripTitle(trip.title, t);
    console.group(
      `[TripDetailPage] ✅ Itinerary READY — "${title}" | ${trip.itinerary.length} day(s)`,
    );
    trip.itinerary.forEach((day) => {
      const dateOnly = day.date.slice(0, 10);
      console.log(
        `\n  ── Day ${day.day}  (${dateOnly}) ──────────────────────`,
      );
      day.activities.forEach((a) => {
        const time = a.time ?? "--:--";
        const end = a.endTime ?? "";
        const range = end ? `${time} – ${end}` : time;
        const cost = a.cost ? ` | $${a.cost}` : "";
        const rating = a.rating != null ? ` | ⭐ ${a.rating}` : " | ⭐ none";
        const photo = a.photoUrl
          ? ` | 📸 ${a.photoUrl.slice(0, 60)}…`
          : " | 📸 none";
        const hours = a.openingHours ? ` | 🕐 ${a.openingHours}` : " | 🕐 none";
        console.log(
          `    ${range}  [${a.type}]  ${a.name}${cost}${rating}${photo}${hours}`,
        );
      });
    });
    console.groupEnd();

    // Only fire when processing finishes (isAgentProcessing changes to false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.isAgentProcessing]);

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
      return formatDateRange(trip.startDate, trip.endDate, language);
    } catch {
      return "";
    }
  })();

  const totalDays = getTripDuration(trip.startDate, trip.endDate);

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
          <h1 className="text-3xl font-bold">
            {getLocalizedTripTitle(trip.title, t)}
          </h1>
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
          <h2 className="text-xl font-semibold mb-4">{t("trip.itinerary")}</h2>

          {trip.itinerary.length === 0 ? (
            <div className="rounded-xl border bg-muted/30 p-8 text-center">
              <CalendarDays className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium mb-1">{t("trip.noItinerary")}</p>
              <p className="text-sm text-muted-foreground">
                {t("trip.noItineraryDesc")}
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
