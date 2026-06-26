// NexORA — JWT Authentication Middleware

const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Verifies the Bearer JWT from the Authorization header (or cookie).
 * Attaches the authenticated user to req.user on success.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback to HTTP-only cookie
  else if (req.cookies && req.cookies.nexora_token) {
    token = req.cookies.nexora_token;
  }

  if (!token) {
    throw ApiError.unauthorized('Access denied — no token provided');
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Fetch fresh user (excludes password via model select)
  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw ApiError.unauthorized('Token is invalid — user not found');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated');
  }

  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.nexora_token) {
    token = req.cookies.nexora_token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (err) {
      // ignore invalid token for optional auth
    }
  }

  next();
});

module.exports = { protect, optionalAuth };
