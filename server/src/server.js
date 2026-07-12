const express = require('express');
const { connectDB } = require('./db');
const healthRoutes = require('./routes/health.routes');

const app = express();

// Parse JSON request bodies for all routes.
app.use(express.json());

// Mount each feature's router under its /api path. New features add a
// router in src/routes and mount it here — server.js stays bootstrap-only.
app.use('/api/health', healthRoutes);

// Connect to MongoDB in the background. The server still starts if Mongo
// is unavailable; /api/health reports the connection state either way.
connectDB()
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

app.listen(process.env.SERVER_PORT, () => {
    console.log(`${process.env.SERVER_HOST} is listening on port ${process.env.SERVER_PORT}`);
});
