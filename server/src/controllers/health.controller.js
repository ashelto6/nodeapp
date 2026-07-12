import mongoose from 'mongoose';

// Reports API liveness and the current MongoDB connection state.
// mongoose.connection.readyState: 0 = disconnected, 1 = connected,
// 2 = connecting, 3 = disconnecting — we only treat 1 as healthy.
function getHealth(req, res) {
    const mongoState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ status: 'ok', mongo: mongoState });
}

export { getHealth };
