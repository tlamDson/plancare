/**
 * Map Page
 *
 * Section 5.1: This entire page is lazy loaded via React.lazy()
 * in the router to avoid loading Mapbox until needed
 */

import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MapContainer } from "../components/MapContainer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WidgetError } from "@/components/WidgetError";
import { useTranslationStore } from "@/stores/useTranslationStore";

export default function MapPage() {
  const { tripId } = useParams<{ tripId?: string }>();
  const { t } = useTranslationStore();

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">
            {tripId ? t("explore.tripMapTitle") : t("explore.pageTitle")}
          </h1>
          <p className="text-muted-foreground">
            {tripId ? t("explore.tripMapSubtitle") : t("explore.pageSubtitle")}
          </p>
        </div>

        {/* Section 3.1: Wrap risky map component in ErrorBoundary */}
        <ErrorBoundary
          fallback={
            <WidgetError
              title={t("explore.mapUnavailable")}
              message={t("explore.mapError")}
              className="h-[600px]"
            />
          }
        >
          <MapContainer
            containerId="main-map"
            center={[139.6917, 35.6895]} // Tokyo
            zoom={10}
            className="h-[600px]"
          />
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  );
}
