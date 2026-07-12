import { describe, it, expect, vi, beforeEach } from 'vitest';
import { request } from '../src/api/client';

// The api transport layer: mock global fetch to exercise each branch of
// the response handling without any network.
describe('request', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('returns parsed JSON on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      })
    );

    await expect(request('/api/health')).resolves.toEqual({ status: 'ok' });
  });

  it("surfaces the server's { error } message on failure", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid request: body.username' }),
      })
    );

    await expect(request('/api/thing')).rejects.toThrow('Invalid request: body.username');
  });

  it('falls back to a status-based message when the error JSON has no error field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ unrelated: 'shape' }),
      })
    );

    await expect(request('/api/thing')).rejects.toThrow('Request failed: 503');
  });

  it('falls back to a status-based message when the error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error('not json')),
      })
    );

    await expect(request('/api/thing')).rejects.toThrow('Request failed: 502');
  });
});
