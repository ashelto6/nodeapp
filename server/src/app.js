import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './logger.js';
import healthRoutes from './routes/health.routes.js';
import {
    notFoundHandler,
    errorHandler,
} from './middleware/error.middleware.js';

// Builds and returns the configured Express app WITHOUT starting it or
// touching the database. server.js uses this for the real process;
// tests import it directly and drive it in memory via supertest.
function createApp() {
    const app = express();

    // Structured per-request logging (issue #36): one JSON line per
    // request with method, path, status, and latency. Health-check
    // traffic is deliberately not logged -- the deploy gate and uptime
    // monitor poll it constantly and have their own dashboards, so
    // logging it would drown real traffic in noise.
    app.use(
        pinoHttp({
            logger,
            autoLogging: {
                ignore: (req) => req.url === '/api/health',
            },
        }),
    );

    // Parse JSON request bodies for all routes.
    app.use(express.json());

    // Mount each feature's router under its /api path. New features add
    // a router in src/routes and mount it here.
    app.use('/api/health', healthRoutes);

    // Error handling must be mounted after all routes: unmatched requests
    // fall through to the JSON 404, and thrown errors land in errorHandler.
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

export { createApp };
