import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const apiTarget = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

  return {
    base: '/hair-loss-assessment/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // In dev, the FastAPI backend (npm start / uvicorn) answers API calls.
      // In production, use a separate API host and set VITE_API_BASE_URL.
      proxy: { '/api': apiTarget, '/health': apiTarget },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
