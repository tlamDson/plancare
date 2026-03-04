/**
 * Map Page
 *
 * Section 5.1: Lazy loaded via React.lazy() — Mapbox only loads on navigation
 *
 * With tripId  → TripMapView (fullscreen day-colored itinerary map)
 * Without      → Generic world map
 */

import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MapContainer } from "../components/MapContainer";
import { TripMapView } from "../components/TripMapView";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WidgetError } from "@/components/WidgetError";
import { PageLoader } from "@/components/PageLoader";
import { useTranslationStore } from "@/stores/useTranslationStore";
import { useTrip } from "@/features/planner/hooks";

export default function MapPage() {
  const { tripId } = useParams<{ tripId?: string }>();
  const { t } = useTranslationStore();
  const { data: trip, isLoading } = useTrip(tripId);

  return (
    <DashboardLayout>
      {/* Flex column so map fills all remaining height */}
      <div
        className="flex flex-col gap-3"
        style={{ height: "calc(100svh - 80px)" }}
      >
        {/* Compact header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold leading-tight">
              {tripId ? t("explore.tripMapTitle") : t("explore.pageTitle")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {tripId
                ? t("explore.tripMapSubtitle")
                : t("explore.pageSubtitle")}
            </p>
          </div>
        </div>

        {/* Map fills remaining flex space */}
        <div className="flex-1 min-h-0">
          <ErrorBoundary
            fallback={
              <WidgetError
                title={t("explore.mapUnavailable")}
                message={t("explore.mapError")}
                className="h-full"
              />
            }
          >
            {tripId ? (
              <>
                {isLoading && <PageLoader />}
                {!isLoading && trip && <TripMapView trip={trip} />}
                {!isLoading && !trip && (
                  <WidgetError
                    title={t("explore.mapUnavailable")}
                    message="Trip not found"
                    className="h-full"
                  />
                )}
              </>
            ) : (
              <MapContainer
                containerId="main-map"
                center={[0, 20]}
                zoom={2}
                className="h-full"
              />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </DashboardLayout>
  );
}
