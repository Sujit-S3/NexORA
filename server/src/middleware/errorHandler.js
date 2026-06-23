// NexORA — Global Error Handler Middleware

const ApiError = require('../utils/ApiError');

/**
 * Global error-handling middleware.
 * Must be registered LAST in the Express app (after all routes).
 *
 * Normalises known error types into a consistent ApiError shape and
 * hides internal details in production.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // ── Mongoose: CastError (invalid ObjectId) ───────────────────────────
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // ── Mongoose: Duplicate key ──────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = ApiError.conflict(`Duplicate value for field: ${field}`);
  }

  // ── Mongoose: Validation error ───────────────────────────────────────
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    error = ApiError.badRequest('Validation failed', errors);
  }

  // ── JWT errors ───────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired');
  }

  // ── Final response ───────────────────────────────────────────────────
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  const response = {
    success: false,
    message,
    errors: error.errors || [],
  };

  // Show stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
