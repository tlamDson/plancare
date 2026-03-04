/**
 * TripMapView — Fullscreen Immersive Map
 *
 * Google Maps-style layout:
 * - Map fills full available height
 * - Floating collapsible left panel (day list)
 * - Bottom info card appears when a marker is selected (like Google Maps place card)
 * - Day legend bottom-right
 */

import { useState } from "react";
import { useMap } from "../hooks/useMap";
import { useTripMarkers } from "../hooks/useTripMarkers";
import type { SelectedActivity } from "../hooks/useTripMarkers";
import { getDayColor, getDayColorLight } from "../utils/dayColors";
import { useTranslationStore } from "@/stores/useTranslationStore";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Loader2,
  Clock,
  DollarSign,
} from "lucide-react";
import { WidgetError } from "@/components/WidgetError";
import type { Trip, ItineraryDay, Activity } from "@/utils/schemas";

// ── Helpers ──────────────────────────────────────────────────────

function hasCoordinates(itinerary: ItineraryDay[]): boolean {
  return itinerary.some((day) =>
    day.activities.some(
      (a) => a.location?.coordinates && a.location.coordinates.length === 2,
    ),
  );
}

function getInitialCenter(itinerary: ItineraryDay[]): [number, number] {
  for (const day of itinerary) {
    for (const act of day.activities) {
      if (act.location?.coordinates && act.location.coordinates.length === 2) {
        return act.location.coordinates as [number, number];
      }
    }
  }
  return [105.8342, 21.0278];
}

function getValidActivities(day: ItineraryDay): Activity[] {
  return day.activities
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter(
      (a) => a.location?.coordinates && a.location.coordinates.length === 2,
    );
}

// ─────────────────────────────────────────────────────────────────
// Bottom place card (Google Maps style)
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// Removed bottom PlaceCard component as it is now a Popup
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

interface TripMapViewProps {
  trip: Trip;
}

export function TripMapView({ trip }: TripMapViewProps) {
  const { t } = useTranslationStore();
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] =
    useState<SelectedActivity | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const mapContainerId = `trip-map-${trip._id}`;

  const sortedDays = [...trip.itinerary].sort((a, b) => a.day - b.day);
  const hasCoords = hasCoordinates(trip.itinerary);
  const initialCenter = getInitialCenter(trip.itinerary);

  const { map, isLoaded, error } = useMap({
    containerId: mapContainerId,
    center: initialCenter,
    zoom: 13,
  });

  const { flyToDay, selectActivity } = useTripMarkers({
    map,
    isLoaded,
    itinerary: trip.itinerary,
    onMarkerClick: setActiveDay,
    onActivityClick: (sel) => {
      setSelectedActivity(sel);
      setActiveDay(sel.dayNumber);
    },
  });

  const handleDayClick = (dayNumber: number) => {
    setActiveDay(dayNumber);
    setSelectedActivity(null);
    flyToDay(dayNumber);
  };

  if (!hasCoords) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 rounded-2xl border bg-muted/20">
        <div className="p-4 rounded-full bg-primary/10">
          <MapPin className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg">{t("map.noCoords")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("map.noCoordsDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: "480px" }}>
      {/* ── FULLSCREEN MAP ────────────────────────────────────── */}
      <div
        id={mapContainerId}
        className="absolute inset-0 rounded-2xl overflow-hidden w-full h-full bg-muted/20"
      />

      {/* Loading overlay */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm rounded-2xl z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading map…</p>
          </div>
        </div>
      )}

      {error && (
        <WidgetError
          title={t("explore.mapUnavailable")}
          message={error}
          className="absolute inset-0 z-10 rounded-2xl"
        />
      )}

      {/* ── FLOATING LEFT PANEL ───────────────────────────────── */}
      <div
        className={`absolute top-4 left-4 bottom-4 z-20 flex transition-all duration-300 ease-in-out ${
          panelOpen ? "translate-x-0" : "-translate-x-[calc(100%-2.5rem)]"
        }`}
        style={{ width: "280px" }}
      >
        {/* Panel body */}
        <div
          className={`flex-1 min-w-0 bg-background/95 backdrop-blur-md border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-opacity duration-300 ${
            panelOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-border/50">
            <p className="font-bold text-sm tracking-wide uppercase text-muted-foreground">
              {t("trip.itinerary")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sortedDays.length} days ·{" "}
              {trip.itinerary.reduce(
                (s, d) => s + getValidActivities(d).length,
                0,
              )}{" "}
              {t("map.activities")}
            </p>
          </div>

          {/* Day list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sortedDays.map((day) => {
              const color = getDayColor(day.day);
              const bg = getDayColorLight(day.day);
              const isActive = activeDay === day.day;
              const activities = getValidActivities(day);

              return (
                <button
                  key={day.day}
                  onClick={() => handleDayClick(day.day)}
                  aria-label={`${t("map.flyToDay")} ${day.day}`}
                  className={`w-full text-left rounded-xl p-3 transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? "shadow-md scale-[1.01]"
                      : "border-transparent hover:border-border/60 hover:shadow-sm hover:scale-[1.005]"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: bg, borderColor: color }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-sm">
                      {t("map.day")} {day.day}
                    </span>
                    <span
                      className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: bg, color }}
                    >
                      {activities.length}
                    </span>
                  </div>

                  <ol className="space-y-1.5">
                    {activities.length === 0 ? (
                      <li className="text-xs text-muted-foreground italic pl-5">
                        No location data
                      </li>
                    ) : (
                      activities.slice(0, 4).map((act, idx) => {
                        const actId = act._id ?? `day${day.day}-idx${idx}`;
                        const [lng, lat] = (act.location?.coordinates ?? [
                          0, 0,
                        ]) as [number, number];
                        const isSelected =
                          selectedActivity?.activity._id === act._id &&
                          selectedActivity?.dayNumber === day.day;
                        return (
                          <li key={act._id ?? idx}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log(
                                  `[TripMapView] Clicked sidebar activity: "${act.name}" -> passing coords [${lng}, ${lat}] to Mapbox`,
                                );
                                selectActivity(actId, lng, lat);
                              }}
                              aria-label={act.name}
                              className={`w-full text-left flex items-start gap-2 rounded-lg px-1 py-1 transition-colors cursor-pointer hover:bg-muted/50 ${
                                isSelected ? "bg-white/60 dark:bg-white/10" : ""
                              }`}
                            >
                              <span
                                className="shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold mt-0.5"
                                style={{ backgroundColor: color }}
                                aria-hidden="true"
                              >
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p
                                  className={`text-xs font-medium leading-tight line-clamp-1 ${
                                    isSelected ? "text-foreground" : ""
                                  }`}
                                >
                                  {act.name}
                                </p>
                                {(act.time || act.cost) && (
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {act.time && (
                                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                        <Clock
                                          className="h-2.5 w-2.5"
                                          aria-hidden="true"
                                        />
                                        {act.time}
                                      </span>
                                    )}
                                    {act.cost && (
                                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                        <DollarSign
                                          className="h-2.5 w-2.5"
                                          aria-hidden="true"
                                        />
                                        {act.cost}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </button>
                          </li>
                        );
                      })
                    )}
                    {activities.length > 4 && (
                      <li className="text-[10px] text-muted-foreground pl-6">
                        +{activities.length - 4} more stops
                      </li>
                    )}
                  </ol>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setPanelOpen((p) => !p)}
          aria-label={panelOpen ? "Collapse panel" : "Expand panel"}
          className="self-center ml-2 h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-md border border-border/60 shadow-lg hover:bg-muted transition-colors duration-200 cursor-pointer"
        >
          {panelOpen ? (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
