import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist",
    "src/_legacy",
    "src/hooks/use-toast.tsx",
    "src/components/ui/**", // ShadCN auto-generated components
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow exporting variants/constants alongside components (ShadCN pattern)
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Mirrors backend/eslint.config.mjs — warn, not error, so existing
      // console.error() call sites don't need an immediate audit.
      "no-console": ["warn", { allow: ["error"] }],
    },
  },
]);
