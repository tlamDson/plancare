/**
 * Map Container Component
 *
 * Section 5.1: Mapbox Hygiene
 * This component handles the map container and error states
 */

import { useMap, type UseMapOptions } from "../hooks/useMap";
import { WidgetError } from "@/components/WidgetError";
import { Loader2 } from "lucide-react";

interface MapContainerProps extends UseMapOptions {
  className?: string;
  children?: React.ReactNode;
}

export function MapContainer({
  containerId,
  center,
  zoom,
  style,
  className,
  children,
}: MapContainerProps) {
  const { isLoaded, error } = useMap({ containerId, center, zoom, style });

  // Section 3.1: If Mapbox fails, show placeholder but don't crash
  if (error) {
    return (
      <WidgetError
        title="Map Unavailable"
        message={error}
        className={className}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div
        id={containerId}
        className="w-full h-full rounded-lg overflow-hidden"
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Overlay content (markers, controls, etc.) */}
      {isLoaded && children}
    </div>
  );
}
