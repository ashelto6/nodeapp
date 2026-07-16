import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDB } from './db.js';
import { logger } from './logger.js';
import { Sentry } from './sentry.js';

// Runtime entry point: side effects live here (DB connection, listening),
// keeping app.js pure and importable by tests.
const app = createApp();

// Connect to MongoDB in the background. The server still starts if Mongo
// is unavailable; /api/health returns 503 (degraded) until it connects.
connectDB()
    .then(() =>
        logger.info(
            `Connected to MongoDB as scoped app user (db=${process.env.MONGO_DB}, user=${process.env.MONGO_APP_USERNAME})`,
        ),
    )
    .catch((err) => logger.error({ err }, 'MongoDB connection error'));

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

function shutdown(signal) {
    logger.info(`${signal} received, shutting down gracefully`);

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
            await mongoose.disconnect();
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
