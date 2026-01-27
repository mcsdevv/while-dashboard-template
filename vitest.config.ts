import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    include: [
      "__tests__/**/*.test.ts",
      "__tests__/**/*.test.tsx",
      "lib/**/*.test.ts",
      "app/**/*.test.ts",
      "components/**/*.test.ts",
      "components/**/*.test.tsx",
    ],
    exclude: ["e2e/**", "node_modules/**"],
    environment: "node",
    // Use jsdom for component tests (*.test.tsx)
    environmentMatchGlobs: [
      ["**/*.test.tsx", "jsdom"],
      ["components/**/*.test.ts", "jsdom"],
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
});
