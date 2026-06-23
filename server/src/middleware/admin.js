// NexORA — Admin Role Guard Middleware

const ApiError = require('../utils/ApiError');

/**
 * Must be used AFTER the `protect` middleware.
 * Rejects requests from non-admin users with 403 Forbidden.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  throw ApiError.forbidden('Access denied — admin privileges required');
};

module.exports = { adminOnly };
