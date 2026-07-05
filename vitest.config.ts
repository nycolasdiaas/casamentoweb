import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  plugins: [react()],
  test: {
    pool: "threads",
    fileParallelism: false,
    maxWorkers: 1,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    env: {
      ADMIN_SESSION_SECRET:
        process.env.ADMIN_SESSION_SECRET ?? "test-secret-do-not-use-in-prod",
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "test-password",
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? "",
      DATABASE_SCHEMA: "test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
