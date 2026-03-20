import { CalendarDays, Map, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslationStore } from "@/stores/useTranslationStore";
import { convertCurrency } from "@/utils/format";

interface TripDetailSummaryRailProps {
  destination?: string;
  dateRange: string;
  totalCalendarDays: number;
  totalStops: number;
  budgetTotal?: number;
  budgetCurrency?: string;
  preferredCurrency: string;
  showViewOnMap: boolean;
  onViewMap: () => void;
}

export function TripDetailSummaryRail({
  destination,
  dateRange,
  totalCalendarDays,
  totalStops,
  budgetTotal,
  budgetCurrency,
  preferredCurrency,
  showViewOnMap,
  onViewMap,
}: TripDetailSummaryRailProps) {
  const { t } = useTranslationStore();

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

  return (
    <aside className="lg:sticky lg:top-4 space-y-4">
      <div className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm p-5 space-y-4 transition-shadow duration-200 hover:shadow-md">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("trip.summary")}
          </h2>
          {destination ? (
            <p className="mt-1 flex items-start gap-2 text-sm font-medium text-foreground">
              <MapPin
                className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground"
                aria-hidden
              />
              <span className="leading-snug">{destination}</span>
            </p>
          ) : null}
        </div>

        {dateRange ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
            <div>
              <p>{dateRange}</p>
              {totalCalendarDays > 0 ? (
                <p className="mt-0.5 text-xs">
                  {totalCalendarDays}{" "}
                  {totalCalendarDays === 1
                    ? t("trip.summaryDaySingular")
                    : t("trip.summaryDayPlural")}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
          <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
            {t("trip.totalStops")}
          </p>
          <p className="text-lg font-semibold tabular-nums">{totalStops}</p>
        </div>

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
            className="w-full min-h-10 cursor-pointer transition-colors duration-200 gap-2"
            onClick={onViewMap}
          >
            <Map className="h-4 w-4 shrink-0" aria-hidden />
            {t("map.viewOnMap")}
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
