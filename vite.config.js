import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // El SDK de Firebase pesa bastante: es esperable que el bundle supere los 500 kB.
    chunkSizeWarningLimit: 1000,
  },
});
