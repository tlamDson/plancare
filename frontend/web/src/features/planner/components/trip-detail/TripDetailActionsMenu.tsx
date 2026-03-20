/**
 * Trip menu: dates, lifecycle status, and actions (fix locations, calendar, map, undo).
 */

import {
  CalendarPlus,
  CalendarDays,
  Lock,
  Map,
  MapPin,
  MoreHorizontal,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ENABLE_GOOGLE_CALENDAR_SYNC } from "@/config/env";
import { useTripCalendarSync } from "../../hooks/useTripCalendarSync";
import { useTranslationStore } from "@/stores/useTranslationStore";

type TripDetailActionsMenuProps = {
  tripId: string;
  tripStatus: string;
  isAgentProcessing: boolean;
  hasMapData: boolean;
  dateRange: string;
  totalDays: number;
  lifecycle: string | undefined;
  onLifecycleChange: (val: string) => void;
  isUpdatingLifecycle: boolean;
  showFixLocations: boolean;
  isReGeocoding: boolean;
  onReGeocode: () => void;
  showUndo: boolean;
  canUndo: boolean;
  isUndoing: boolean;
  onUndo: () => void;
  onViewMap: () => void;
};

export function TripDetailActionsMenu({
  tripId,
  tripStatus,
  isAgentProcessing,
  hasMapData,
  dateRange,
  totalDays,
  lifecycle,
  onLifecycleChange,
  isUpdatingLifecycle,
  showFixLocations,
  isReGeocoding,
  onReGeocode,
  showUndo,
  canUndo,
  isUndoing,
  onUndo,
  onViewMap,
}: TripDetailActionsMenuProps) {
  const { t } = useTranslationStore();
  const { handleSync, isSyncing, isVip, isUserLoaded } =
    useTripCalendarSync(tripId);

  const showCalendarEntry =
    ENABLE_GOOGLE_CALENDAR_SYNC && tripStatus === "COMPLETED" && isUserLoaded;

  const mapEligible = tripStatus === "COMPLETED" && hasMapData;
  const showLifecycle = tripStatus === "COMPLETED";
  const hasDateBlock = Boolean(dateRange);
  const hasActionItems =
    showFixLocations ||
    showCalendarEntry ||
    mapEligible ||
    (showUndo && canUndo);

  const showMenu =
    hasDateBlock || showLifecycle || hasActionItems;

  if (!showMenu) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-2 px-3 shrink-0 cursor-pointer"
          aria-label={t("trip.actionsMenu")}
          aria-haspopup="menu"
        >
          <MoreHorizontal className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline text-xs font-medium">
            {t("trip.actionsMenu")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {hasDateBlock ? (
          <>
            <DropdownMenuLabel className="font-normal cursor-default px-2 py-2">
              <div className="flex items-start gap-2 text-left">
                <CalendarDays
                  className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground"
                  aria-hidden
                />
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {dateRange}
                  </p>
                  {totalDays > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {totalDays === 1
                        ? t("trip.menuDurationOneDay")
                        : t("trip.menuDurationNDays").replace(
                            "{n}",
                            String(totalDays),
                          )}
                    </p>
                  ) : null}
                </div>
              </div>
            </DropdownMenuLabel>
            {(showLifecycle || hasActionItems) && <DropdownMenuSeparator />}
          </>
        ) : null}

        {showLifecycle ? (
          <>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground normal-case px-2 py-1.5">
              {t("trip.lifecycleLabel")}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={lifecycle || "UPCOMING"}
              onValueChange={onLifecycleChange}
            >
              <DropdownMenuRadioItem
                value="UPCOMING"
                disabled={isUpdatingLifecycle || isAgentProcessing}
                className="text-sm"
              >
                {t("trip.lifecycle_upcoming")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="IN_TRIP"
                disabled={isUpdatingLifecycle || isAgentProcessing}
                className="text-sm"
              >
                {t("trip.lifecycle_in_trip")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="COMPLETED"
                disabled={isUpdatingLifecycle || isAgentProcessing}
                className="text-sm"
              >
                {t("trip.lifecycle_completed")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="CANCELLED"
                disabled={isUpdatingLifecycle || isAgentProcessing}
                className="text-sm text-muted-foreground"
              >
                {t("trip.lifecycle_cancelled")}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            {hasActionItems ? <DropdownMenuSeparator /> : null}
          </>
        ) : null}

        {showFixLocations ? (
          <DropdownMenuItem
            onClick={onReGeocode}
            disabled={isReGeocoding || isAgentProcessing}
            className="cursor-pointer gap-2"
          >
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            {isReGeocoding ? t("trip.reGeocoding") : t("trip.fixLocations")}
          </DropdownMenuItem>
        ) : null}

        {showCalendarEntry ? (
          isVip ? (
            <DropdownMenuItem
              onClick={() => void handleSync()}
              disabled={isSyncing || isAgentProcessing}
              className="cursor-pointer gap-2"
            >
              <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
              {isSyncing ? t("trip.calendarSyncing") : t("trip.calendarSync")}
            </DropdownMenuItem>
          ) : (
            <div className="px-2 py-2 text-xs text-muted-foreground flex gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
              <span>{t("trip.calendarSyncBetaShort")}</span>
            </div>
          )
        ) : null}

        {mapEligible ? (
          <DropdownMenuItem onClick={onViewMap} className="cursor-pointer gap-2">
            <Map className="h-4 w-4 shrink-0" aria-hidden />
            {t("map.viewOnMap")}
          </DropdownMenuItem>
        ) : null}

        {showUndo && canUndo ? (
          <>
            {(showFixLocations || showCalendarEntry || mapEligible) && (
              <DropdownMenuSeparator />
            )}
            <DropdownMenuItem
              onClick={onUndo}
              disabled={isUndoing || isAgentProcessing}
              className="cursor-pointer gap-2"
            >
              <Undo2 className="h-4 w-4 shrink-0" aria-hidden />
              {isUndoing ? t("trip.undoing") : t("trip.undo")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
