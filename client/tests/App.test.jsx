import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

// Renders the real composition root with only the network stubbed, so
// the full chain App -> HomePage -> health.api -> client.request runs.
describe('App', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('renders the home page with fetched health data end-to-end', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', mongo: 'connected' }),
      })
    );

    render(<App />);

    expect(screen.getByText('webapp')).toBeInTheDocument();
    expect(await screen.findByText('API status: ok')).toBeInTheDocument();
    expect(screen.getByText('Mongo: connected')).toBeInTheDocument();
    // The real api layer was exercised: fetch hit the real endpoint path.
    expect(fetch).toHaveBeenCalledWith('/api/health', expect.any(Object));
  });
});
