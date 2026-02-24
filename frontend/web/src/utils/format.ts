/**
 * Date, Time & Currency Formatting Utilities
 * Using Native Browser Intl API for localization
 */

import { differenceInDays, isPast, isFuture } from "date-fns";
import type { Language } from "@/stores/useTranslationStore";

/**
 * Maps the app's Language type to standard BCP 47 locale codes.
 */
export function getLocaleCode(lang?: Language): string {
  switch (lang) {
    case "French":
      return "fr-FR";
    case "Vietnamese":
      return "vi-VN";
    case "English (US)":
    default:
      return "en-US";
  }
}

/**
 * Format a date for display using native Intl API
 * Example: "Feb 23, 2026" (EN), "23 févr. 2026" (FR)
 */
export function formatDate(
  date: string | Date,
  lang?: Language,
  options?: Intl.DateTimeFormatOptions,
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return new Intl.DateTimeFormat(
    getLocaleCode(lang),
    options || defaultOptions,
  ).format(new Date(date));
}

/**
 * Format a date range natively
 * Uses Intl.DateTimeFormat.formatRange to smartly collapse months/years
 * Example: "Feb 23 - 25, 2026"
 */
export function formatDateRange(
  start: string | Date,
  end: string | Date,
  lang?: Language,
): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const locale = getLocaleCode(lang);

  // Create a formatter that handles ranges intelligently
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year:
      startDate.getFullYear() !== endDate.getFullYear() ? "numeric" : undefined,
  });

  try {
    // Support modern browsers that have formatRange
    return (formatter as any).formatRange(startDate, endDate);
  } catch (e) {
    // Fallback for older browsers
    const startStr = new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(startDate);
    const endStr = new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(endDate);
    return `${startStr} - ${endStr}`;
  }
}

/**
 * Format currency natively
 * Example: "$1,250.00" (EN-USD), "1 250,00 €" (FR-EUR), "1.250.000 ₫" (VI-VND)
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  lang?: Language,
): string {
  return new Intl.NumberFormat(getLocaleCode(lang), {
    style: "currency",
    currency: currencyCode || "USD",
    maximumFractionDigits: currencyCode === "VND" ? 0 : 2, // VND doesn't typically display cents
  }).format(amount);
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
