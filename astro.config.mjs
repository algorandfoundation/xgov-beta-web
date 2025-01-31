import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import cloudflare from '@astrojs/cloudflare';
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  output: 'server',
  vite: {
    define: {
      global: 'globalThis',
    },
  },
  adapter: cloudflare({ mode: "directory" }),
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
  ]
});