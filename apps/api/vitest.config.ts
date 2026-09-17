import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-secret-key-that-is-at-least-32-characters-long",
      JWT_ISSUER: "research-board",
      JWT_AUDIENCE: "research-board-web",
    },
  },
});
