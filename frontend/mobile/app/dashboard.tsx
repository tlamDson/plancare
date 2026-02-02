import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuthStore } from "../stores/useAuthStore";
import { useTripsStore } from "../stores/useTripsStore";
import {
  Plane,
  Map,
  DollarSign,
  Globe,
  Plus,
  Sparkles,
  LogOut,
  Calendar,
  ArrowRight,
} from "lucide-react-native";

export default function DashboardScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const trips = useTripsStore((state) => state.trips);

  const upcomingTrips = trips.filter(
    (t) => t.status === "upcoming" || t.status === "planning"
  );
  const totalBudget = trips.reduce((acc, t) => acc + t.budget, 0);
  const totalSpent = trips.reduce((acc, t) => acc + t.spent, 0);

  const handleSignOut = () => {
    signOut();
    router.replace("/");
  };

  const stats = [
    {
      icon: Plane,
      label: "Trips",
      value: trips.length.toString(),
      color: colors.primary,
    },
    {
      icon: DollarSign,
      label: "Budget",
      value: `$${totalBudget.toLocaleString()}`,
      color: "#22c55e",
    },
    {
      icon: Globe,
      label: "Spent",
      value: `$${totalSpent.toLocaleString()}`,
      color: "#f59e0b",
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Welcome back,
            </Text>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {user?.name || "Traveler"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <ThemeToggle />
            <TouchableOpacity
              onPress={handleSignOut}
              style={[styles.signOutBtn, { backgroundColor: colors.muted }]}
            >
              <LogOut size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <View
              key={index}
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <stat.icon size={20} color={stat.color} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {stat.value}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/trips")}
            >
              <Plus size={24} color={colors.primaryForeground} />
              <Text
                style={[
                  styles.actionLabel,
                  { color: colors.primaryForeground },
                ]}
              >
                New Trip
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.muted }]}
              onPress={() => router.push("/assistant")}
            >
              <Sparkles size={24} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>
                AI Assistant
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Trips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Upcoming Trips
            </Text>
            <TouchableOpacity onPress={() => router.push("/trips")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {upcomingTrips.length === 0 ? (
            <Card>
              <CardContent>
                <Text
                  style={[styles.emptyText, { color: colors.mutedForeground }]}
                >
                  No upcoming trips. Start planning your next adventure!
                </Text>
              </CardContent>
            </Card>
          ) : (
            upcomingTrips.slice(0, 3).map((trip) => (
              <Card key={trip.id} style={{ marginBottom: 12 }}>
                <CardContent>
                  <View style={styles.tripRow}>
                    <View style={styles.tripInfo}>
                      <Text
                        style={[styles.tripName, { color: colors.foreground }]}
                      >
                        {trip.name}
                      </Text>
                      <View style={styles.tripMeta}>
                        <Map size={14} color={colors.mutedForeground} />
                        <Text
                          style={[
                            styles.tripDestination,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {trip.destination}
                        </Text>
                      </View>
                      <View style={styles.tripMeta}>
                        <Calendar size={14} color={colors.mutedForeground} />
                        <Text
                          style={[
                            styles.tripDate,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {trip.startDate} → {trip.endDate}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.tripBudget,
                        { backgroundColor: `${colors.primary}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tripBudgetText,
                          { color: colors.primary },
                        ]}
                      >
                        ${trip.budget.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))
          )}
        </View>

        {/* Bottom Navigation Hint */}
        <View style={styles.navHint}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.muted }]}
            onPress={() => router.push("/trips")}
          >
            <Map size={20} color={colors.foreground} />
            <Text style={[styles.navLabel, { color: colors.foreground }]}>
              Trips
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.muted }]}
            onPress={() => router.push("/assistant")}
          >
            <Sparkles size={20} color={colors.foreground} />
            <Text style={[styles.navLabel, { color: colors.foreground }]}>
              Assistant
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  signOutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 16,
  },
  tripRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripInfo: {
    flex: 1,
    gap: 4,
  },
  tripName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  tripMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tripDestination: {
    fontSize: 14,
  },
  tripDate: {
    fontSize: 12,
  },
  tripBudget: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tripBudgetText: {
    fontSize: 14,
    fontWeight: "600",
  },
  navHint: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
