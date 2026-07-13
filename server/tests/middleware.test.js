import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { errorHandler, notFoundHandler } from '../src/middleware/error.middleware.js';
import { validate } from '../src/middleware/validate.middleware.js';
import { HttpError } from '../src/utils/http-error.js';
import { asyncHandler } from '../src/utils/async-handler.js';
import { logger } from '../src/logger.js';
import { Sentry } from '../src/sentry.js';

// ESM namespace exports can't be spied on at runtime, so the sentry
// wrapper module is mocked wholesale -- error.middleware receives this
// object, and the tests assert against its mock function directly.
vi.mock('../src/sentry.js', () => ({
    Sentry: { captureException: vi.fn() },
}));

// Builds a minimal app around one route so each middleware can be
// exercised through real requests, independent of the app's real routes.
function appWith(route) {
    const app = express();
    app.use(express.json());
    route(app);
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}

describe('errorHandler', () => {
    it('exposes status and message for intentional HttpErrors', async () => {
        const app = appWith((a) =>
            a.get('/boom', () => {
                throw new HttpError(418, 'intentional teapot');
            })
        );

        const res = await request(app).get('/boom');

        expect(res.status).toBe(418);
        expect(res.body).toEqual({ error: 'intentional teapot' });
    });

    it('returns a sanitized 500 for unexpected errors without leaking details', async () => {
        // The crash must be logged (via the structured logger, since this
        // minimal app has no pino-http to attach req.log) but never exposed.
        const errSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
        Sentry.captureException.mockClear();
        const app = appWith((a) =>
            a.get('/boom', () => {
                throw new Error('secret internal details');
            })
        );

        const res = await request(app).get('/boom');

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'Internal server error' });
        expect(JSON.stringify(res.body)).not.toContain('secret');
        expect(errSpy).toHaveBeenCalled(); // still logged server-side
        // Unexpected errors must also reach Sentry (no-op without a DSN,
        // but the call must happen for production capture to work).
        expect(Sentry.captureException).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'secret internal details' }),
            expect.anything()
        );
        errSpy.mockRestore();
    });

    it('does not send intentional HttpErrors to Sentry', async () => {
        Sentry.captureException.mockClear();
        const app = appWith((a) =>
            a.get('/boom', () => {
                throw new HttpError(404, 'not an incident');
            })
        );

        await request(app).get('/boom');

        expect(Sentry.captureException).not.toHaveBeenCalled();
    });
});

describe('asyncHandler', () => {
    it('routes async rejections to the error middleware', async () => {
        const app = appWith((a) =>
            a.get(
                '/async-boom',
                asyncHandler(async () => {
                    throw new HttpError(404, 'async not found');
                })
            )
        );

        const res = await request(app).get('/async-boom');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'async not found' });
    });
});

describe('validate', () => {
    const bodySchema = z.object({
        username: z.string().min(3),
        age: z.coerce.number().int().positive().optional(),
    });
    const echoApp = () =>
        appWith((a) =>
            a.post('/echo', validate({ body: bodySchema }), (req, res) => {
                res.json({ received: req.body });
            })
        );

    it('passes clean input through parsed: coerces types and strips unknown fields', async () => {
        const res = await request(echoApp())
            .post('/echo')
            .send({ username: 'tony', age: '30', smuggled: 'field' });

        expect(res.status).toBe(200);
        expect(res.body.received).toEqual({ username: 'tony', age: 30 });
    });

    it('rejects invalid input with a 400 naming the field', async () => {
        const res = await request(echoApp()).post('/echo').send({ username: 'ab' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('body.username');
    });

    it('rejects NoSQL-injection-shaped payloads', async () => {
        const res = await request(echoApp())
            .post('/echo')
            .send({ username: { $gt: '' } });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('body.username');
    });
});
