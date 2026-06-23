// NexORA — Async Handler Wrapper
// Eliminates try/catch boilerplate in every controller.

/**
 * Wraps an async route handler and forwards any error to Express's
 * next() error-handling middleware automatically.
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express-compatible middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
