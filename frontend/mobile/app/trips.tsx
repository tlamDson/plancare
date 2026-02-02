import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ThemeToggle } from "../components/ThemeToggle";
import { useTripsStore, type Trip } from "../stores/useTripsStore";
import {
  ArrowLeft,
  Plus,
  Map,
  Calendar,
  DollarSign,
  Trash2,
  Edit2,
} from "lucide-react-native";

export default function TripsScreen() {
  const { colors } = useTheme();
  const trips = useTripsStore((state) => state.trips);
  const addTrip = useTripsStore((state) => state.addTrip);
  const deleteTrip = useTripsStore((state) => state.deleteTrip);

  const [showModal, setShowModal] = useState(false);
  const [newTrip, setNewTrip] = useState({
    name: "",
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
  });

  const handleAddTrip = () => {
    if (newTrip.name && newTrip.destination) {
      addTrip({
        name: newTrip.name,
        destination: newTrip.destination,
        startDate: newTrip.startDate || "2026-01-01",
        endDate: newTrip.endDate || "2026-01-07",
        budget: parseFloat(newTrip.budget) || 1000,
        spent: 0,
        status: "planning",
      });
      setNewTrip({
        name: "",
        destination: "",
        startDate: "",
        endDate: "",
        budget: "",
      });
      setShowModal(false);
    }
  };

  const handleDeleteTrip = (id: string) => {
    Alert.alert("Delete Trip", "Are you sure you want to delete this trip?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTrip(id) },
    ]);
  };

  const getStatusColor = (status: Trip["status"]) => {
    switch (status) {
      case "planning":
        return "#f59e0b";
      case "upcoming":
        return colors.primary;
      case "ongoing":
        return "#22c55e";
      case "completed":
        return colors.mutedForeground;
      default:
        return colors.mutedForeground;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          My Trips
        </Text>
        <ThemeToggle />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Trip Button */}
        <Button onPress={() => setShowModal(true)} style={{ marginBottom: 24 }}>
          <Plus
            size={20}
            color={colors.primaryForeground}
            style={{ marginRight: 8 }}
          />
          Add New Trip
        </Button>

        {/* Trips List */}
        {trips.length === 0 ? (
          <Card>
            <CardContent>
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                No trips yet. Start planning your first adventure!
              </Text>
            </CardContent>
          </Card>
        ) : (
          trips.map((trip) => (
            <Card key={trip.id} style={{ marginBottom: 12 }}>
              <CardContent>
                <View style={styles.tripHeader}>
                  <View>
                    <Text
                      style={[styles.tripName, { color: colors.foreground }]}
                    >
                      {trip.name}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(trip.status)}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(trip.status) },
                        ]}
                      >
                        {trip.status.charAt(0).toUpperCase() +
                          trip.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteTrip(trip.id)}
                    style={[
                      styles.deleteBtn,
                      { backgroundColor: `${colors.destructive}20` },
                    ]}
                  >
                    <Trash2 size={18} color={colors.destructive} />
                  </TouchableOpacity>
                </View>

                <View style={styles.tripDetails}>
                  <View style={styles.tripMeta}>
                    <Map size={16} color={colors.mutedForeground} />
                    <Text
                      style={[
                        styles.tripMetaText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {trip.destination}
                    </Text>
                  </View>
                  <View style={styles.tripMeta}>
                    <Calendar size={16} color={colors.mutedForeground} />
                    <Text
                      style={[
                        styles.tripMetaText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {trip.startDate} → {trip.endDate}
                    </Text>
                  </View>
                  <View style={styles.tripMeta}>
                    <DollarSign size={16} color={colors.mutedForeground} />
                    <Text
                      style={[
                        styles.tripMetaText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      ${trip.spent.toLocaleString()} / $
                      {trip.budget.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Budget Progress */}
                <View
                  style={[styles.progressBg, { backgroundColor: colors.muted }]}
                >
                  <View
                    style={[
                      styles.progressBar,
                      {
                        backgroundColor: colors.primary,
                        width: `${Math.min(
                          (trip.spent / trip.budget) * 100,
                          100
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add Trip Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Add New Trip
            </Text>

            <Input
              label="Trip Name"
              placeholder="e.g., Summer in Paris"
              value={newTrip.name}
              onChangeText={(text) => setNewTrip({ ...newTrip, name: text })}
            />
            <Input
              label="Destination"
              placeholder="e.g., Paris, France"
              value={newTrip.destination}
              onChangeText={(text) =>
                setNewTrip({ ...newTrip, destination: text })
              }
            />
            <Input
              label="Budget"
              placeholder="e.g., 5000"
              keyboardType="numeric"
              value={newTrip.budget}
              onChangeText={(text) => setNewTrip({ ...newTrip, budget: text })}
            />

            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => setShowModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button onPress={handleAddTrip} style={{ flex: 1 }}>
                Add Trip
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 32,
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tripName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tripDetails: {
    gap: 8,
    marginBottom: 16,
  },
  tripMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tripMetaText: {
    fontSize: 14,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
});
