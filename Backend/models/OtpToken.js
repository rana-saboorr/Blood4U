'use strict';
const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * OtpToken — stores hashed OTPs for signup and password-reset flows.
 * TTL index ensures tokens are auto-deleted after expiry.
 */
const otpTokenSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    purpose: {
      type: String,
      enum: ['signup', 'forgot_password'],
      required: true,
    },
    /** bcrypt hash of the plain OTP — never store plaintext */
    otpHash: {
      type: String,
      required: true,
    },
    /** Hard expiry date — also enforced by MongoDB TTL index */
    expiresAt: {
      type: Date,
      required: true,
    },
    /** Signup payload: { username, passwordHash, phone, role } */
    payload: {
      type: Object,
      default: {},
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    /** Number of failed verify attempts — locked after maxOtpAttempts */
    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// MongoDB TTL index — auto-deletes expired documents
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// One active OTP per user+purpose
otpTokenSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('OtpToken', otpTokenSchema);
