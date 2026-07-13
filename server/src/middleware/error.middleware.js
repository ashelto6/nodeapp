// Centralized error handling, mounted in server.js after all routes.
import { logger } from '../logger.js';
import { Sentry } from '../sentry.js';

// Catches requests that matched no route. Returns JSON rather than
// Express's default HTML "Cannot GET" page, since this is a JSON API.
function notFoundHandler(req, res) {
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
}

// The 4-argument signature is how Express recognizes error middleware:
// anything thrown in a handler (or passed to next(err)) lands here.
// Errors with a `status` (HttpError) are intentional and safe to expose;
// anything else is an unexpected crash -- log it, return a generic 500,
// and never leak internal details to the client.
function errorHandler(err, req, res, next) {
    if (err.status) {
        return res.status(err.status).json({ error: err.message });
    }
    // Unexpected errors only (never intentional HttpErrors) go to
    // Sentry with the request attached as context. No-op without a DSN.
    Sentry.captureException(err, {
        extra: { method: req.method, url: req.originalUrl },
    });
    // req.log is pino-http's per-request logger: its lines carry the
    // request's id/method/url, so an error is joinable to the exact
    // request that caused it. Falls back to the app logger when the
    // middleware runs outside pino-http (e.g. some unit tests).
    (req.log || logger).error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
}

export { notFoundHandler, errorHandler };
