import * as React from "react";

import { cn } from "@/lib/utils";

// Simplified chart component - placeholder for recharts integration
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("w-full", className)} {...props} />
));
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);
const ChartTooltipContent = ({ children }: { children?: React.ReactNode }) => (
  <div>{children}</div>
);
const ChartLegend = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);
const ChartLegendContent = ({ children }: { children?: React.ReactNode }) => (
  <div>{children}</div>
);

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
};
