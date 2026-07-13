import mongoose from 'mongoose';

// Health contract (issue #52): the HTTP status code IS the signal --
// 200 means fully healthy (API up AND its dependencies reachable),
// 503 means degraded. Callers (deploy gate, uptime monitors, load
// balancers) must rely only on the status code; the JSON body is
// informational and free to change shape.
// mongoose.connection.readyState: 0 = disconnected, 1 = connected,
// 2 = connecting, 3 = disconnecting -- only 1 counts as healthy.
function getHealth(req, res) {
    const mongoConnected = mongoose.connection.readyState === 1;
    res.status(mongoConnected ? 200 : 503).json({
        status: mongoConnected ? 'ok' : 'degraded',
        mongo: mongoConnected ? 'connected' : 'disconnected',
    });
}

export { getHealth };
