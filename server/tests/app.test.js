import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';

// Integration tests: real HTTP requests through the full app pipeline
// (routes -> middleware -> controllers -> error handling), in memory.
describe('GET /api/health', () => {
    afterEach(() => vi.restoreAllMocks());

    it('reports connected when mongoose readyState is 1', async () => {
        vi.spyOn(mongoose, 'connection', 'get').mockReturnValue({
            readyState: 1,
        });

        const res = await request(createApp()).get('/api/health');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok', mongo: 'connected' });
    });

    it('returns 503 degraded when mongoose readyState is not 1', async () => {
        vi.spyOn(mongoose, 'connection', 'get').mockReturnValue({
            readyState: 0,
        });

        const res = await request(createApp()).get('/api/health');

        // The status code is the health contract (issue #52): callers
        // like the deploy gate and uptime monitors rely on it alone.
        expect(res.status).toBe(503);
        expect(res.body).toEqual({ status: 'degraded', mongo: 'disconnected' });
    });
});

describe('unmatched routes', () => {
    it('returns a JSON 404, not HTML', async () => {
        const res = await request(createApp()).get('/api/nonexistent');

        expect(res.status).toBe(404);
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.body).toEqual({ error: 'Not found: GET /api/nonexistent' });
    });
});
