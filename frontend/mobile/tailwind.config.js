/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: "#2ba3d4",
          hover: "#1a8fc2",
          active: "#158ab8",
          foreground: "#ffffff",
        },
        // Background colors
        background: {
          DEFAULT: "#ffffff",
          secondary: "#faf9f7",
          card: "#ffffff",
          dark: "#0d0d0d",
          "dark-secondary": "#000000",
          "dark-card": "#000000",
        },
        // Foreground/Text colors
        foreground: {
          DEFAULT: "#2d2a26",
          secondary: "rgba(45, 42, 38, 0.6)",
          dark: "#ffffff",
          "dark-secondary": "#e3e3e3",
        },
        // Muted colors
        muted: {
          DEFAULT: "#f5f3f0",
          foreground: "#969592",
          dark: "#242424",
          "dark-foreground": "#969592",
        },
        // Border/Input
        border: {
          DEFAULT: "#ede9e4",
          dark: "rgba(36, 36, 36, 0.7)",
        },
        input: {
          DEFAULT: "#ede9e4",
          dark: "rgba(36, 36, 36, 0.7)",
        },
        // Destructive
        destructive: {
          DEFAULT: "#e84949",
          foreground: "#ffffff",
        },
        // Card
        card: {
          DEFAULT: "#ffffff",
          foreground: "#2d2a26",
          dark: "#000000",
          "dark-foreground": "#ffffff",
        },
        // Accent
        accent: {
          DEFAULT: "#f5f3f0",
          foreground: "#2d2a26",
          blue: "#2ba3d4",
          dark: "#242424",
          "dark-foreground": "#ffffff",
        },
        // Secondary
        secondary: {
          DEFAULT: "#f5f3f0",
          foreground: "#2d2a26",
          dark: "#242424",
          "dark-foreground": "#ffffff",
        },
      },
    },
  },
  plugins: [],
};
