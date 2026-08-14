import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Every integration test runs against this stub instead of real Clerk
      // session verification — see the file for why this replaced a
      // per-file `vi.mock("@clerk/express", ...)` block.
      "@clerk/express": path.resolve(
        __dirname,
        "./src/test/clerk-express.stub.ts",
      ),
    },
  },
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
