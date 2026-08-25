import { describe, it, expect } from "vitest";
import { resolveChartPalette } from "./chart-colors";

describe("resolveChartPalette", () => {
  it("returns the light-mode categorical + status hexes when isDark is false", () => {
    const palette = resolveChartPalette(false);

    expect(palette.seriesQueueWait).toBe("#2a78d6");
    expect(palette.seriesProcessing).toBe("#eb6834");
    expect(palette.seriesEndToEnd).toBe("#1baf7a");
    expect(palette.statusGood).toBe("#0ca30c");
    expect(palette.statusWarning).toBe("#fab219");
    expect(palette.statusCritical).toBe("#d03b3b");
    expect(palette.grid).toBe("#e1e0d9");
    expect(palette.axis).toBe("#898781");
  });

  it("returns the dark-mode categorical hexes when isDark is true, status hexes unchanged", () => {
    const palette = resolveChartPalette(true);

    expect(palette.seriesQueueWait).toBe("#3987e5");
    expect(palette.seriesProcessing).toBe("#d95926");
    expect(palette.seriesEndToEnd).toBe("#199e70");
    // Status palette is fixed — never themed (dataviz reference palette rule).
    expect(palette.statusGood).toBe("#0ca30c");
    expect(palette.statusWarning).toBe("#fab219");
    expect(palette.statusCritical).toBe("#d03b3b");
    expect(palette.grid).toBe("#2c2c2a");
    expect(palette.axis).toBe("#898781");
  });
});
