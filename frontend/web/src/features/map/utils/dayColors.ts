/**
 * Palette of 10 distinct colors for itinerary day groups.
 * Each day number maps to a consistent hex color used for
 * Mapbox markers, lines, and the legend.
 */

export const DAY_COLORS = [
  "#6366f1", // Day 1  — Indigo
  "#22c55e", // Day 2  — Green
  "#f59e0b", // Day 3  — Amber
  "#ef4444", // Day 4  — Red
  "#3b82f6", // Day 5  — Blue
  "#ec4899", // Day 6  — Pink
  "#14b8a6", // Day 7  — Teal
  "#f97316", // Day 8  — Orange
  "#8b5cf6", // Day 9  — Violet
  "#06b6d4", // Day 10 — Cyan
] as const;

/**
 * Returns a color for the given 1-based day number.
 * Loops through the palette if trip has > 10 days.
 */
export function getDayColor(dayNumber: number): string {
  const index = (dayNumber - 1) % DAY_COLORS.length;
  return DAY_COLORS[index];
}

/** Light (bg) version of each color for UI chips and panels */
export function getDayColorLight(dayNumber: number): string {
  const index = (dayNumber - 1) % DAY_COLORS.length;
  return DAY_COLORS_LIGHT[index];
}

export const DAY_COLORS_LIGHT = [
  "#e0e7ff", // Day 1
  "#dcfce7", // Day 2
  "#fef3c7", // Day 3
  "#fee2e2", // Day 4
  "#dbeafe", // Day 5
  "#fce7f3", // Day 6
  "#ccfbf1", // Day 7
  "#ffedd5", // Day 8
  "#ede9fe", // Day 9
  "#cffafe", // Day 10
] as const;
