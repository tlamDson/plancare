/**
 * DatePicker
 *
 * Reusable single-date picker.
 * Uses the same react-day-picker v9 + date-range-picker.css theming
 * as DateRangePicker so both pickers look identical.
 *
 * Responsive:
 *  - Mobile (<640px): 1 month in popover, full-width trigger
 *  - Desktop: popover aligns to the trigger, fixed width
 *
 * Accessible:
 *  - keyboard nav (react-day-picker built-in)
 *  - aria-label on trigger
 *  - focus ring on all interactive elements
 */

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import "./date-range-picker.css";

// ─── Types ────────────────────────────────────────────────

export interface DatePickerProps {
  /** ISO date string "YYYY-MM-DD" or empty string */
  value: string;
  /** Called with the selected ISO date string */
  onChange: (date: string) => void;
  /** Earliest selectable date */
  minDate?: Date;
  /** Latest selectable date */
  maxDate?: Date;
  /** Placeholder shown when no date is selected */
  placeholder?: string;
  /** Optional extra class on the trigger button */
  className?: string;
  /** aria-label for the trigger button */
  ariaLabel?: string;
}

// ─── Helper ───────────────────────────────────────────────

function toDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? undefined : d;
}

// ─── Component ────────────────────────────────────────────

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
  className,
  ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = toDate(value);
  const today = minDate ?? new Date();
  today.setHours(0, 0, 0, 0);

  const label = selected ? format(selected, "MMM d, yyyy") : "";

  const handleSelect = (day: Date | undefined) => {
    if (!day) return;
    const isoDate = format(day, "yyyy-MM-dd");
    console.log(
      `[DatePicker] 📅 Date selected — field: "${ariaLabel ?? placeholder}" | value: ${isoDate} (${format(day, "EEEE, MMMM d yyyy")})`,
    );
    onChange(isoDate);
    setOpen(false);
  };

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
          aria-label={ariaLabel ?? (label || placeholder)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">{label || placeholder}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-3" align="start">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={[
            { before: today },
            ...(maxDate ? [{ after: maxDate }] : []),
          ]}
          defaultMonth={selected ?? today}
          showOutsideDays
          className="rdp-root"
        />
        {/* Clear button */}
        {selected && (
          <div className="flex justify-end border-t border-border pt-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
