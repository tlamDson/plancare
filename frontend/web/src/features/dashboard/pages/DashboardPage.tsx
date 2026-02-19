/**
 * Dashboard Page
 *
 * Main dashboard with trip overview and quick actions
 */

import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WidgetError } from "@/components/WidgetError";
import { useTrips } from "@/features/planner/hooks/useTrips";
import { TripCard } from "@/features/planner/components/TripCard";
import { Plus, Plane, Calendar, Map, Loader2 } from "lucide-react";
import { CreateTripDialog } from "@/features/planner/components";

export default function DashboardPage() {
  const { data: trips, isLoading, error } = useTrips();

  // Filter trips
  const upcomingTrips =
    trips?.filter(
      (trip) => trip.status === "DRAFT" || trip.status === "QUEUED",
    ) || [];
  const activeTrips =
    trips?.filter((trip) => trip.status.startsWith("PROCESSING")) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground">
              Here's what's happening with your trips
            </p>
          </div>
          <CreateTripDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Plan New Trip
              </Button>
            }
          />
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trips?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Trips
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingTrips.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTrips.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trips */}
        <ErrorBoundary
          fallback={
            <WidgetError
              title="Trips Unavailable"
              message="Failed to load your trips"
            />
          }
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Trips</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/trips">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <WidgetError
                  title="Error"
                  message={error.message}
                  onRetry={() => window.location.reload()}
                />
              ) : trips?.length === 0 ? (
                <div className="text-center py-8">
                  <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No trips yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start planning your first adventure!
                  </p>
                  <CreateTripDialog
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Trip
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {trips?.slice(0, 6).map((trip) => (
                    <TripCard key={trip._id} trip={trip} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  );
}
