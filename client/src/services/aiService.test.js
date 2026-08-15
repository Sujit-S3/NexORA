import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../hooks/usePreferenceTracking', () => ({
  getSessionId: () => 'session-test',
}));

import aiService from './aiService';

describe('AI streaming API routing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('rejects an SPA HTML response instead of treating it as an AI stream', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
    }));

    await expect(aiService.chatStream('hello', [], {})).rejects.toThrow(
      /returned the frontend application/i,
    );
  });

  it('returns a real event stream response unchanged', async () => {
    const response = {
      headers: new Headers({ 'content-type': 'text/event-stream' }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    await expect(aiService.chatStream('hello', [], {})).resolves.toBe(response);
  });
});
