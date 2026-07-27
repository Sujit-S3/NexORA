// NexORA — JWT Token Generation

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

/**
 * Generate a signed JWT access token.
 * @param {string} id - User _id from MongoDB
 * @returns {string} Signed JWT
 */
const generateAccessToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Generate a signed JWT refresh token. Includes a random `jti` so two
 * tokens issued for the same user within the same second (same payload,
 * same iat) never produce an identical signature — the stored tokenHash
 * has a unique index precisely to catch reuse, so it must never collide
 * by coincidence.
 * @param {string} id - User _id from MongoDB
 * @returns {string} Signed refresh JWT
 */
const generateRefreshToken = (id) => jwt.sign({ id, jti: crypto.randomBytes(16).toString('hex') }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

/** Parses simple "7d" / "30d" / "15m" / "3600s" durations into milliseconds. */
const parseDurationMs = (value, fallbackMs) => {
  const match = /^(\d+)([smhd])$/.exec(String(value || '').trim());
  if (!match) {return fallbackMs;}
  const amount = Number(match[1]);
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }[match[2]];
  return amount * unitMs;
};

const baseCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    // Production (Vercel → Render cross-origin): requires sameSite:'none' + secure:true
    // Development (localhost): lax is sufficient and works without HTTPS
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };
};

/**
 * Send JWT as an HTTP-only cookie and return in response body.
 * @param {Response} res - Express response object
 * @param {object} user - User document (without password)
 * @returns {string} Access token
 */
const sendTokenResponse = (res, user) => {
  const accessToken = generateAccessToken(user._id);

  res.cookie('nexora_token', accessToken, {
    ...baseCookieOptions(),
    maxAge: parseDurationMs(process.env.JWT_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000),
  });

  return accessToken;
};

/**
 * Issues a refresh token, persists its hash (never the raw value) so it can
 * be rotated/revoked, and sets it as a separate httpOnly cookie.
 * @param {object} user - User document
 * @returns {Promise<string>} the raw refresh token (only ever held in the cookie)
 */
const issueRefreshToken = async (res, user) => {
  const refreshToken = generateRefreshToken(user._id);
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const maxAgeMs = parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN, 30 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + maxAgeMs),
  });

  res.cookie('nexora_refresh', refreshToken, {
    ...baseCookieOptions(),
    maxAge: maxAgeMs,
  });

  return refreshToken;
};

/** Revokes every currently-active refresh token for a user (e.g. on password change). */
const revokeAllRefreshTokens = (userId) => RefreshToken.updateMany(
  { user: userId, revokedAt: null },
  { revokedAt: new Date() },
);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  sendTokenResponse,
  issueRefreshToken,
  revokeAllRefreshTokens,
  baseCookieOptions,
  parseDurationMs,
};
