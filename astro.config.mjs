import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import cloudflare from '@astrojs/cloudflare';
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  output: 'static',
  vite: {
    define: {
      global: 'globalThis',
    },
  },
  adapter: cloudflare(),
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
  ]
});