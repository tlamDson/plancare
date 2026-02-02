import React from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/Button";
import { ThemeToggle } from "../components/ThemeToggle";
import { Plane, MapPin, Sparkles, DollarSign } from "lucide-react-native";

const { width } = Dimensions.get("window");

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Planning",
    description: "Personalized itineraries based on your preferences",
  },
  {
    icon: MapPin,
    title: "Interactive Maps",
    description: "Visualize your journey with route optimization",
  },
  {
    icon: DollarSign,
    title: "Smart Budgeting",
    description: "Track expenses and get cost recommendations",
  },
];

export default function LandingScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Plane size={28} color={colors.primary} />
          <Text style={[styles.logoText, { color: colors.foreground }]}>
            TravelPlanner
          </Text>
        </View>
        <ThemeToggle />
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>
          Plan Your Perfect{"\n"}
          <Text style={{ color: colors.primary }}>Adventure</Text>
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
          AI-powered travel planning that creates personalized itineraries,
          tracks your budget, and makes every trip unforgettable.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        {features.map((feature, index) => (
          <View
            key={index}
            style={[
              styles.featureCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: `${colors.primary}20` },
              ]}
            >
              <feature.icon size={24} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                {feature.title}
              </Text>
              <Text
                style={[styles.featureDesc, { color: colors.mutedForeground }]}
              >
                {feature.description}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA Buttons */}
      <View style={styles.cta}>
        <Link href="/signin" asChild>
          <Button variant="default" size="lg" onPress={() => {}}>
            Get Started
          </Button>
        </Link>
        <Link href="/signin" asChild>
          <Button variant="outline" size="lg" onPress={() => {}}>
            Sign In
          </Button>
        </Link>
      </View>

      {/* Footer */}
      <Text style={[styles.footer, { color: colors.mutedForeground }]}>
        © 2026 TravelPlanner. All rights reserved.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
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
  hero: {
    paddingVertical: 32,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 44,
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  features: {
    gap: 12,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  cta: {
    gap: 12,
    marginBottom: 24,
  },
  footer: {
    fontSize: 12,
    textAlign: "center",
    marginTop: "auto",
    paddingBottom: 16,
  },
});
