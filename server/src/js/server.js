const express = require('express');
const mongoose = require('mongoose');
const { connectDB } = require('./db');

const app = express();

app.get('/api/health', (req, res) => {
    const mongoState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ status: 'ok', mongo: mongoState });
});

connectDB()
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

app.listen(process.env.SERVER_PORT, () => {
    console.log(`${process.env.SERVER_HOST} is listening on port ${process.env.SERVER_PORT}`);
});
