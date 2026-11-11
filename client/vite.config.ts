import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the browser calls /api/* and Vite forwards it to the Express API.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  // VITE_* values are read from the project-root .env, next to the server settings.
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://localhost:5000' },
  },
  build: { outDir: '../dist/client', emptyOutDir: true },
});
