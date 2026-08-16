import { describe, expect, it } from 'vitest';

import api from './api';

// Axios exposes registered interceptors on `.handlers` — grabbing the
// rejection handler directly lets us test the error-normalization logic
// without needing a real network layer.
const rejectedHandler = api.interceptors.response.handlers[0].rejected;

describe('api response interceptor — network/timeout error messaging', () => {
  it('replaces a raw "Network Error" (no response) with an actionable cold-start message', async () => {
    const networkError = { message: 'Network Error', config: { url: '/auth/login' } };

    await expect(rejectedHandler(networkError)).rejects.toMatchObject({
      message: expect.stringMatching(/couldn.t reach nexora.s servers/i),
    });
  });

  it('replaces an axios timeout error the same way', async () => {
    const timeoutError = { message: 'timeout of 15000ms exceeded', code: 'ECONNABORTED', config: { url: '/products' } };

    await expect(rejectedHandler(timeoutError)).rejects.toMatchObject({
      message: expect.stringMatching(/couldn.t reach nexora.s servers/i),
    });
  });

  it('does NOT rewrite a real server error response (e.g. wrong credentials)', async () => {
    const authError = {
      message: 'Request failed with status code 401',
      response: { status: 401, data: { message: 'Invalid credentials' } },
      config: { url: '/auth/login' },
    };

    await expect(rejectedHandler(authError)).rejects.toMatchObject({
      message: 'Invalid credentials',
    });
  });

  it('does NOT rewrite the VITE_API_URL misconfiguration error', async () => {
    const configError = { message: 'VITE_API_URL is missing from the production deployment.', code: 'API_CONFIGURATION_ERROR' };

    await expect(rejectedHandler(configError)).rejects.toMatchObject({
      message: 'VITE_API_URL is missing from the production deployment.',
    });
  });
});
