// @ts-check
import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@mysten/walrus-wasm"], // Exclude WASM from optimization
    },
    server: {
      fs: {
        // Allow serving WASM files from node_modules
        allow: [".."],
      },
    },
  },

  integrations: [
    react({
      experimentalReactChildren: true,
    }),
  ],

  adapter: netlify(),
});
