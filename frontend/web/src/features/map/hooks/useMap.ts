/**
 * Map Hooks
 *
 * Section 5.1: Mapbox Hygiene
 * - Lazy Loading: Use React.lazy() for Map component
 * - Clustering: Use supercluster for >50 markers
 * - Cleanup: Always call map.remove() in useEffect
 */

import { useEffect, useRef, useCallback, useState } from "react";
import type { Map as MapboxMap } from "mapbox-gl";
import type Supercluster from "supercluster";
import { useTranslationStore } from "@/stores/useTranslationStore";
import { MAPBOX_TOKEN } from "@/config/env";

// ============================================
// MAP INSTANCE HOOK
// Section 5.1: Proper cleanup to prevent WebGL context loss
// ============================================

export interface UseMapOptions {
  containerId: string;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  style?: string;
}

export function useMap({ containerId, center, zoom, style }: UseMapOptions) {
  const mapRef = useRef<MapboxMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslationStore();

  useEffect(() => {
    // Dynamically import mapbox-gl to enable tree-shaking
    let isMounted = true;

    async function initMap() {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;

        // Get token from environment (VITE_MAPBOX_ACCESS_TOKEN preferred,
        // falls back to the legacy VITE_MAPBOX_TOKEN name)
        if (!MAPBOX_TOKEN) {
          throw new Error(t("explore.mapboxTokenError"));
        }

        mapboxgl.accessToken = MAPBOX_TOKEN;

        const container = document.getElementById(containerId);
        if (!container || !isMounted) return;

        const map = new mapboxgl.Map({
          container: containerId,
          style: style || "mapbox://styles/mapbox/streets-v12",
          center: center || [0, 0],
          zoom: zoom || 2,
        });

        map.on("load", () => {
          if (isMounted) {
            setIsLoaded(true);
          }
        });

        map.on("error", (e) => {
          console.error("Map error:", e);
          if (isMounted) {
            setError(e.error?.message || t("explore.mapError"));
          }
        });

        mapRef.current = map;
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : t("explore.mapError"));
        }
      }
    }

    initMap();

    // CRITICAL: Section 5.1 - Cleanup to prevent WebGL context loss
    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId, zoom, style]);

  return {
    map: mapRef.current,
    isLoaded,
    error,
  };
}

// ============================================
// MARKERS CLUSTERING HOOK
// Section 5.1: Use supercluster for >50 markers
// ============================================

export interface MarkerData {
  id: string;
  lng: number;
  lat: number;
  properties?: Record<string, unknown>;
}

export interface UseClusteredMarkersOptions {
  markers: MarkerData[];
  map: MapboxMap | null;
  radius?: number;
  maxZoom?: number;
}

export function useClusteredMarkers({
  markers,
  map,
  radius = 40,
  maxZoom = 16,
}: UseClusteredMarkersOptions) {
  const [clusters, setClusters] = useState<GeoJSON.Feature[]>([]);
  const clusterRef = useRef<Supercluster | null>(null);

  useEffect(() => {
    if (!map || markers.length === 0) return;

    // Section 5.1: Use clustering for >50 markers
    if (markers.length > 50) {
      // Dynamically import supercluster
      import("supercluster").then(({ default: Supercluster }) => {
        const cluster = new Supercluster({
          radius,
          maxZoom,
        });

        const points = markers.map((m) => ({
          type: "Feature" as const,
          properties: { ...m.properties, id: m.id },
          geometry: {
            type: "Point" as const,
            coordinates: [m.lng, m.lat],
          },
        }));

        cluster.load(points);
        clusterRef.current = cluster;

        // Update clusters on map move
        const updateClusters = () => {
          const bounds = map.getBounds();
          if (!bounds) return;

          const zoom = Math.floor(map.getZoom());

          const clusteredPoints = cluster.getClusters(
            [
              bounds.getWest(),
              bounds.getSouth(),
              bounds.getEast(),
              bounds.getNorth(),
            ],
            zoom,
          );

          setClusters(clusteredPoints);
        };

        map.on("moveend", updateClusters);
        updateClusters();

        return () => {
          map.off("moveend", updateClusters);
        };
      });
    } else {
      // No clustering needed for small marker sets
      setClusters(
        markers.map((m) => ({
          type: "Feature",
          properties: { ...m.properties, id: m.id, cluster: false },
          geometry: {
            type: "Point",
            coordinates: [m.lng, m.lat],
          },
        })),
      );
    }
  }, [markers, map, radius, maxZoom]);

  const expandCluster = useCallback(
    (clusterId: number) => {
      if (!clusterRef.current || !map) return;

      const zoom = clusterRef.current.getClusterExpansionZoom(clusterId);
      const features = clusterRef.current.getLeaves(clusterId, Infinity);

      if (features.length > 0) {
        map.easeTo({
          center: features[0].geometry.coordinates as [number, number],
          zoom,
        });
      }
    },
    [map],
  );

  return { clusters, expandCluster };
}

// ============================================
// FIT BOUNDS HOOK
// ============================================

export function useFitBounds(
  map: MapboxMap | null,
  coordinates: [number, number][],
) {
  useEffect(() => {
    if (!map || coordinates.length === 0) return;

    // Import mapbox-gl dynamically to get LngLatBounds
    import("mapbox-gl").then((mapboxgl) => {
      const bounds = coordinates.reduce(
        (b, coord) => b.extend(coord),
        new mapboxgl.default.LngLatBounds(coordinates[0], coordinates[0]),
      );

      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      });
    });
  }, [map, coordinates]);
}
