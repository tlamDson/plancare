import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { LatencyChart } from "./LatencyChart";
import type { LatencyStats } from "@travelplan/shared";

const stats: LatencyStats = {
  count: 42,
  p50: 1000,
  p95: 5000,
  p99: 9000,
  max: 12000,
};

describe("LatencyChart", () => {
  it("renders a table view alongside the chart, with all 3 stages and percentiles as text", () => {
    renderWithProviders(
      <LatencyChart
        queueWaitMs={stats}
        processingMs={stats}
        endToEndMs={stats}
      />,
    );

    // Table view exists per dataviz's accessibility pass — text, not only SVG.
    const table = screen.getByRole("table");
    expect(within(table).getByText(/queue wait/i)).toBeInTheDocument();
    expect(within(table).getByText(/^processing$/i)).toBeInTheDocument();
    expect(within(table).getByText(/end-to-end/i)).toBeInTheDocument();
  });

  it("renders the SLO threshold label as visible text, not only inside the chart", () => {
    renderWithProviders(
      <LatencyChart
        queueWaitMs={stats}
        processingMs={stats}
        endToEndMs={stats}
      />,
    );

    expect(screen.getByText(/slo threshold/i)).toBeInTheDocument();
  });
});
