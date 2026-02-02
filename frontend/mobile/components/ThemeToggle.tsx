import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react-native";

export function ThemeToggle() {
  const { actualTheme, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.muted }]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      {actualTheme === "dark" ? (
        <Sun size={20} color={colors.foreground} />
      ) : (
        <Moon size={20} color={colors.foreground} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
