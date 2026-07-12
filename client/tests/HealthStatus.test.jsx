import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HealthStatus from '../src/components/HealthStatus';

// Presentational component: pure props -> rendered output, no mocking needed.
describe('HealthStatus', () => {
  it('shows loading placeholders while health is null', () => {
    render(<HealthStatus health={null} />);

    expect(screen.getByText('API status: loading...')).toBeInTheDocument();
    expect(screen.getByText('Mongo: loading...')).toBeInTheDocument();
  });

  it('shows the reported status and mongo state', () => {
    render(<HealthStatus health={{ status: 'ok', mongo: 'connected' }} />);

    expect(screen.getByText('API status: ok')).toBeInTheDocument();
    expect(screen.getByText('Mongo: connected')).toBeInTheDocument();
  });
});
