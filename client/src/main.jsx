// NexORA — React Entry Point

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

import posthog from 'posthog-js';
import * as Sentry from '@sentry/react';
import ErrorFallback from './components/common/ErrorFallback.jsx';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root not found in index.html');
}

// Initialize PostHog if configured
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    autocapture: true,
    capture_pageview: true // Record page views automatically
  });
}

// Initialize Sentry if configured — silently disabled otherwise (no crash,
// no console noise), same pattern as PostHog above.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  });
}

createRoot(container).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
