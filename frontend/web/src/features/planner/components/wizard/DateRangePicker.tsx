/**
 * DateRangePicker
 *
 * Reusable date range picker component for the trip wizard (and any other feature).
 * Uses react-day-picker v9 + date-fns + shadcn Popover.
 *
 * Responsive:
 *  - Mobile (<640px) : 1 month
 *  - Desktop (≥640px): 2 months side by side
 *
 * Accessible:
 *  - Full keyboard nav (react-day-picker built-in)
 *  - aria-label on trigger
 *  - Focus ring on all interactive elements
 *
 * Theme:
 *  - All colours via CSS vars (--primary, --background, etc.)
 *  - Works in dark + light mode with zero JS
 */

import { useState, useCallback } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, differenceInCalendarDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import "@/styles/calendar.css";

// ─── Types ────────────────────────────────────────────────

export interface DateRangePickerProps {
  /** ISO date string "YYYY-MM-DD" */
  startDate: string;
  /** ISO date string "YYYY-MM-DD" */
  endDate: string;
  /** Called whenever a complete range (both dates) is selected */
  onChange: (start: string, end: string) => void;
  /** Optional class applied to the trigger button */
  className?: string;
  /** Earliest selectable date — defaults to today */
  minDate?: Date;
  /** Placeholder label shown before any dates are selected */
  placeholder?: string;
}

// ─── Helpers ──────────────────────────────────────────────

function toDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso + "T00:00:00"); // avoid UTC midnight offset
  return isNaN(d.getTime()) ? undefined : d;
}

function toISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function formatLabel(from: Date | undefined, to: Date | undefined): string {
  if (!from) return "";
  const fromStr = format(from, "MMM d, yyyy");
  if (!to) return fromStr;
  const toStr = format(to, "MMM d, yyyy");
  const nights = differenceInCalendarDays(to, from);
  return `${fromStr} – ${toStr} · ${nights} day${nights !== 1 ? "s" : ""}`;
}

// ─── Component ────────────────────────────────────────────

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className,
  minDate,
  placeholder = "Select travel dates",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  // Internal range state — synced from props
  const from = toDate(startDate);
  const to = toDate(endDate);
  const range: DateRange = { from, to };

  // Responsive: detect screen width for numberOfMonths
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const handleSelect = useCallback(
    (selected: DateRange | undefined) => {
      if (!selected?.from) return;
      const newFrom = toISO(selected.from);
      const newTo = selected.to ? toISO(selected.to) : "";
      onChange(newFrom, newTo);
      // Close popover once a complete range is chosen
      if (selected.from && selected.to) {
        setOpen(false);
      }
    },
    [onChange],
  );

  const label = formatLabel(from, to);
  const today = minDate ?? new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3",
            !label && "text-muted-foreground",
            className,
          )}
          aria-label={label || placeholder}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">{label || placeholder}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-3"
        align="start"
        // Wider on desktop to fit 2 months
        style={{ maxWidth: "min(calc(100vw - 2rem), 680px)" }}
      >
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={isMobile ? 1 : 2}
          disabled={{ before: today }}
          defaultMonth={from ?? today}
          showOutsideDays
          className="rdp-root"
        />
        {/* Clear button */}
        {(from || to) && (
          <div className="flex justify-end border-t border-border pt-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                onChange("", "");
                setOpen(false);
              }}
            >
              Clear dates
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
