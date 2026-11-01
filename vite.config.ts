import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// GitHub Pages project site → served under /health/ (AGENTS.md invariant).
export default defineConfig({
  base: "/health/",
  plugins: [react()],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
