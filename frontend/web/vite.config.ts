import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      {
        find: "@voyager/shared",
        replacement: path.resolve(
          __dirname,
          "../../packages/shared/src/index.ts",
        ),
      },
      {
        find: /^@voyager\/shared\//,
        replacement: `${path.resolve(
          __dirname,
          "../../packages/shared/src",
        )}/`,
      },
      // Workaround: some packages import internal React subpaths like
      // 'react/jsx-runtime' which may not be resolved correctly in some
      // environments. Explicitly alias them to the installed package files.
      {
        find: "react/jsx-runtime",
        replacement: path.resolve(
          __dirname,
          "./node_modules/react/jsx-runtime.js",
        ),
      },
      {
        find: "react/jsx-dev-runtime",
        replacement: path.resolve(
          __dirname,
          "./node_modules/react/jsx-dev-runtime.js",
        ),
      },
    ],
  },
});
