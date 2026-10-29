import {
  coverageConfigDefaults,
  defineConfig,
} from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "::",
    port: 5174,
    strictPort: true,
  },

  test: {
    environment: "jsdom",

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",

      include: [
        "src/**/*.{js,jsx}",
      ],

      exclude: [
        ...coverageConfigDefaults.exclude,
        "src/Tests/**",
      ],
    },
  },
});
