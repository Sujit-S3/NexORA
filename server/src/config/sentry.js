// NexORA — Sentry Error Tracking (server)
// Gated entirely on SENTRY_DSN being set — if it's absent, every export here
// is a safe no-op, matching the same "optional until configured" pattern
// used for Razorpay/Cloudinary elsewhere in this app.

const Sentry = require('@sentry/node');

const isSentryConfigured = () => Boolean(process.env.SENTRY_DSN);

const initSentry = () => {
  if (!isSentryConfigured()) {
    console.log('⚠️   SENTRY_DSN not set — server error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    // Trace a small sample in production, everything in dev is noisy/unnecessary.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  });

  console.log('✅  Sentry error tracking initialized');
};

/** Only unexpected (5xx) errors are worth an alert — routine 4xx validation/auth failures aren't. */
const captureIfUnexpected = (err, statusCode) => {
  if (isSentryConfigured() && (!statusCode || statusCode >= 500)) {
    Sentry.captureException(err);
  }
};

module.exports = { Sentry, initSentry, isSentryConfigured, captureIfUnexpected };
