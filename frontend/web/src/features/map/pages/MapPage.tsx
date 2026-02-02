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

export default function MapPage() {
  const { tripId } = useParams<{ tripId?: string }>();

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">
            {tripId ? "Trip Map" : "Explore"}
          </h1>
          <p className="text-muted-foreground">
            {tripId
              ? "View your itinerary on the map"
              : "Discover places around the world"}
          </p>
        </div>

        {/* Section 3.1: Wrap risky map component in ErrorBoundary */}
        <ErrorBoundary
          fallback={
            <WidgetError
              title="Map Unavailable"
              message="Failed to load the map. Please try again later."
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
