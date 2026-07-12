const express = require('express');
const healthRoutes = require('./routes/health.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

// Builds and returns the configured Express app WITHOUT starting it or
// touching the database. server.js uses this for the real process;
// tests import it directly and drive it in memory via supertest.
function createApp() {
    const app = express();

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

module.exports = { createApp };
