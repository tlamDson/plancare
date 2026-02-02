/**
 * Theme Provider
 *
 * Handles theme initialization and synchronization with DOM
 * Uses Zustand store for persistence (Section 6: State Management)
 */

import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "@/stores/useThemeStore";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    // Sync theme with document
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}
