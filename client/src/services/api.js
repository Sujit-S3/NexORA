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

// ── Response interceptor — normalise errors ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    // Auto-redirect on 401 (session expired / not logged in)
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }

    return Promise.reject({ ...error, message });
  }
);

export default api;
