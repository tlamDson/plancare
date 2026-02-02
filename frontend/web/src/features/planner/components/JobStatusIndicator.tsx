/**
 * Job Status Indicator Component
 *
 * Section 2.2: Real-Time Feedback
 * Displays "Intermediate Steps" (e.g., "Scanning Weather...", "Verifying Prices")
 * NOT just a generic "Loading..." spinner
 */

import { Loader2, CheckCircle, XCircle, Clock, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/utils/schemas";

interface JobStatusIndicatorProps {
  status: JobStatus;
  progress?: number;
  currentStep?: string | null;
  className?: string;
  /** Show detailed progress bar */
  showProgress?: boolean;
}

const statusConfig: Record<
  JobStatus,
  { icon: typeof Loader2; label: string; color: string }
> = {
  IDLE: {
    icon: Clock,
    label: "Ready",
    color: "text-muted-foreground",
  },
  QUEUED: {
    icon: Clock,
    label: "In queue...",
    color: "text-yellow-500",
  },
  PROCESSING: {
    icon: Loader2,
    label: "Processing...",
    color: "text-primary",
  },
  COMPLETED: {
    icon: CheckCircle,
    label: "Completed",
    color: "text-green-500",
  },
  FAILED: {
    icon: XCircle,
    label: "Failed",
    color: "text-destructive",
  },
};

export function JobStatusIndicator({
  status,
  progress = 0,
  currentStep,
  className,
  showProgress = true,
}: JobStatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimated = status === "PROCESSING" || status === "QUEUED";

  return (
    <div className={cn("space-y-2", className)}>
      {/* Status Header */}
      <div className="flex items-center gap-2">
        <Icon
          className={cn("h-5 w-5", config.color, isAnimated && "animate-spin")}
          aria-hidden="true"
        />
        <span className={cn("font-medium", config.color)}>{config.label}</span>
      </div>

      {/* Current Step - Section 2.2: Display intermediate steps */}
      {currentStep && status === "PROCESSING" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>{currentStep}</span>
        </div>
      )}

      {/* Progress Bar */}
      {showProgress && (status === "PROCESSING" || status === "QUEUED") && (
        <Progress value={progress} className="h-2" />
      )}
    </div>
  );
}

/**
 * Inline version for compact displays
 */
export function JobStatusBadge({
  status,
  currentStep,
}: {
  status: JobStatus;
  currentStep?: string | null;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimated = status === "PROCESSING" || status === "QUEUED";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        status === "PROCESSING" && "bg-primary/10 text-primary",
        status === "QUEUED" &&
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
        status === "COMPLETED" &&
          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        status === "FAILED" &&
          "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        status === "IDLE" && "bg-muted text-muted-foreground",
      )}
    >
      <Icon
        className={cn("h-3 w-3", isAnimated && "animate-spin")}
        aria-hidden="true"
      />
      <span>{currentStep || config.label}</span>
    </div>
  );
}
