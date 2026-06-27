'use strict';
/**
 * systemConfig.js — Singleton accessor for SystemConfig.
 * Caches in-process; call invalidateConfig() after any PATCH /admin/config.
 */

const SystemConfig = require('../models/SystemConfig');
const logger       = require('../utils/logger');

let _config = null;

/**
 * Returns the singleton SystemConfig document.
 * Creates it with defaults on first run.
 */
async function getConfig() {
  if (_config) return _config;
  try {
    _config = await SystemConfig.findOne().lean();
    if (!_config) {
      const doc = await SystemConfig.create({});
      _config = doc.toObject();
    }
  } catch (err) {
    logger.error({ msg: 'Failed to load SystemConfig', err: err.message });
    // Return safe defaults if DB is unreachable
    _config = {
      emergencyBroadcastRadiusKm: 50,
      donorCooldownDays:          90,
      maxOtpAttempts:             3,
      otpTtlMinutes:              10,
      loginLockThreshold:         5,
      loginLockDurationMins:      15,
      maintenanceMode:            false,
      maintenanceMessage:         'System is under maintenance.',
      contactEmail:               '',
    };
  }
  return _config;
}

/**
 * Clears the in-process cache so the next call to getConfig() re-reads from DB.
 * Must be called after PATCH /api/v1/admin/config.
 */
function invalidateConfig() {
  _config = null;
  logger.info('SystemConfig cache invalidated');
}

module.exports = { getConfig, invalidateConfig };
