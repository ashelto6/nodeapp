import pino from 'pino';

// The app-wide structured logger. Plain JSON to stdout in every
// environment (dev logs look exactly like prod logs); Docker captures
// stdout, so `docker compose logs server` is the read path.
// LOG_LEVEL env var overrides (trace|debug|info|warn|error|fatal).
// ISO timestamps instead of pino's default epoch-ms: the read path is
// human eyes on docker logs, and ISO stays machine-parseable anyway.
const logger = pino({
    name: 'server',
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    // Credentials must never reach log files: once auth exists, these
    // headers carry tokens/session cookies. Masked preemptively.
    // Request BODIES are never logged at all (pino-http's serializers
    // don't include them) -- keep it that way; add surgically if a
    // specific debugging need ever justifies it.
    // Response side too: Set-Cookie carries session tokens once auth
    // exists (pino-http serializes response headers as well). Bearer
    // tokens for the future mobile client ride in the (already masked)
    // authorization header; issued tokens ride in response bodies,
    // which are never logged in either direction. If the eventual auth
    // design adds custom credential headers, extend this list with it.
    redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-api-key"]',
        'req.headers["proxy-authorization"]',
        'res.headers["set-cookie"]',
    ],
});

export { logger };
