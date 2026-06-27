'use strict';
const mongoose = require('mongoose');

/**
 * SystemConfig — singleton document storing all tunable platform parameters.
 * Access via the getConfig() helper, never query this model directly in app code.
 */
const systemConfigSchema = new mongoose.Schema({
  emergencyBroadcastRadiusKm: { type: Number, default: 50 },
  donorCooldownDays:          { type: Number, default: 90 },
  maxOtpAttempts:             { type: Number, default: 3 },
  otpTtlMinutes:              { type: Number, default: 10 },
  loginLockThreshold:         { type: Number, default: 5 },
  loginLockDurationMins:      { type: Number, default: 15 },
  maintenanceMode:            { type: Boolean, default: false },
  maintenanceMessage:         { type: String, default: 'System is under scheduled maintenance. We will be back shortly.' },
  contactEmail:               { type: String, default: '' },
  updatedBy:                  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt:                  { type: Date },
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
