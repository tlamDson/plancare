import { useMemo } from "react";
import { CloudSun, Droplets, Map, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslationStore } from "@/stores/useTranslationStore";
import { convertCurrency } from "@/utils/format";
import { useTripDayWeather } from "@/features/planner/hooks";
import { MAPBOX_TOKEN } from "@/config/env";

interface TripDetailSummaryRailProps {
  tripId: string;
  destination?: string;
  activeDayDate?: string;
  activeDayCoordinates: Array<[number, number]>;
  allTripCoordinates: Array<[number, number]>;
  totalCalendarDays: number;
  totalStops: number;
  budgetTotal?: number;
  budgetCurrency?: string;
  preferredCurrency: string;
  showViewOnMap: boolean;
  onViewMap: () => void;
}

export function TripDetailSummaryRail({
  tripId,
  destination,
  activeDayDate,
  activeDayCoordinates,
  allTripCoordinates,
  totalCalendarDays,
  totalStops,
  budgetTotal,
  budgetCurrency,
  preferredCurrency,
  showViewOnMap,
  onViewMap,
}: TripDetailSummaryRailProps) {
  const { t } = useTranslationStore();
  const weatherQuery = useTripDayWeather({
    destination,
    dayDateIso: activeDayDate,
  });

  const previewCoordinates =
    activeDayCoordinates.length > 0 ? activeDayCoordinates : allTripCoordinates;

  const staticMapUrl = useMemo(() => {
    if (!MAPBOX_TOKEN || previewCoordinates.length === 0) return null;
    const [lng, lat] = previewCoordinates.reduce(
      ([sumLng, sumLat], [pointLng, pointLat]) => [
        sumLng + pointLng,
        sumLat + pointLat,
      ],
      [0, 0],
    );
    const centerLng = lng / previewCoordinates.length;
    const centerLat = lat / previewCoordinates.length;
    const marker = previewCoordinates[0];

    return [
      "https://api.mapbox.com/styles/v1/mapbox/dark-v11/static",
      `/pin-s+38BDF8(${marker[0]},${marker[1]})/`,
      `${centerLng},${centerLat},10/640x280`,
      `?access_token=${MAPBOX_TOKEN}`,
    ].join("");
  }, [previewCoordinates]);

  const displayBudget =
    budgetTotal != null &&
    budgetTotal > 0 &&
    budgetCurrency &&
    (() => {
      try {
        const converted = convertCurrency(
          budgetTotal,
          budgetCurrency,
          preferredCurrency,
        );
        return `${converted.toLocaleString(undefined, {
          maximumFractionDigits: preferredCurrency === "VND" ? 0 : 2,
        })} ${preferredCurrency}`;
      } catch {
        return `${budgetTotal} ${budgetCurrency}`;
      }
    })();

  const metaLine =
    totalCalendarDays > 0
      ? `${totalCalendarDays} ${
          totalCalendarDays === 1
            ? t("trip.summaryDaySingular")
            : t("trip.summaryDayPlural")
        } · ${totalStops} ${t("trip.stopsUnit")}`
      : `${totalStops} ${t("trip.stopsUnit")}`;

  return (
    <aside className="lg:sticky lg:top-4 space-y-3">
      <div className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm p-4 space-y-3 transition-shadow duration-200 hover:shadow-md">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("trip.summary")}
          </h2>
          {destination ? (
            <p className="mt-1 flex items-start gap-2 text-sm font-semibold text-foreground leading-snug">
              <MapPin
                className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground"
                aria-hidden
              />
              <span>{destination}</span>
            </p>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {metaLine}
        </p>

        {displayBudget ? (
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
            <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
              {t("trip.budgetLabel")}
            </p>
            <p className="text-lg font-semibold tabular-nums">{displayBudget}</p>
          </div>
        ) : null}

        {showViewOnMap ? (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="w-full min-h-9 cursor-pointer transition-colors duration-200 gap-2"
            onClick={onViewMap}
          >
            <Map className="h-4 w-4 shrink-0" aria-hidden />
            {t("map.viewOnMap")}
          </Button>
        ) : null}
      </div>

      <div className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm p-4 space-y-3 transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-center gap-2">
          <CloudSun className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold text-foreground">
            {t("trip.weatherTitle")}
          </h3>
        </div>

        {weatherQuery.isLoading ? (
          <p className="text-sm text-muted-foreground animate-pulse motion-reduce:animate-none">
            {t("trip.weatherLoading")}
          </p>
        ) : weatherQuery.data ? (
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3 space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              {t("trip.weatherExpectedForSelectedDay")}
            </p>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold tabular-nums leading-none">
                  {weatherQuery.data.expectedHighC}C / {weatherQuery.data.expectedLowC}C
                </p>
                <p className="mt-1 text-sm text-foreground/80 capitalize">
                  {weatherQuery.data.description}
                </p>
              </div>
              {weatherQuery.data.precipitationChance != null ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Droplets className="h-3.5 w-3.5 text-sky-500" aria-hidden />
                  {weatherQuery.data.precipitationChance}%
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("trip.weatherUnavailable")}
          </p>
        )}
      </div>

      <div className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm p-3 space-y-2 transition-shadow duration-200 hover:shadow-md">
        <div className="px-1">
          <h3 className="text-sm font-semibold text-foreground">
            {t("trip.minimapTitle")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("trip.minimapSubtitle")}
          </p>
        </div>

        {staticMapUrl ? (
          <button
            type="button"
            onClick={onViewMap}
            disabled={!showViewOnMap}
            className="group block w-full overflow-hidden rounded-lg border border-border/60 bg-muted/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
            aria-label={t("trip.openMapFullscreen")}
          >
            <img
              src={staticMapUrl}
              alt={`${t("trip.minimapTitle")} - ${destination || "trip"}`}
              className="h-32 w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
              loading="lazy"
            />
          </button>
        ) : (
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
            {t("trip.minimapEmpty")}
          </div>
        )}
      </div>
    </aside>
  );
}
