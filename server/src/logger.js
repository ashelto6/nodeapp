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
    redact: ['req.headers.authorization', 'req.headers.cookie'],
});

export { logger };
