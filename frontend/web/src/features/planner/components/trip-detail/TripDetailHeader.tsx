import type { ReactNode } from "react";
import {
  CalendarDays,
  Check,
  Edit2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslationStore } from "@/stores/useTranslationStore";

interface TripDetailHeaderProps {
  tripTitleLocalized: string;
  status: string;
  isAgentProcessing: boolean;
  isEditingTitle: boolean;
  editTitleValue: string;
  onEditTitleValueChange: (v: string) => void;
  onStartEditTitle: () => void;
  onSaveTitle: () => void;
  onCancelEditTitle: () => void;
  onTitleKeyDown: (e: React.KeyboardEvent) => void;
  isUpdatingTrip: boolean;
  lifecycle: string | undefined;
  onLifecycleChange: (val: string) => void;
  isUpdatingLifecycle: boolean;
  dateRange: string;
  totalDays: number;
  /** Toolbar: Fix map, Sync calendar, View map, Undo, etc. */
  actions: ReactNode;
}

export function TripDetailHeader({
  tripTitleLocalized,
  status,
  isAgentProcessing,
  isEditingTitle,
  editTitleValue,
  onEditTitleValueChange,
  onStartEditTitle,
  onSaveTitle,
  onCancelEditTitle,
  onTitleKeyDown,
  isUpdatingTrip,
  lifecycle,
  onLifecycleChange,
  isUpdatingLifecycle,
  dateRange,
  totalDays,
  actions,
}: TripDetailHeaderProps) {
  const { t } = useTranslationStore();

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {isEditingTitle ? (
            <div className="flex items-center gap-1 flex-wrap">
              <Input
                autoFocus
                value={editTitleValue}
                onChange={(e) => onEditTitleValueChange(e.target.value)}
                onKeyDown={onTitleKeyDown}
                disabled={isUpdatingTrip}
                className="h-9 md:h-10 text-xl font-bold md:text-3xl w-[200px] md:w-[350px] shadow-sm"
                aria-label={t("trip.editTitle")}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors duration-200"
                onClick={onSaveTitle}
                disabled={isUpdatingTrip}
                aria-label={t("trip.saveTitle")}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer transition-colors duration-200"
                onClick={onCancelEditTitle}
                disabled={isUpdatingTrip}
                aria-label={t("trip.cancelEdit")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-3xl font-bold truncate">
                {tripTitleLocalized}
              </h1>
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 shrink-0 cursor-pointer transition-colors duration-200 border-border"
                onClick={onStartEditTitle}
                title={t("trip.editTitle")}
                aria-label={t("trip.editTitle")}
              >
                <Edit2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )}

          {status === "COMPLETED" && (
            <Select
              value={lifecycle || "UPCOMING"}
              onValueChange={(val: string) => onLifecycleChange(val)}
              disabled={isUpdatingLifecycle || isAgentProcessing}
            >
              <SelectTrigger className="h-8 min-w-[120px] text-xs font-medium px-3 shadow-sm border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors duration-200 focus:ring-1 focus:ring-primary rounded-full cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPCOMING">{t("trip.lifecycle_upcoming")}</SelectItem>
                <SelectItem value="IN_TRIP">{t("trip.lifecycle_in_trip")}</SelectItem>
                <SelectItem value="COMPLETED">{t("trip.lifecycle_completed")}</SelectItem>
                <SelectItem value="CANCELLED" className="text-muted-foreground">
                  {t("trip.lifecycle_cancelled")}
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {dateRange ? (
          <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              {dateRange}
              {totalDays > 0 && ` · ${totalDays}-day trip`}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap md:justify-end">
        {actions}
      </div>
    </div>
  );
}
