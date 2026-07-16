import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vitest configuration (vitest reads vite.config.js natively).
  // jsdom simulates a browser DOM so components can render in tests.
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      // istanbul, matching the server (see issue #17 for why not v8).
      provider: 'istanbul',
      // Count every source file so untested files can't escape the
      // accounting by never being imported in a test.
      include: ['src/**'],
      exclude: [
        // React bootstrap: side effects only (mounts <App> into #root);
        // exercised by the compose shapes, not unit tests.
        'src/main.jsx',
      ],
      // Ratcheted gate (issue #17): thresholds sit just under measured
      // coverage at the time of the last update. Raise as coverage
      // grows -- never lower to make a failing PR pass.
      thresholds: {
        statements: 95,
        branches: 85,
        functions: 95,
        lines: 95,
      },
    },
  },
  server: {
    host: true,
    port: Number(process.env.CLIENT_PORT) || 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: `http://${process.env.SERVER_HOST || 'node-c'}:${process.env.SERVER_PORT || 8888}`,
        // Rewrites the Host header to match the target instead of the
        // original browser request (issue #29) -- the recommended default
        // for Vite proxies. No server-side logic keys off Host today, so
        // this is behaviorally a no-op; it's here for correctness.
        changeOrigin: true,
      },
    },
  },
});
