const { createApp } = require('./app');
const { connectDB } = require('./db');

// Runtime entry point: side effects live here (DB connection, listening),
// keeping app.js pure and importable by tests.
const app = createApp();

// Connect to MongoDB in the background. The server still starts if Mongo
// is unavailable; /api/health reports the connection state either way.
connectDB()
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

app.listen(process.env.SERVER_PORT, () => {
    console.log(`${process.env.SERVER_HOST} is listening on port ${process.env.SERVER_PORT}`);
});
