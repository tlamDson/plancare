/**
 * Trip Status Badge Component
 *
 * Feature-specific component for displaying trip status
 */

import { cn } from "@/lib/utils";
import type { TripStatus } from "@/utils/schemas";

interface TripStatusBadgeProps {
  status: TripStatus;
  className?: string;
}

const statusConfig: Record<TripStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  QUEUED: {
    label: "Queued",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  PROCESSING: {
    label: "Processing",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  PROCESSING_STEP_1: {
    label: "Processing (Plan)",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  PROCESSING_STEP_2: {
    label: "Processing (Verify)",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  FALLBACK: {
    label: "Dự phòng",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
};

export function TripStatusBadge({ status, className }: TripStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      data-testid="trip-status-badge"
      data-status={status}
      className={cn(
        "px-2 py-1 rounded-full text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
