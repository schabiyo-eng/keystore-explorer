import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const nodeFsShim = fileURLToPath(new URL("./src/shims/node-fs.ts", import.meta.url));
const nodePathShim = fileURLToPath(new URL("./src/shims/node-path.ts", import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias:
      mode === "test"
        ? {}
        : {
            "node:fs": nodeFsShim,
            "node:path": nodePathShim,
          },
  },
  test: {
    environment: "node",
    setupFiles: ["./src/kernel/setup-crypto.ts", "./src/shell/setup-test.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    testTimeout: 60_000,
  },
}));
