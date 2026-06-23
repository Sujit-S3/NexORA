// NexORA — Rate Limiter Middleware

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter:
 * 100 requests per IP per 15 minutes.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests — please try again in 15 minutes',
  },
});

/**
 * Strict limiter for auth endpoints:
 * 10 requests per IP per 15 minutes (prevent brute-force).
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts — please try again in 15 minutes',
  },
});

module.exports = { apiLimiter, authLimiter };
