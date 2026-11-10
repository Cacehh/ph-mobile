import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// React code, built with Preact's React-compatible layer to keep the page small.
// Served from https://cacehh.github.io/ph-mobile/
export default defineConfig({
  base: '/ph-mobile/',
  plugins: [preact()],
});
