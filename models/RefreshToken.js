const mongoose = require('mongoose');

// Stores refresh tokens for JWT rotation.
// Tokens are auto-expired by MongoDB TTL index — no manual cleanup needed.

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    token:     { type: String, required: true, unique: true },
    userAgent: { type: String },   // browser / device info
    ipAddress: { type: String },

    isRevoked:  { type: Boolean, default: false },
    revokedAt:  { type: Date,    default: null },

    // TTL — MongoDB auto-deletes the document after this date
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-delete expired tokens (TTL index)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
