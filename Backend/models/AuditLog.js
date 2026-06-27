'use strict';
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    index: true,
    enum: [
      'login', 'login_failed', 'logout', 'logout_all', 'password_change',
      'otp_sent', 'otp_verified', 'otp_failed',
      'user_deactivated', 'user_reactivated', 'user_role_changed',
      'bank_approved', 'bank_rejected', 'bank_suspended',
      'donor_suspended', 'request_force_fulfilled',
      'config_updated', 'emergency_request_created',
      'admin_data_export', 'account_deleted',
    ],
  },
  targetModel: { type: String },
  targetId:    { type: mongoose.Schema.Types.ObjectId },
  metadata:    { type: mongoose.Schema.Types.Mixed },
  ip:          { type: String },
  userAgent:   { type: String },
  createdAt:   { type: Date, default: Date.now },
});

// Compound indexes for common admin queries
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// 1-year TTL — audit logs auto-expire, never manually deleted
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });

auditLogSchema.set('toObject', { versionKey: false });

module.exports = mongoose.model('AuditLog', auditLogSchema);
