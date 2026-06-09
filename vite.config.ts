import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // Vite's dev server — Tauri opens this URL
  server: {
    port: 5173,
    strictPort: true,
    // Don't open a browser tab; Tauri handles the window
    open: false,
  },

  // Production output goes to dist/ (Tauri reads this via distDir)
  build: {
    outDir: "dist",
    // Tauri supports modern targets; no need to transpile to ES5
    target: ["es2021", "chrome100", "safari13"],
    // Don't inline assets as base64 — Tauri serves them from dist/
    assetsInlineLimit: 0,
    // Desktop app: no network constraints, so suppress the chunk-size advisory
    chunkSizeWarningLimit: 2000,
  },

  // Required for Tauri's custom protocol in production builds
  base: "./",
});
