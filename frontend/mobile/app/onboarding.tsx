import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/Button";
import { Plane, Map, DollarSign, Sparkles, Check } from "lucide-react-native";

const travelStyles = [
  { id: "adventure", label: "Adventure", icon: Map },
  { id: "relaxation", label: "Relaxation", icon: Sparkles },
  { id: "culture", label: "Culture", icon: Plane },
  { id: "budget", label: "Budget", icon: DollarSign },
];

const interests = [
  "Beach",
  "Mountains",
  "Cities",
  "Nature",
  "Food",
  "History",
  "Art",
  "Nightlife",
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleComplete = () => {
    router.replace("/dashboard");
  };

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
          <View style={styles.logo}>
            <Plane size={28} color={colors.primary} />
            <Text style={[styles.logoText, { color: colors.foreground }]}>
              TravelPlan
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Let's personalize{"\n"}your experience
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Tell us about your travel preferences so we can tailor
            recommendations just for you.
          </Text>
        </View>

        {/* Travel Style */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Your travel style
          </Text>
          <View style={styles.styleGrid}>
            {travelStyles.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCard,
                  {
                    backgroundColor:
                      selectedStyle === style.id
                        ? `${colors.primary}20`
                        : colors.card,
                    borderColor:
                      selectedStyle === style.id
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => setSelectedStyle(style.id)}
              >
                <style.icon
                  size={24}
                  color={
                    selectedStyle === style.id
                      ? colors.primary
                      : colors.foreground
                  }
                />
                <Text
                  style={[
                    styles.styleLabel,
                    {
                      color:
                        selectedStyle === style.id
                          ? colors.primary
                          : colors.foreground,
                    },
                  ]}
                >
                  {style.label}
                </Text>
                {selectedStyle === style.id && (
                  <View
                    style={[
                      styles.checkmark,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Check size={12} color={colors.primaryForeground} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Interests
          </Text>
          <View style={styles.interestsGrid}>
            {interests.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestChip,
                  {
                    backgroundColor: selectedInterests.includes(interest)
                      ? colors.primary
                      : colors.muted,
                  },
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text
                  style={[
                    styles.interestLabel,
                    {
                      color: selectedInterests.includes(interest)
                        ? colors.primaryForeground
                        : colors.foreground,
                    },
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.footer}>
          <Button onPress={handleComplete} size="lg">
            Continue to Dashboard
          </Button>
          <TouchableOpacity onPress={handleComplete}>
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
              Skip for now
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
    marginBottom: 24,
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  styleCard: {
    width: "47%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  styleLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  interestLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    gap: 16,
    marginTop: 16,
    paddingBottom: 24,
  },
  skipText: {
    fontSize: 14,
    textAlign: "center",
  },
});
