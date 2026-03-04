/**
 * DayLegend
 *
 * Small legend overlay for the map showing which color corresponds
 * to which day. Rendered as an absolute-positioned card on the map.
 */

import { getDayColor, getDayColorLight } from "../utils/dayColors";
import { useTranslationStore } from "@/stores/useTranslationStore";
import type { ItineraryDay } from "@/utils/schemas";

interface DayLegendProps {
  itinerary: ItineraryDay[];
  activeDay: number | null;
  onDayClick: (day: number) => void;
}

export function DayLegend({
  itinerary,
  activeDay,
  onDayClick,
}: DayLegendProps) {
  const { t } = useTranslationStore();

  const sortedDays = [...itinerary]
    .sort((a, b) => a.day - b.day)
    .filter((d) =>
      d.activities.some(
        (a) => a.location?.coordinates && a.location.coordinates.length === 2,
      ),
    );

  if (sortedDays.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-sm border border-border rounded-xl shadow-lg p-3 max-h-60 overflow-y-auto w-44">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {t("trip.itinerary")}
      </p>
      <div className="flex flex-col gap-1.5">
        {sortedDays.map((day) => {
          const color = getDayColor(day.day);
          const bg = getDayColorLight(day.day);
          const isActive = activeDay === day.day;
          const validCount = day.activities.filter(
            (a) =>
              a.location?.coordinates && a.location.coordinates.length === 2,
          ).length;

          return (
            <button
              key={day.day}
              onClick={() => onDayClick(day.day)}
              aria-label={`${t("map.flyToDay")} ${day.day}`}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                isActive ? "ring-2 ring-offset-1" : "hover:opacity-80"
              }`}
              style={{
                backgroundColor: isActive ? bg : "transparent",
                outlineColor: isActive ? color : "transparent",
              }}
            >
              {/* Color dot */}
              <span
                className="shrink-0 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span className="text-xs font-medium leading-tight">
                {t("map.day")} {day.day}
                <span className="block text-muted-foreground font-normal">
                  {validCount} {t("map.activities")}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
