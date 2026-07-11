import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.CLIENT_PORT) || 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': `http://${process.env.SERVER_HOST || 'node-c'}:${process.env.SERVER_PORT || 8888}`,
    },
  },
});
