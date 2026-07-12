// Centralized error handling, mounted in server.js after all routes.

// Catches requests that matched no route. Returns JSON rather than
// Express's default HTML "Cannot GET" page, since this is a JSON API.
function notFoundHandler(req, res) {
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
}

// The 4-argument signature is how Express recognizes error middleware:
// anything thrown in a handler (or passed to next(err)) lands here.
// Errors with a `status` (HttpError) are intentional and safe to expose;
// anything else is an unexpected crash -- log it, return a generic 500,
// and never leak internal details to the client.
function errorHandler(err, req, res, next) {
    if (err.status) {
        return res.status(err.status).json({ error: err.message });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFoundHandler, errorHandler };
