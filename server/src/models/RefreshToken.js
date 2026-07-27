// NexORA — Refresh Token Model
// Tracks issued refresh tokens server-side so they can be rotated and
// revoked. The raw JWT never touches the database — only its SHA-256 hash,
// matching the existing password-reset-token convention (authController.js).

const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    // Set when this token is rotated out for a newer one — lets a reuse of
    // an already-rotated token be recognized as token theft, not just "expired".
    replacedByTokenHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ user: 1 });
// TTL index — MongoDB automatically deletes documents once expiresAt passes,
// so revoked/expired history doesn't accumulate forever.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
module.exports = RefreshToken;
