// NexORA — Axios Base Instance

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

// ── Silent refresh-on-401 ────────────────────────────────────────────────
// A single in-flight refresh is shared across simultaneously-failing
// requests, so a page that fires several parallel calls only triggers one
// POST /auth/refresh rather than one per call.
let refreshPromise = null;
const NO_REFRESH_PATHS = ['/auth/refresh', '/auth/login', '/auth/register'];

// ── Response interceptor — normalise errors, transparently refresh on 401 ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest && NO_REFRESH_PATHS.some((p) => originalRequest.url?.includes(p));

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
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

    // Auto-redirect on 401 (session expired / not logged in / refresh failed)
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }

    return Promise.reject({ ...error, message });
  }
);

export default api;
