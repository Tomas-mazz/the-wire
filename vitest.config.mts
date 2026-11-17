import { defineConfig } from "vitest/config";

export default defineConfig({
  // Understand the "@/..." imports defined in tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
