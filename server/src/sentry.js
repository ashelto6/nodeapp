import * as Sentry from '@sentry/node';

// Error tracking (issue #35). Conditional by design: with SENTRY_DSN
// set (production), exceptions captured via Sentry.captureException
// are shipped to the dashboard; without it (tests, CI, local dev
// unless opted in), every Sentry call is a safe no-op. Only error
// monitoring is enabled -- no tracing/profiling (deliberate minimal
// scope, matching the account setup).
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
    });
}

export { Sentry };
