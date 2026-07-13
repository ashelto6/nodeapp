import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Keep test output readable: request/app logs stay silent in tests.
    // Spies on logger methods still record calls regardless of level.
    env: { LOG_LEVEL: 'silent' },
    coverage: {
      // istanbul instruments source at transform time. The default v8
      // provider mis-attributed files loaded through both the CJS
      // require chain and direct ESM test imports (see issue #17).
      provider: 'istanbul',
      // Count every source file, so untested files can't silently
      // escape the accounting by never being imported in a test.
      include: ['src/**'],
      exclude: [
        // Runtime entry: side effects only (DB connect, listen); its
        // behavior is verified by running the real compose shapes.
        'src/server.js',
        // Thin mongoose.connect wrapper; requires a live MongoDB, so
        // it is exercised by compose-shape verification, not unit tests.
        'src/db.js',
      ],
      // Ratcheted gate (issue #17): thresholds sit just under measured
      // coverage at the time of the last update, so CI fails on
      // regression. Raise these as coverage grows -- never lower them
      // to make a failing PR pass.
      // Measured 2026-07-12 (post-ESM, issue #49): 100/90/100/100.
      thresholds: {
        statements: 95,
        branches: 85,
        functions: 95,
        lines: 95,
      },
    },
  },
});
