// NexORA — 404 Not Found Handler

const ApiError = require('../utils/ApiError');

/**
 * Catch-all for unmatched routes.
 * Must be registered AFTER all route definitions.
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;
