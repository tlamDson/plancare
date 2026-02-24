import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  formatDateRange,
  getTripDuration,
  formatCurrency,
} from "@/utils/format";
import type { Trip } from "@/utils/schemas";
import { useDeleteTrip } from "../hooks/useTrips";
import { useTranslationStore } from "@/stores/useTranslationStore";

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutate: deleteTrip, isPending: isDeleting } = useDeleteTrip();
  const { language } = useTranslationStore();

  const budgetPercentage =
    trip.budget.totalLimit > 0
      ? Math.round((trip.budget.totalSpent / trip.budget.totalLimit) * 100)
      : 0;

  const formatStatusLabel = (status: string) =>
    status
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <>
      <div className="relative">
        <Link to={`/trips/${trip._id}`}>
          <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md overflow-hidden cursor-pointer">
            <div className="aspect-video relative">
              <img
                src={
                  trip.coverImage ||
                  "https://unsplash.com/photos/a-snow-capped-mountain-in-the-distance-behind-some-trees-uFwPTGf07Sg"
                }
                alt={trip.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

              <span
                className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                  statusColors[trip.status] || statusColors.DRAFT
                }`}
              >
                {formatStatusLabel(trip.status)}
              </span>

              {trip.isAgentProcessing && (
                <span className="absolute top-10 left-3 px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  AI Processing
                </span>
              )}
            </div>

            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1 pr-8">
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
                  <span>
                    {formatDateRange(trip.startDate, trip.endDate, language)}
                  </span>
                </div>
                <span className="text-muted-foreground">{duration} days</span>
              </div>

              {trip.budget.totalLimit > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Budget</span>
                    <span>
                      {formatCurrency(
                        trip.budget.totalSpent,
                        trip.budget.currency,
                        language,
                      )}{" "}
                      /{" "}
                      {formatCurrency(
                        trip.budget.totalLimit,
                        trip.budget.currency,
                        language,
                      )}
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

        {/* ⋮ Actions Menu — always visible, top-right corner, outside the Link */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background border border-border/50 shadow-sm z-10"
              aria-label="Trip actions"
              onClick={(e) => e.preventDefault()}
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MoreVertical className="h-3.5 w-3.5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              disabled={isDeleting || trip.isAgentProcessing}
              onSelect={(e) => {
                e.preventDefault();
                if (!trip.isAgentProcessing) setConfirmOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {trip.isAgentProcessing ? "Processing…" : "Delete trip"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{trip.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this trip and all its itinerary data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteTrip(trip._id);
                setConfirmOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
