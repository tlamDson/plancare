import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    setupFiles: ["./src/test/integration-setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // Integration tests share one real Mongo/Redis connection and mutate
    // shared collections — run files sequentially to avoid cross-file races.
    fileParallelism: false,
  },
});
