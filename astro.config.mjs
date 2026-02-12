// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    // Exponer PUBLIC_* en import.meta.env (para API key de standings, etc.)
    envPrefix: ['VITE_', 'PUBLIC_'],
  },

  integrations: [react()]
});