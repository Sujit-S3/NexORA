// NexORA — Rate Limiter Middleware

const rateLimit = require('express-rate-limit');

const isDev  = process.env.NODE_ENV !== 'production';
// Skip the limiter entirely in test mode, and use very generous limits in dev
// so that health-check polling, hot-reload, and browser dev-tools don't push
// legitimate local traffic into 429 territory.
const skipInTest = () => process.env.NODE_ENV === 'test';

/**
 * General API rate limiter:
 * - Production: 100 requests per IP per 15 minutes
 * - Development: 1 000 requests per IP per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    message: 'Too many requests — please try again in 15 minutes',
  },
});

/**
 * Strict limiter for auth endpoints (brute-force protection):
 * - Production: 10 requests per IP per 15 minutes
 * - Development: 50 requests per IP per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    message: 'Too many auth attempts — please try again in 15 minutes',
  },
});

module.exports = { apiLimiter, authLimiter };
