import { createApp } from './app.js';
import { connectDB } from './db.js';
import { logger } from './logger.js';

// Runtime entry point: side effects live here (DB connection, listening),
// keeping app.js pure and importable by tests.
const app = createApp();

// Connect to MongoDB in the background. The server still starts if Mongo
// is unavailable; /api/health returns 503 (degraded) until it connects.
connectDB()
    .then(() => logger.info('Connected to MongoDB'))
    .catch((err) => logger.error({ err }, 'MongoDB connection error'));

app.listen(process.env.SERVER_PORT, () => {
    logger.info(`${process.env.SERVER_HOST} is listening on port ${process.env.SERVER_PORT}`);
});
