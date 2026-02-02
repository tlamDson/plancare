import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  actualTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  colors: typeof lightColors;
}

const lightColors = {
  primary: "#2ba3d4",
  primaryHover: "#1a8fc2",
  primaryForeground: "#ffffff",
  background: "#ffffff",
  backgroundSecondary: "#faf9f7",
  foreground: "#2d2a26",
  foregroundSecondary: "rgba(45, 42, 38, 0.6)",
  mutedForeground: "#969592",
  muted: "#f5f3f0",
  border: "#ede9e4",
  input: "#ede9e4",
  card: "#ffffff",
  cardForeground: "#2d2a26",
  destructive: "#e84949",
  destructiveForeground: "#ffffff",
  accent: "#f5f3f0",
  accentForeground: "#2d2a26",
  secondary: "#f5f3f0",
  secondaryForeground: "#2d2a26",
};

const darkColors = {
  primary: "#2ba3d4",
  primaryHover: "#1a8fc2",
  primaryForeground: "#ffffff",
  background: "#0d0d0d",
  backgroundSecondary: "#000000",
  foreground: "#ffffff",
  foregroundSecondary: "#e3e3e3",
  mutedForeground: "#969592",
  muted: "#242424",
  border: "rgba(36, 36, 36, 0.7)",
  input: "rgba(36, 36, 36, 0.7)",
  card: "#000000",
  cardForeground: "#ffffff",
  destructive: "#e84949",
  destructiveForeground: "#ffffff",
  accent: "#242424",
  accentForeground: "#ffffff",
  secondary: "#242424",
  secondaryForeground: "#ffffff",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>("system");

  const actualTheme: "light" | "dark" =
    theme === "system" ? systemColorScheme ?? "light" : theme;

  const colors = actualTheme === "dark" ? darkColors : lightColors;

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem("theme").then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemeState(saved);
      }
    });
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    AsyncStorage.setItem("theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme = actualTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, actualTheme, setTheme, toggleTheme, colors }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export { lightColors, darkColors };
