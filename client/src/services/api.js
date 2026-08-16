// NexORA — Axios Base Instance

import axios from 'axios';

const CONFIGURED_BASE_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
const BASE_URL = CONFIGURED_BASE_URL || '/api';
export const apiBaseUrl = BASE_URL;
export const apiConfigurationError = import.meta.env.PROD && !CONFIGURED_BASE_URL
  ? 'VITE_API_URL is missing from the production deployment.'
  : '';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Auth is entirely via the httpOnly `nexora_token` cookie — the browser
  // attaches it automatically, and JS never has access to read it (which is
  // the point: an XSS bug elsewhere can't exfiltrate a token that isn't
  // reachable from localStorage/JS in the first place).
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (apiConfigurationError) {
    const error = new Error(`${apiConfigurationError} Store requests are disabled until it is configured.`);
    error.code = 'API_CONFIGURATION_ERROR';
    return Promise.reject(error);
  }
  return config;
});

// ── Silent refresh-on-401 ────────────────────────────────────────────────
// A single in-flight refresh is shared across simultaneously-failing
// requests, so a page that fires several parallel calls only triggers one
// POST /auth/refresh rather than one per call.
let refreshPromise = null;
const NO_REFRESH_PATHS = ['/auth/refresh', '/auth/login', '/auth/register'];

// Public routes where an unauthenticated 401 is totally expected and should
// NOT trigger a redirect (e.g. background /auth/me check on homepage/register).
// Must cover every route in App.jsx that isn't wrapped in <PrivateRoute> —
// otherwise the mount-time auth check (AuthContext) can lose a race against
// a same-tick client-side navigate() (e.g. Home -> /get-started for
// first-time visitors) and force a hard redirect to /login on a page that
// never required auth in the first place.
const isPublicPage = () => {
  const p = window.location.pathname;
  return (
    p === '/' ||
    p.startsWith('/login') ||
    p.startsWith('/register') ||
    p.startsWith('/products') ||
    p.startsWith('/product/') ||
    p.startsWith('/collections') ||
    p.startsWith('/concierge') ||
    p.startsWith('/wishlist') ||
    p.startsWith('/get-started') ||
    p.startsWith('/forgot-password') ||
    p.startsWith('/reset-password')
  );
};

// ── Response interceptor — normalise errors, transparently refresh on 401 ──
api.interceptors.response.use(
  (response) => {
    const contentType = response.headers?.['content-type'] || '';
    if (contentType.includes('text/html') && typeof response.data === 'string') {
      const error = new Error('The API URL returned the frontend application instead of JSON. Check VITE_API_URL before redeploying.');
      error.code = 'API_CONFIGURATION_ERROR';
      return Promise.reject(error);
    }
    return response;
  },
  async (error) => {
    // No error.response means the request never got a server reply at all —
    // DNS/connection failure, or (most commonly on Render's free/starter
    // tier) a cold-start wake-up that outlasted the 15s timeout. Axios's own
    // wording for this ("Network Error", "timeout of 15000ms exceeded") is
    // accurate but not actionable, and is easily confused with a genuine
    // 4xx failure like wrong credentials. Presence of error.response (not
    // the message text) is the reliable discriminator between the two.
    const isConfigError = error.code === 'API_CONFIGURATION_ERROR';
    const isNetworkOrTimeout = !error.response && !isConfigError;

    const message = isNetworkOrTimeout
      ? "Couldn't reach NexORA's servers — this can happen right after a period of inactivity. Please try again in a moment."
      : error.response?.data?.message || error.message || 'An unexpected error occurred';

    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest && NO_REFRESH_PATHS.some((p) => originalRequest.url?.includes(p));

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh').finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        return api(originalRequest);
      } catch {
        // Refresh failed too — fall through to the redirect below.
      }
    }

    // Auto-redirect on 401 ONLY when the user is on a protected route.
    // Background calls (/auth/me, /ai/health) on public/auth pages should
    // fail silently instead of hijacking the current page.
    if (error.response?.status === 401 && !isPublicPage()) {
      window.location.href = '/login';
    }

    return Promise.reject({ ...error, message });
  }
);

export default api;
