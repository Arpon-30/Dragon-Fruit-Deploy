import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const animations = fileURLToPath(new URL("../animations", import.meta.url));
const api = process.env.DK_API || "http://127.0.0.1:7860";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@animations": animations },
    // ../animations imports react and framer-motion; resolve them from frontend/node_modules
    dedupe: ["react", "react-dom", "framer-motion"],
  },
  server: {
    fs: { allow: [".", animations] },
    proxy: { "/api": api, "/ws": { target: api.replace("http", "ws"), ws: true } },
  },
  // Main chunk is react-dom + framer-motion, about 135 kB gzipped; the maps load separately.
  build: { target: "es2020", chunkSizeWarningLimit: 450 },
});
