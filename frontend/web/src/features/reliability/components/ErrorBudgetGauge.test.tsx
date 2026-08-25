import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ErrorBudgetGauge } from "./ErrorBudgetGauge";
import type { ErrorBudget, SliResult } from "@travelplan/shared";

const healthySli: SliResult = {
  validEvents: 100,
  goodEvents: 95,
  badEvents: 5,
  sli: 0.95,
  insufficientData: false,
};

const healthyBudget: ErrorBudget = {
  target: 0.9,
  budgetTotal: 10,
  budgetConsumed: 5,
  budgetRemaining: 5,
  consumedRatio: 0.5,
  burnRate: 0.5,
  exhaustsAt: null,
};

describe("ErrorBudgetGauge", () => {
  it("renders 'not enough data' instead of a percentage when insufficientData is true", () => {
    renderWithProviders(
      <ErrorBudgetGauge
        sli={{ ...healthySli, sli: null, insufficientData: true }}
        errorBudget={healthyBudget}
      />,
    );

    expect(screen.getByText(/not enough data/i)).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("renders a healthy status when consumedRatio is well under 1", () => {
    renderWithProviders(
      <ErrorBudgetGauge sli={healthySli} errorBudget={healthyBudget} />,
    );

    expect(screen.getByText(/healthy/i)).toBeInTheDocument();
  });

  it("renders an exhausted status (not just a red color) when consumedRatio > 1", () => {
    renderWithProviders(
      <ErrorBudgetGauge
        sli={{ ...healthySli, sli: 0.7, badEvents: 30, goodEvents: 70 }}
        errorBudget={{
          ...healthyBudget,
          consumedRatio: 1.5,
          budgetRemaining: 0,
          burnRate: 1.5,
        }}
      />,
    );

    expect(screen.getByText(/budget exhausted/i)).toBeInTheDocument();
  });

  it("renders the exhaustion projection date when provided", () => {
    renderWithProviders(
      <ErrorBudgetGauge
        sli={healthySli}
        errorBudget={{
          ...healthyBudget,
          exhaustsAt: "2026-09-01T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/projected exhaustion/i)).toBeInTheDocument();
  });
});
