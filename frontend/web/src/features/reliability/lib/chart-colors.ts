import { useSyncExternalStore } from "react";

/**
 * Chart color roles for the reliability dashboard. Categorical (series)
 * hexes are themed per dataviz's reference palette (slots 1/2/3: blue,
 * orange, aqua); the status palette is fixed — never themed — per the
 * same reference (a status color must stay recognizable regardless of
 * light/dark, since it never carries meaning by hue alone anyway).
 */
export interface ChartPalette {
  seriesQueueWait: string;
  seriesProcessing: string;
  seriesEndToEnd: string;
  statusGood: string;
  statusWarning: string;
  statusCritical: string;
  grid: string;
  axis: string;
}

export function resolveChartPalette(isDark: boolean): ChartPalette {
  return {
    seriesQueueWait: isDark ? "#3987e5" : "#2a78d6",
    seriesProcessing: isDark ? "#d95926" : "#eb6834",
    seriesEndToEnd: isDark ? "#199e70" : "#1baf7a",
    statusGood: "#0ca30c",
    statusWarning: "#fab219",
    statusCritical: "#d03b3b",
    grid: isDark ? "#2c2c2a" : "#e1e0d9",
    axis: "#898781",
  };
}

function isDarkModeActive(): boolean {
  return document.documentElement.classList.contains("dark");
}

function subscribeToThemeChanges(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

/**
 * Reactive current-theme chart palette. Reads the `dark` class the app's
 * useThemeStore toggles on <html> (already resolved from "system" there),
 * so this hook doesn't need its own matchMedia listener.
 */
export function useChartColors(): ChartPalette {
  const isDark = useSyncExternalStore(
    subscribeToThemeChanges,
    isDarkModeActive,
    () => false,
  );
  return resolveChartPalette(isDark);
}
