import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { VitePWA } from "vite-plugin-pwa";
import { manifest } from "./src/utils/manifest"

// Get mode from --mode argument (e.g., --mode testnet)
const mode = process.argv.find((arg, i) => process.argv[i - 1] === "--mode") ?? "local";

// https://astro.build/config
export default defineConfig({
  output: "server",
  vite: {
    define: {
      global: "globalThis",
    },
    build: {
      rollupOptions: {
        plugins: [
          NodeGlobalsPolyfillPlugin({
            buffer: true,
          }),
        ],
      },
    },
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        manifest,
        workbox: {
          globDirectory: 'dist',
          globPatterns: [
            '**/*.{svg,png,jpg,jpeg,gif,webp,woff,woff2,ttf,eot,ico}',
            // '**/*.{ js,css,svg,png,jpg,jpeg,gif,webp,woff,woff2,ttf,eot,ico}',
          ],
          navigateFallback: null,
        },
      })
    ]
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      envFiles: [`.env.${mode}`],
    },
  }),
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
  ],
});
