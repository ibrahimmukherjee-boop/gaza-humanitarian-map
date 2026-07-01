import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Humanitarian Situation & Survival Map",
        short_name: "HSSM",
        start_url: base,
        display: "standalone",
        background_color: "#f8fafc",
        theme_color: "#1e40af",
        icons: [],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,json,geojson,png,svg}"],
        mode: "development",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /\/data\/.*\.(json|geojson)$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "humanitarian-data",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 30 },
            },
          },
        ],
      },
    }),
  ],
  base,
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
