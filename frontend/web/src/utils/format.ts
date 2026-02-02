/**
 * Date & Time Formatting Utilities
 */

import {
  format,
  formatDistanceToNow,
  differenceInDays,
  isPast,
  isFuture,
} from "date-fns";

/**
 * Format a date for display
 */
export function formatDate(
  date: string | Date,
  formatStr = "MMM d, yyyy",
): string {
  return format(new Date(date), formatStr);
}

/**
 * Format a date range
 */
export function formatDateRange(
  start: string | Date,
  end: string | Date,
): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  if (sameMonth) {
    return `${format(startDate, "MMM d")} - ${format(endDate, "d, yyyy")}`;
  }

  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
}

/**
 * Get relative time (e.g., "2 days ago")
 */
export function getRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Calculate trip duration in days
 */
export function getTripDuration(
  start: string | Date,
  end: string | Date,
): number {
  return differenceInDays(new Date(end), new Date(start)) + 1;
}

/**
 * Check if a trip is upcoming
 */
export function isUpcoming(startDate: string | Date): boolean {
  return isFuture(new Date(startDate));
}

/**
 * Check if a trip is in the past
 */
export function isPastTrip(endDate: string | Date): boolean {
  return isPast(new Date(endDate));
}
