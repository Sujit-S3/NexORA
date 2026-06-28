// NexORA — JWT Token Generation

const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT access token.
 * @param {string} id - User _id from MongoDB
 * @returns {string} Signed JWT
 */
const generateAccessToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Generate a signed JWT refresh token.
 * @param {string} id - User _id from MongoDB
 * @returns {string} Signed refresh JWT
 */
const generateRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

/**
 * Send JWT as an HTTP-only cookie and return in response body.
 * @param {Response} res - Express response object
 * @param {object} user - User document (without password)
 * @returns {string} Access token
 */
const sendTokenResponse = (res, user) => {
  const accessToken = generateAccessToken(user._id);

  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    // Production (Vercel → Render cross-origin): requires sameSite:'none' + secure:true
    // Development (localhost): lax is sufficient and works without HTTPS
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie('nexora_token', accessToken, cookieOptions);

  return accessToken;
};

module.exports = { generateAccessToken, generateRefreshToken, sendTokenResponse };
