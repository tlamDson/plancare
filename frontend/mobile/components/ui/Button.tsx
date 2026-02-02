import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  children,
  onPress,
  variant = "default",
  size = "default",
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    };

    // Size styles
    switch (size) {
      case "sm":
        Object.assign(base, { paddingVertical: 8, paddingHorizontal: 12 });
        break;
      case "lg":
        Object.assign(base, { paddingVertical: 16, paddingHorizontal: 24 });
        break;
      default:
        Object.assign(base, { paddingVertical: 12, paddingHorizontal: 16 });
    }

    // Variant styles
    switch (variant) {
      case "outline":
        Object.assign(base, {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border,
        });
        break;
      case "ghost":
        Object.assign(base, {
          backgroundColor: "transparent",
        });
        break;
      case "destructive":
        Object.assign(base, {
          backgroundColor: colors.destructive,
        });
        break;
      default:
        Object.assign(base, {
          backgroundColor: colors.primary,
        });
    }

    if (disabled || loading) {
      base.opacity = 0.5;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: "600",
    };

    // Size styles
    switch (size) {
      case "sm":
        base.fontSize = 14;
        break;
      case "lg":
        base.fontSize = 18;
        break;
      default:
        base.fontSize = 16;
    }

    // Variant styles
    switch (variant) {
      case "outline":
      case "ghost":
        base.color = colors.foreground;
        break;
      case "destructive":
        base.color = colors.destructiveForeground;
        break;
      default:
        base.color = colors.primaryForeground;
    }

    return base;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={
            variant === "default" ? colors.primaryForeground : colors.primary
          }
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={getTextStyle()}>{children}</Text>
    </TouchableOpacity>
  );
}
