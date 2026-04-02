/**
 * Inline Google Calendar sync control for trip detail toolbar (desktop).
 */

import { CalendarPlus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ENABLE_GOOGLE_CALENDAR_SYNC } from "@/config/env";
import { useTripCalendarSync } from "../../hooks/useTripCalendarSync";
import { useTranslationStore } from "@/stores/useTranslationStore";

type TripCalendarSyncActionsProps = {
  tripId: string;
  tripStatus: string;
  isAgentProcessing: boolean;
};

export function TripCalendarSyncActions({
  tripId,
  tripStatus,
  isAgentProcessing,
}: TripCalendarSyncActionsProps) {
  const { t } = useTranslationStore();
  const { handleSync, isSyncing, isVip, isUserLoaded } =
    useTripCalendarSync(tripId);

  const show =
    ENABLE_GOOGLE_CALENDAR_SYNC &&
    tripStatus === "COMPLETED" &&
    isUserLoaded;

  if (!show) return null;

  if (!isVip) {
    return (
      <div
        className="flex h-10 items-center gap-1.5 rounded-md border border-dashed px-3 text-xs text-muted-foreground"
        role="note"
      >
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{t("trip.calendarSyncBetaShort")}</span>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void handleSync()}
      disabled={isSyncing || isAgentProcessing}
      className="h-10 px-3 gap-1.5 cursor-pointer transition-colors duration-200"
      aria-label={t("trip.calendarSync")}
    >
      <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
      {isSyncing ? t("trip.calendarSyncing") : t("trip.calendarSync")}
    </Button>
  );
}
