import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    setupFiles: ["./src/kernel/setup-crypto.ts"],
    include: ["src/kernel/**/*.test.ts"],
    testTimeout: 60_000,
  },
});
