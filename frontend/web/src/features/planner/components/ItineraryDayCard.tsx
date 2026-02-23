/**
 * ItineraryDayCard
 *
 * Displays one day of a trip itinerary as a timeline of activity cards.
 * Each activity shows: photo hero (if available), type icon, time slot,
 * name, star rating, opening hours, cost, status badge.
 */

import { format } from "date-fns";
import {
  Building2,
  MapPin,
  Train,
  Pencil,
  Clock,
  DollarSign,
  Star,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ItineraryDay, Activity } from "@/utils/schemas";
import { getGoogleMapsUrl } from "../utils/maps";

// ─── Types ────────────────────────────────────────────────

interface ItineraryDayCardProps {
  day: ItineraryDay;
  currency?: string;
}

// ─── Activity type metadata ────────────────────────────────

const TYPE_META: Record<
  Activity["type"],
  { icon: React.ElementType; label: string; color: string; bg: string }
> = {
  accommodation: {
    icon: Building2,
    label: "Stay",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-950",
  },
  poi: {
    icon: MapPin,
    label: "Activity",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  transport: {
    icon: Train,
    label: "Transport",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-950",
  },
  custom: {
    icon: Pencil,
    label: "Custom",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
};

// ─── Status badge variant ──────────────────────────────────

const STATUS_VARIANT: Record<
  Activity["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  planned: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
};

// ─── Time helpers ─────────────────────────────────────────

/** Default activity duration in minutes when no endTime + no next activity */
const DEFAULT_DURATION: Record<Activity["type"], number> = {
  poi: 180, // 3 hours
  accommodation: 60,
  transport: 90,
  custom: 120,
};

/** Add minutes to an "HH:MM" string → "HH:MM" */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Derive the end time for an activity.
 * Priority: activity.endTime > nextActivity.time > type default.
 */
function deriveEndTime(
  activity: Activity,
  nextTime?: string,
): string | undefined {
  if (activity.endTime) return activity.endTime;
  if (!activity.time) return undefined;
  if (nextTime) return nextTime;
  return addMinutes(activity.time, DEFAULT_DURATION[activity.type] ?? 120);
}

// ─── Time formatter ────────────────────────────────────────

function formatTimeRange(time?: string, endTime?: string): string {
  if (!time) return "";
  const fmt = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}:${m} ${ampm}`;
  };
  return endTime ? `${fmt(time)} – ${fmt(endTime)}` : fmt(time);
}

// ─── Star rating component ─────────────────────────────────

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={`Rating: ${value} out of 5`}
    >
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} className="h-3 w-3 fill-amber-400 text-amber-400" />
      ))}
      {half && (
        <span className="relative inline-flex h-3 w-3">
          <Star className="absolute inset-0 h-3 w-3 text-muted-foreground/30" />
          <span className="absolute inset-0 overflow-hidden w-[50%]">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          </span>
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} className="h-3 w-3 text-muted-foreground/30" />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">
        {value.toFixed(1)}
      </span>
    </span>
  );
}

// ─── Sub-component: single activity row ───────────────────

function ActivityRow({
  activity,
  derivedEndTime,
  currency = "USD",
  isLast,
}: {
  activity: Activity;
  derivedEndTime?: string;
  currency?: string;
  isLast: boolean;
}) {
  const meta = TYPE_META[activity.type] ?? TYPE_META.custom;
  const Icon = meta.icon;
  const timeLabel = formatTimeRange(activity.time, derivedEndTime);

  return (
    <div className="relative flex gap-3 pb-4">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-[1.1rem] top-9 bottom-0 w-px bg-border" />
      )}

      {/* Icon circle */}
      <div
        className={`shrink-0 mt-1 h-9 w-9 rounded-full flex items-center justify-center z-10 ${meta.bg}`}
      >
        <Icon className={`h-4 w-4 ${meta.color}`} aria-hidden="true" />
      </div>

      {/* Card body */}
      <div className="flex-1 min-w-0 rounded-lg border bg-card shadow-sm overflow-hidden">
        {/* Photo hero */}
        {activity.photoUrl && (
          <div className="w-full h-36 overflow-hidden">
            <img
              src={activity.photoUrl}
              alt={activity.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-3">
          {/* Top row: time + status */}
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            {timeLabel ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {timeLabel}
              </span>
            ) : (
              <span />
            )}
            <Badge
              variant={STATUS_VARIANT[activity.status]}
              className="text-xs capitalize h-5"
            >
              {activity.status}
            </Badge>
          </div>

          {/* Activity name */}
          <p className="font-medium text-sm leading-snug line-clamp-2">
            {activity.name}
          </p>

          <a
            href={getGoogleMapsUrl(activity)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:text-primary/80 transition-colors focus:outline-none focus:underline"
            aria-label={`View ${activity.name} on Google Maps`}
          >
            <MapPin className="h-3 w-3" aria-hidden="true" />
            <span className="truncate hover:underline">View on map</span>
            <ExternalLink className="h-3 w-3 ml-0.5" aria-hidden="true" />
          </a>

          {/* Rating */}
          {activity.rating !== undefined && activity.rating > 0 && (
            <div className="mt-1.5 border-t pt-1.5 border-border/40">
              <StarRating value={activity.rating} />
            </div>
          )}

          {/* Opening hours */}
          {activity.openingHours && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{activity.openingHours}</span>
            </div>
          )}

          {/* Bottom row: type label + cost */}
          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/40 flex-wrap gap-1">
            <span className={`text-xs font-medium ${meta.color}`}>
              {meta.label}
            </span>
            {activity.cost != null && activity.cost > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" aria-hidden="true" />
                {activity.cost.toLocaleString()} {currency}
              </span>
            )}
          </div>

          {/* Notes */}
          {activity.notes && (
            <p className="mt-1.5 pt-1.5 border-t border-border/40 text-xs text-muted-foreground italic line-clamp-2">
              {activity.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────

export function ItineraryDayCard({ day, currency }: ItineraryDayCardProps) {
  const dateLabel = (() => {
    try {
      // Parse only the calendar date (YYYY-MM-DD) to avoid UTC→local timezone
      // shifting: "2026-02-19T00:00:00.000Z" → Feb 18 in UTC-5 without this fix.
      const dateOnly = day.date.slice(0, 10); // "YYYY-MM-DD"
      const [year, month, dayOfMonth] = dateOnly.split("-").map(Number);
      const localDate = new Date(year!, month! - 1, dayOfMonth!);
      return format(localDate, "EEEE, MMM d");
    } catch {
      return `Day ${day.day}`;
    }
  })();

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Day header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Day {day.day}
          </span>
          <p className="font-semibold text-sm text-foreground">{dateLabel}</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {day.activities.length}{" "}
          {day.activities.length === 1 ? "activity" : "activities"}
        </Badge>
      </div>

      {/* Activities timeline */}
      <div className="px-4 pt-4">
        {day.activities.length === 0 ? (
          <p className="text-sm text-muted-foreground pb-4">
            No activities for this day yet.
          </p>
        ) : (
          (() => {
            const sorted = day.activities.slice().sort((a, b) => {
              if (a.time && b.time) return a.time.localeCompare(b.time);
              return a.order - b.order;
            });
            return sorted.map((activity, idx) => (
              <ActivityRow
                key={activity._id ?? idx}
                activity={activity}
                currency={currency}
                derivedEndTime={deriveEndTime(activity, sorted[idx + 1]?.time)}
                isLast={idx === sorted.length - 1}
              />
            ));
          })()
        )}
      </div>
    </div>
  );
}
