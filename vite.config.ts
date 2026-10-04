import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
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