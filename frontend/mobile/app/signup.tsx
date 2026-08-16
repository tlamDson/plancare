import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuthStore } from "../stores/useAuthStore";
import { Plane, Check } from "lucide-react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

const benefits = [
  "AI-powered itinerary generation",
  "Real-time budget tracking",
  "Interactive maps with route planning",
  "Export and share your plans",
];

export default function SignUpScreen() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const signUp = useAuthStore((state) => state.signUp);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const success = signUp(data.email, data.password, data.name);
    setIsLoading(false);
    if (success) {
      router.replace("/onboarding");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Link href="/" asChild>
              <TouchableOpacity style={styles.logo}>
                <Plane size={24} color={colors.primary} />
                <Text style={[styles.logoText, { color: colors.foreground }]}>
                  TravelPlan
                </Text>
              </TouchableOpacity>
            </Link>
            <ThemeToggle />
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Create your account
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Get started with your free account today.
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefits}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View
                  style={[
                    styles.benefitIcon,
                    { backgroundColor: `${colors.primary}20` },
                  ]}
                >
                  <Check size={16} color={colors.primary} />
                </View>
                <Text
                  style={[styles.benefitText, { color: colors.foreground }]}
                >
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full name"
                  placeholder="John Doe"
                  autoCapitalize="words"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="••••••••"
                  isPassword
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm password"
                  placeholder="••••••••"
                  isPassword
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Button onPress={handleSubmit(onSubmit)} loading={isLoading}>
              Create account
            </Button>
          </View>

          {/* Terms */}
          <Text style={[styles.terms, { color: colors.mutedForeground }]}>
            By signing up, you agree to our{" "}
            <Text style={{ color: colors.primary }}>Terms</Text> and{" "}
            <Text style={{ color: colors.primary }}>Privacy Policy</Text>
          </Text>

          {/* Sign In Link */}
          <View style={styles.signInLink}>
            <Text
              style={[styles.signInText, { color: colors.mutedForeground }]}
            >
              Already have an account?{" "}
            </Text>
            <Link href="/signin" asChild>
              <TouchableOpacity>
                <Text
                  style={[styles.signInLinkText, { color: colors.primary }]}
                >
                  Sign in
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  benefits: {
    gap: 12,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    fontSize: 14,
  },
  form: {
    marginBottom: 16,
  },
  terms: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
  },
  signInLink: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 24,
  },
  signInText: {
    fontSize: 14,
  },
  signInLinkText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
