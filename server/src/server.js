import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDB } from './db.js';
import { logger } from './logger.js';
import { Sentry } from './sentry.js';

// Runtime entry point: side effects live here (DB connection, listening),
// keeping app.js pure and importable by tests.
const app = createApp();

// Connect to MongoDB in the background, retrying with capped exponential
// backoff on failure (issue #117). Mongoose's own reconnect logic only
// manages a connection that succeeded at least once -- a failed *initial*
// connect is never retried on its own, so without this the app would stay
// degraded (health 503) forever until something restarted the process.
const MONGO_RETRY_BASE_MS = 1000;
// Mongoose's serverSelectionTimeoutMS (30s default) is how long a single
// connectDB() call can take before rejecting; capping backoff at the same
// order of magnitude keeps attempts spaced out rather than stacking.
const MONGO_RETRY_MAX_MS = 30000;

let mongoRetryTimer = null;
let shuttingDown = false;

function connectWithRetry(attempt = 0) {
    connectDB()
        .then(() =>
            logger.info(
                `Connected to MongoDB as scoped app user (db=${process.env.MONGO_DB}, user=${process.env.MONGO_APP_USERNAME})`,
            ),
        )
        .catch((err) => {
            // Shutdown already in progress -- no point reconnecting to a
            // DB the process is about to disconnect from on its way out.
            if (shuttingDown) return;

            const delayMs = Math.min(
                MONGO_RETRY_BASE_MS * 2 ** attempt,
                MONGO_RETRY_MAX_MS,
            );
            logger.error(
                { err, attempt, retryInMs: delayMs },
                'MongoDB connection error, retrying with backoff',
            );

            mongoRetryTimer = setTimeout(
                () => connectWithRetry(attempt + 1),
                delayMs,
            );
            // Don't let a pending retry hold the event loop open -- a
            // graceful shutdown mid-backoff must still be able to exit.
            mongoRetryTimer.unref();
        });
}

connectWithRetry();

const server = app.listen(process.env.SERVER_PORT, () => {
    logger.info(
        `${process.env.SERVER_HOST} is listening on port ${process.env.SERVER_PORT}`,
    );
});

// Graceful shutdown (issue #29). Docker sends SIGTERM on `compose down` /
// redeploy, then SIGKILL after `stop_grace_period` (10s default, not
// currently overridden) if the process hasn't exited by then. Without this,
// the process dies immediately: in-flight requests are cut off, and any
// Sentry event captured in that same instant is lost -- the Sentry client
// buffers events and ships them asynchronously, so a killed process never
// flushes them. This closes that window.
const SHUTDOWN_TIMEOUT_MS = 8000;
// Comfortably shorter than SHUTDOWN_TIMEOUT_MS so a stuck disconnect still
// leaves room for Sentry.flush() before the force-exit safety net fires.
const MONGO_DISCONNECT_TIMEOUT_MS = 3000;

function shutdown(signal) {
    logger.info(`${signal} received, shutting down gracefully`);

    // Stop the Mongo retry loop: flip the flag so an in-flight connectDB()
    // attempt doesn't schedule another one, and clear any already-pending
    // timer (it's unref()'d so it wouldn't block exit anyway, but there's
    // no reason to let it fire during shutdown).
    shuttingDown = true;
    clearTimeout(mongoRetryTimer);

    // Force-exit safety net: if close() hangs for an unexpected reason,
    // don't let Docker's SIGKILL be the only way out -- exit on our own
    // terms, with a logged reason, comfortably inside the grace period.
    const forceExit = setTimeout(() => {
        logger.error('Graceful shutdown timed out, forcing exit');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close(async () => {
        try {
            // mongoose.disconnect() only resolves promptly if the
            // connection is already open or already idle. If SIGTERM lands
            // while a connectDB() attempt is still in flight (readyState
            // "connecting"), mongoose internally waits for that attempt's
            // own 'open'/'error' event before resolving -- which can take
            // up to its serverSelectionTimeoutMS (30s), blowing straight
            // past SHUTDOWN_TIMEOUT_MS and hitting the force-exit path
            // instead of exiting cleanly. Race it against a bound well
            // inside the grace period so shutdown never waits on a
            // retry-in-progress connection attempt.
            await Promise.race([
                mongoose.disconnect(),
                new Promise((resolve) => {
                    const t = setTimeout(resolve, MONGO_DISCONNECT_TIMEOUT_MS);
                    t.unref();
                }),
            ]);
        } catch (err) {
            logger.error({ err }, 'Error closing MongoDB connection');
        }
        await Sentry.flush(2000);
        clearTimeout(forceExit);
        process.exit(0);
    });

    // server.close() stops accepting new connections but waits for existing
    // ones to end on their own -- an idle keep-alive socket (nginx <-> node)
    // may not do that before the grace period expires. Proactively drop idle
    // sockets so shutdown isn't gated on nginx's keep-alive timeout; requests
    // still in flight are unaffected and finish normally.
    server.closeIdleConnections();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
