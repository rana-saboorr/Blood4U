'use strict';
/**
 * maintenance.js — Maintenance mode gate.
 * Reads from SystemConfig singleton; admin routes and health check always bypass.
 */

const { getConfig } = require('../config/systemConfig');

module.exports = async (req, res, next) => {
  // Always allow through: admin routes, auth login, health check
  if (
    req.path.startsWith('/api/v1/admin') ||
    req.path.startsWith('/api/v1/auth/login') ||
    req.path === '/api/health' ||
    req.path === '/api/v1/auth/csrf-token'
  ) {
    return next();
  }

  try {
    const config = await getConfig();
    if (config.maintenanceMode) {
      return res.status(503).json({
        status: 'maintenance',
        message: config.maintenanceMessage || 'System is under maintenance. Please try again later.',
        retryAfter: 300,
      });
    }
  } catch {
    // If we cannot read config, don't block requests
  }

  next();
};
