/**
 * Trips Page
 *
 * Full trips list with filtering and sorting
 */

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DataError } from "@/components/DataError";
import { useTrips } from "@/features/planner/hooks/useTrips";
import { TripCard } from "@/features/planner/components/TripCard";
import { Plus, Search, Loader2 } from "lucide-react";
import { CreateTripDialog } from "@/features/planner/components";
import { useTranslationStore } from "@/stores/useTranslationStore";

type FilterStatus =
  | "all"
  | "DRAFT"
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export default function TripsPage() {
  const { data: trips, isLoading, error, refetch } = useTrips();
  const { t } = useTranslationStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  // Filter trips
  const filteredTrips = trips?.filter((trip) => {
    const matchesSearch = trip.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "PROCESSING"
        ? trip.status.startsWith("PROCESSING")
        : trip.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t("trips.pageTitle")}</h1>
            <p className="text-muted-foreground">{t("trips.pageSubtitle")}</p>
          </div>
          <CreateTripDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("trips.newTrip")}
              </Button>
            }
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("trips.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as FilterStatus)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("trips.filterPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("trips.filterAll")}</SelectItem>
              <SelectItem value="DRAFT">{t("trips.filterDraft")}</SelectItem>
              <SelectItem value="QUEUED">{t("trips.filterQueued")}</SelectItem>
              <SelectItem value="PROCESSING">
                {t("trips.filterProcessing")}
              </SelectItem>
              <SelectItem value="COMPLETED">
                {t("trips.filterCompleted")}
              </SelectItem>
              <SelectItem value="FAILED">{t("trips.filterFailed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trip List */}
        <ErrorBoundary>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <DataError
              title={t("trips.errorLoad")}
              message={error.message}
              onRetry={() => refetch()}
            />
          ) : filteredTrips?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== "all"
                  ? t("trips.emptyFilter")
                  : t("trips.emptyAll")}
              </p>
              {!search && statusFilter === "all" && (
                <CreateTripDialog
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t("trips.createFirst")}
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTrips?.map((trip) => (
                <TripCard key={trip._id} trip={trip} />
              ))}
            </div>
          )}
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  );
}
