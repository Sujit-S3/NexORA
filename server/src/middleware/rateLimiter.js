// NexORA — Rate Limiter Middleware

const rateLimit = require('express-rate-limit');

// Jest runs every test file's requests through the same in-memory limiter
// state within one process (--runInBand), so real production limits would
// otherwise start rejecting unrelated test files' legitimate requests.
const skipInTest = () => process.env.NODE_ENV === 'test';

/**
 * General API rate limiter:
 * 100 requests per IP per 15 minutes.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
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
  skip: skipInTest,
  message: {
    success: false,
    message: 'Too many auth attempts — please try again in 15 minutes',
  },
});

module.exports = { apiLimiter, authLimiter };
