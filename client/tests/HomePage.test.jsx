import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '../src/pages/HomePage';
import { getHealth } from '../src/api/health.api';

// Mock the api module: page tests verify wiring (fetch -> state -> render),
// not the network. The api layer itself is tested in client.test.js.
vi.mock('../src/api/health.api', () => ({
  getHealth: vi.fn(),
}));

describe('HomePage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('renders the health data once the fetch resolves', async () => {
    getHealth.mockResolvedValue({ status: 'ok', mongo: 'connected' });

    render(<HomePage />);

    // findByText waits for the async state update after the mock resolves.
    expect(await screen.findByText('API status: ok')).toBeInTheDocument();
    expect(screen.getByText('Mongo: connected')).toBeInTheDocument();
  });

  it('falls back to the error state when the fetch rejects', async () => {
    getHealth.mockRejectedValue(new Error('network down'));

    render(<HomePage />);

    expect(await screen.findByText('API status: error')).toBeInTheDocument();
    expect(screen.getByText('Mongo: unknown')).toBeInTheDocument();
  });
});
