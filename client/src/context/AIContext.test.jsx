import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ checkHealth: vi.fn() }));

vi.mock('../services/aiService', () => ({ default: { checkHealth: mocks.checkHealth } }));
vi.mock('./CartContext', () => ({ useCart: () => ({ addToCart: vi.fn(), items: [] }) }));
vi.mock('./WishlistContext', () => ({ useWishlist: () => ({ toggleWishlist: vi.fn(), wishlistItems: [] }) }));

import { AIProvider, useAI } from './AIContext';

function HealthProbe() {
  const { aiHealth } = useAI();
  return <div data-testid="health">{aiHealth.available === false ? 'OFFLINE' : 'ONLINE'}</div>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AIProvider health check resilience', () => {
  it('recovers to ONLINE via background polling after the initial retries are exhausted', async () => {
    // First 3 attempts (mount + 2 backoff retries) fail — simulating a cold
    // start outlasting the initial ~30-50s budget. The 4th call (first
    // background poll, 20s later) succeeds.
    mocks.checkHealth
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ data: { success: true, data: { status: 'ONLINE', available: true, model: 'gemini-2.5-flash' } } });

    render(
      <MemoryRouter>
        <AIProvider><HealthProbe /></AIProvider>
      </MemoryRouter>,
    );

    // Attempt 1 (immediate)
    await act(async () => { await Promise.resolve(); });
    // Backoff: 2s then attempt 2
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    // Backoff: 4s then attempt 3 (final of the initial budget)
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });

    expect(screen.getByTestId('health')).toHaveTextContent('OFFLINE');
    expect(mocks.checkHealth).toHaveBeenCalledTimes(3);

    // Background poll fires 20s later and succeeds — badge must self-heal
    // without a page reload.
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });

    expect(mocks.checkHealth).toHaveBeenCalledTimes(4);
    expect(screen.getByTestId('health')).toHaveTextContent('ONLINE');
  });

  it('stops polling once healthy again', async () => {
    mocks.checkHealth
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ data: { success: true, data: { status: 'ONLINE', available: true, model: 'gemini-2.5-flash' } } });

    render(
      <MemoryRouter>
        <AIProvider><HealthProbe /></AIProvider>
      </MemoryRouter>,
    );

    await act(async () => { await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });

    expect(mocks.checkHealth).toHaveBeenCalledTimes(4);

    // Another 40s (two more poll intervals) must not trigger further calls
    // now that the interval was cleared.
    await act(async () => { await vi.advanceTimersByTimeAsync(40000); });
    expect(mocks.checkHealth).toHaveBeenCalledTimes(4);
  });
});
