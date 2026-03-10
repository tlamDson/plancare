/**
 * Trip Detail Page
 *
 * Main planner view for a single trip — shows a rich itinerary timeline.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useJobPoller,
  useTrip,
  useReorderActivities,
  useRegenActivity,
} from "@/features/planner/hooks";
import { useLoadNextChunk } from "@/features/planner/hooks/useLoadNextChunk";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  formatDateRange,
  getTripDuration,
  getLocalizedTripTitle,
} from "@/utils/format";
import { useTranslationStore } from "@/stores/useTranslationStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AgentLockBanner } from "../components/AgentLockBanner";
import { BackgroundProcessingModal } from "../components/BackgroundProcessingModal";
import { useActiveJobStore } from "@/stores/useActiveJobStore";
import { ItineraryDayCard } from "../components/ItineraryDayCard";
import { DataError } from "@/components/DataError";
import { PageLoader } from "@/components/PageLoader";
import { retryJob, cancelJob } from "../api/jobs.api";
import { toast } from "sonner";
import {
  CalendarDays,
  Map,
  MapPin,
  Undo2,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { useUpdateTrip, useUpdateTripLifecycle } from "../hooks/useTrips";
import { apiClient } from "@/lib/axios";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { data: trip, isLoading, error } = useTrip(tripId);
  const { language, t } = useTranslationStore();
  const queryClient = useQueryClient();
  const { mutate: updateLifecycle, isPending: isUpdatingLifecycle } =
    useUpdateTripLifecycle();
  const { mutate: updateTrip, isPending: isUpdatingTrip } = useUpdateTrip();
  const { mutate: reorderActivities, isPending: isReordering } =
    useReorderActivities();
  const {
    mutate: regenActivity,
    isPending: isRegening,
    variables: regenVariables,
  } = useRegenActivity();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isReGeocoding, setIsReGeocoding] = useState(false);
  const [canUndo, setCanUndo] = useState(true);
  const { autoLoadLongTripChunks } = useSubscriptionStore();
  const { setActiveJob, clearActiveJob } = useActiveJobStore();

  useEffect(() => {
    if (trip?.isAgentProcessing && trip.agentJobId && tripId) {
      setActiveJobId(trip.agentJobId);
      setActiveJob(trip.agentJobId, tripId);
      setJobError(null);
    }
  }, [trip?.agentJobId, trip?.isAgentProcessing, tripId, setActiveJob]);

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

  const { mutate: cancelTripJob, isPending: isCancelling } = useMutation({
    mutationFn: (id: string) => cancelJob(id),
    onSuccess: () => {
      toast.success("Trip generation cancelled.");
      setActiveJobId(null);
      clearActiveJob();
      if (tripId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.trips.detail(tripId),
        });
      }
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to cancel trip generation.",
      );
    },
  });

  const handleCancelClick = useCallback(() => {
    if (tripId) {
      cancelTripJob(tripId);
    }
  }, [tripId, cancelTripJob]);

  const handleUndo = useCallback(async () => {
    if (!tripId) return;
    setIsUndoing(true);
    try {
      await apiClient.patch(`/trips/${tripId}/undo`);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
      toast.success("↩ Hoàn tác thành công — Lịch trình đã được khôi phục.");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setCanUndo(false);
        toast.info("Không có lịch sử hoàn tác.");
      } else {
        toast.error("Hoàn tác thất bại.");
      }
    } finally {
      setIsUndoing(false);
    }
  }, [tripId, queryClient]);

  const handleReGeocode = useCallback(async () => {
    if (!tripId) return;
    setIsReGeocoding(true);
    const toastId = toast.loading("🔍 Re-geocoding activities...");
    try {
      const res = await apiClient.post(`/trips/${tripId}/regeocode`);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
      toast.success(
        `✅ Updated ${res.data.updated} activities (${res.data.failed} failed)`,
        { id: toastId },
      );
    } catch (err: any) {
      toast.error("Re-geocode failed. Check API keys.", { id: toastId });
    } finally {
      setIsReGeocoding(false);
    }
  }, [tripId, queryClient]);

  const handleEditTitle = () => {
    if (!trip) return;
    setEditTitleValue(trip.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (!trip) return;
    const trimmed = editTitleValue.trim();
    if (trimmed && trimmed !== trip.title) {
      updateTrip({ tripId: trip._id, data: { title: trimmed } });
    }
    setIsEditingTitle(false);
  };

  const handleKeyDownTitle = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveTitle();
    if (e.key === "Escape") setIsEditingTitle(false);
  };

  // ── DnD sensors: require 8px movement before drag starts (prevents misclicks)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent, dayIndex: number) => {
      const { active, over } = event;

      // Guard 1: dropped outside any droppable area
      if (!over) return;
      // Guard 2: dropped on itself — nothing to do
      if (active.id === over.id) return;

      if (!trip) return;
      const day = trip.itinerary[dayIndex];
      if (!day) return;

      const sorted = day.activities.slice().sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return 0;
      });

      const oldIndex = sorted.findIndex((a) => a._id === active.id);
      const newIndex = sorted.findIndex((a) => a._id === over.id);

      // Guard 3: index didn't actually change
      if (oldIndex === newIndex) return;

      const reordered = arrayMove(sorted, oldIndex, newIndex);

      reorderActivities({
        tripId: trip._id,
        dayIndex,
        orderedActivityIds: reordered.map((a) => a._id!),
      });
    },
    [trip, reorderActivities],
  );

  const handleRegenActivity = useCallback(
    (dayIndex: number, activityId: string, hint?: string) => {
      if (!trip) return;
      regenActivity({ tripId: trip._id, dayIndex, activityId, hint });
    },
    [trip, regenActivity],
  );

  // Chunk loading for Pro trips > 5 days
  const totalChunks = (trip as any)?.totalChunks ?? 0;
  const isChunkedTrip = totalChunks > 1;
  const { allChunksLoaded, isLoadingChunk, loadNextChunk } = useLoadNextChunk(
    tripId,
    totalChunks,
    isChunkedTrip ? Math.ceil((trip?.itinerary?.length ?? 0) / 3) : 0,
  );

  // IntersectionObserver: fire loadNextChunk when user scrolls near the last day
  const lastDayRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (
      !autoLoadLongTripChunks ||
      !isChunkedTrip ||
      allChunksLoaded ||
      !lastDayRef.current
    ) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadNextChunk();
      },
      { rootMargin: "200px" },
    );
    observer.observe(lastDayRef.current);
    return () => observer.disconnect();
  }, [
    autoLoadLongTripChunks,
    isChunkedTrip,
    allChunksLoaded,
    loadNextChunk,
    trip?.itinerary?.length,
  ]);

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

  // ── Does this trip have any geocoded activities? ─────────────
  const hasMapData = trip.itinerary.some((day) =>
    day.activities.some(
      (a) => a.location?.coordinates && a.location.coordinates.length === 2,
    ),
  );

  // ── Date range label ──────────────────────────────────────
  const dateRange = (() => {
    try {
      return formatDateRange(trip.startDate, trip.endDate, language);
    } catch {
      return "";
    }
  })();

  const totalDays = getTripDuration(trip.startDate, trip.endDate);
  const isFallback = trip?.status === "FALLBACK";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl md:max-w-6xl w-full">
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
          onCancel={handleCancelClick}
          isCancelling={isCancelling}
          isFallback={isFallback}
          fallbackCity={trip?.destination?.split(",")[0]}
        />

        <BackgroundProcessingModal
          isProcessing={trip.isAgentProcessing}
          currentStep={jobState.currentStep}
        />

        {/* Trip Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              {isEditingTitle ? (
                <div className="flex items-center gap-1">
                  <Input
                    autoFocus
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    onKeyDown={handleKeyDownTitle}
                    disabled={isUpdatingTrip}
                    className="h-9 md:h-10 text-xl font-bold md:text-3xl w-[200px] md:w-[350px] shadow-sm"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    onClick={handleSaveTitle}
                    disabled={isUpdatingTrip}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => setIsEditingTitle(false)}
                    disabled={isUpdatingTrip}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="group flex items-center gap-2">
                  <h1 className="text-3xl font-bold">
                    {getLocalizedTripTitle(trip.title, t)}
                  </h1>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 shrink-0 focus:opacity-100"
                    onClick={handleEditTitle}
                    title="Edit Trip Name"
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground mr-0.5" />
                  </Button>
                </div>
              )}

              {/* User Lifecycle Status Dropdown (only visible if AI is done) */}
              {trip.status === "COMPLETED" && (
                <Select
                  value={trip.lifecycle || "UPCOMING"}
                  onValueChange={(val: any) =>
                    updateLifecycle({ tripId: trip._id, lifecycle: val })
                  }
                  disabled={isUpdatingLifecycle || trip.isAgentProcessing}
                >
                  <SelectTrigger className="h-8 min-w-[120px] text-xs font-medium px-3 shadow-sm border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors focus:ring-1 focus:ring-primary rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPCOMING">Upcoming</SelectItem>
                    <SelectItem value="IN_TRIP">In Trip</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem
                      value="CANCELLED"
                      className="text-muted-foreground"
                    >
                      Cancelled
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

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

          {/* Action buttons row */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Re-geocode button — fixes wrong coordinates on old trips */}
            {trip.status === "COMPLETED" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReGeocode}
                disabled={isReGeocoding}
                className="gap-1.5"
                aria-label="Re-geocode activities"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {isReGeocoding ? "Geocoding..." : "Fix Locations"}
              </Button>
            )}
            {/* View on Map button — only when COMPLETED + has coords */}
            {trip.status === "COMPLETED" && hasMapData && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/map/${trip._id}`)}
                className="gap-1.5"
                aria-label={t("map.viewOnMap")}
              >
                <Map className="h-4 w-4" aria-hidden="true" />
                {t("map.viewOnMap")}
              </Button>
            )}

            {!trip.isAgentProcessing && canUndo && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={isUndoing}
                className="shrink-0 gap-1.5"
                title="Hoàn tác thay đổi lịch trình gần nhất"
              >
                <Undo2 className="h-4 w-4" />
                {isUndoing ? "Đang hoàn tác..." : "Hoàn tác"}
              </Button>
            )}
          </div>
        </div>

        {/* Itinerary */}
        <div>
          <h2 className="text-xl font-semibold mb-4">{t("trip.itinerary")}</h2>
          {isChunkedTrip && (
            <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50/70 p-3 text-sm text-purple-800">
              Long-trip generation may take longer. You can leave this page and
              come back later.
            </div>
          )}

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
                .map((day, dayIndex, arr) => {
                  const isLast = dayIndex === arr.length - 1;
                  return (
                    <div
                      key={day._id ?? day.day}
                      ref={isLast && isChunkedTrip ? lastDayRef : undefined}
                    >
                      <DndContext
                        sensors={sensors}
                        onDragEnd={(event: DragEndEvent) =>
                          handleDragEnd(event, dayIndex)
                        }
                      >
                        <ItineraryDayCard
                          day={day}
                          dayIndex={dayIndex}
                          currency={trip.budget.currency}
                          isDragDisabled={
                            trip.isAgentProcessing ||
                            isReordering ||
                            isRegening ||
                            isFallback
                          }
                          regenningActivityId={
                            isRegening && regenVariables?.dayIndex === dayIndex
                              ? regenVariables.activityId
                              : null
                          }
                          onRegenActivity={handleRegenActivity}
                        />
                      </DndContext>
                    </div>
                  );
                })}

              {/* Chunked trip: show skeleton while next chunk loads */}
              {isChunkedTrip && !allChunksLoaded && (
                <div className="rounded-xl border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  <p className={isLoadingChunk ? "animate-pulse" : ""}>
                    {isLoadingChunk
                      ? "Loading more days..."
                      : autoLoadLongTripChunks
                        ? "Auto-loading next days..."
                        : "Click to load more days."}
                  </p>
                  {!autoLoadLongTripChunks && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => void loadNextChunk()}
                      disabled={isLoadingChunk}
                    >
                      Load more days
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
