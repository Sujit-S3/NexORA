// NexORA — React Entry Point

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

import posthog from 'posthog-js';

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

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
