'use strict';
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      validate: {
        validator: (v) => /^0\d{10}$/.test(v),
        message: (props) => `${props.value} is not a valid 11-digit Pakistan phone number!`,
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'donor', 'admin', 'bankOwner'],
      default: 'user',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // ── Section 1.2 — Dual-Token Auth ────────────────────────────────────
    /** Incremented on logout-all / deactivation / suspected token theft */
    tokenVersion: {
      type: Number,
      default: 0,
    },
    /** bcrypt hash of the active refresh token — null means no active session */
    refreshTokenHash: {
      type: String,
      select: false,
      default: null,
    },

    // ── Section 1.2 — Account state ──────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ── Section 1.3 — Login protection (Redis-backed, kept in DB too) ────
    loginAttempts: { type: Number, default: 0 },
    lockUntil:     { type: Date,   default: null },

    // ── Section 1.2 — Session metadata ───────────────────────────────────
    lastLoginAt:  { type: Date,   default: null },
    lastLoginIp:  { type: String, default: null },
  },
  { timestamps: true }
);

// ── Indexes ─────────────────────────────────────────────────────────────────
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
