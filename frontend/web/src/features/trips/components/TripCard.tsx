/**
 * Trip Card Component
 *
 * Feature-specific component (Section 1.1)
 * Lives in features/trips/components, NOT in src/components
 */

import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateRange, getTripDuration } from "@/utils/format";
import type { Trip } from "@/utils/schemas";

interface TripCardProps {
  trip: Trip;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  QUEUED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PROCESSING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  PROCESSING_STEP_1:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  PROCESSING_STEP_2:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function TripCard({ trip }: TripCardProps) {
  const duration = getTripDuration(trip.startDate, trip.endDate);
  const budgetPercentage =
    trip.budget.totalLimit > 0
      ? Math.round((trip.budget.totalSpent / trip.budget.totalLimit) * 100)
      : 0;

  const formatStatusLabel = (status: string) => {
    return status
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Link to={`/trips/${trip._id}`}>
      <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md overflow-hidden">
        <div className="aspect-video relative">
          <img
            src={
              trip.coverImage ||
              "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400"
            }
            alt={trip.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

          {/* Status Badge */}
          <span
            className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[trip.status] || statusColors.DRAFT
            }`}
          >
            {formatStatusLabel(trip.status)}
          </span>

          {/* Agent Processing Indicator */}
          {trip.isAgentProcessing && (
            <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              AI Processing
            </span>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
            {trip.title}
          </h3>

          {trip.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
              {trip.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
            </div>
            <span className="text-muted-foreground">{duration} days</span>
          </div>

          {/* Budget Progress */}
          {trip.budget.totalLimit > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Budget</span>
                <span>
                  {trip.budget.currency}{" "}
                  {trip.budget.totalSpent.toLocaleString()} /{" "}
                  {trip.budget.totalLimit.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budgetPercentage > 90
                      ? "bg-destructive"
                      : budgetPercentage > 70
                        ? "bg-yellow-500"
                        : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
