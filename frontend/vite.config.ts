import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: [".trycloudflare.com", ".ngrok-free.app", "localhost", "127.0.0.1"],
    proxy: { "/api": "http://localhost:4000" },
  },
  test: {
    environment: "jsdom",
  },
});
