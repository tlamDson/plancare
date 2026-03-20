/**
 * VIP-only Google Calendar sync entry (incremental scope on click).
 */

import { CalendarPlus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ENABLE_GOOGLE_CALENDAR_SYNC } from "@/config/env";
import { useTripCalendarSync } from "../../hooks/useTripCalendarSync";

type TripCalendarSyncActionsProps = {
  tripId: string | undefined;
  tripStatus: string;
  isAgentProcessing: boolean;
};

export function TripCalendarSyncActions({
  tripId,
  tripStatus,
  isAgentProcessing,
}: TripCalendarSyncActionsProps) {
  const { handleSync, isSyncing, isVip, isUserLoaded } =
    useTripCalendarSync(tripId);

  if (!ENABLE_GOOGLE_CALENDAR_SYNC || tripStatus !== "COMPLETED") {
    return null;
  }

  if (!isUserLoaded) {
    return null;
  }

  if (!isVip) {
    return (
      <span
        className="inline-flex max-w-[220px] items-start gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors duration-200 sm:max-w-[260px]"
        role="note"
      >
        <Lock
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span>
          Đồng bộ Google Calendar đang trong giai đoạn thử nghiệm nội bộ (beta).
        </span>
      </span>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={() => void handleSync()}
      disabled={isSyncing || isAgentProcessing || !tripId}
      className="gap-1.5 min-h-10 cursor-pointer transition-colors duration-200"
      aria-label="Sync to Google Calendar"
      title="Đồng bộ lịch trình lên Google Calendar của bạn"
    >
      <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
      {isSyncing ? "Đang đồng bộ..." : "Sync Google Calendar"}
    </Button>
  );
}
