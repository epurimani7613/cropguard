import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // Relative base so the same build works from any path — GitHub Pages serves
  // project sites from /<repo>/, so absolute '/assets/...' would 404.
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Web Serial needs a secure context; localhost qualifies.
    host: 'localhost',
    port: 5173,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});