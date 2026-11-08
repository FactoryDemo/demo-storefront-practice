import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      reporter: ["text", "json-summary", "html", "lcov"],
      // Roughly 10 points under measured coverage; raise as coverage grows.
      thresholds: {
        statements: 87,
        branches: 86,
        functions: 90,
        lines: 87,
      },
    },
  },
});
