'use strict';
/**
 * Environment variable validation.
 * Import this module FIRST in server.js before anything else.
 * Throws on startup if any required variable is missing or too weak.
 */

const REQUIRED = [
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
  'COOKIE_EXPIRE',
  'FRONTEND_URL',
  'EMAIL_USER',
  'EMAIL_PASS',
  'FIELD_ENCRYPTION_KEY',
  'REDIS_URL',
  'NODE_ENV',
];

REQUIRED.forEach((k) => {
  if (!process.env[k]) {
    throw new Error(`[STARTUP] Missing required env var: ${k}`);
  }
});

if (Buffer.byteLength(process.env.JWT_SECRET) < 32) {
  throw new Error('[STARTUP] JWT_SECRET must be at least 32 bytes');
}
if (Buffer.byteLength(process.env.REFRESH_TOKEN_SECRET) < 32) {
  throw new Error('[STARTUP] REFRESH_TOKEN_SECRET must be at least 32 bytes');
}
if (Buffer.byteLength(process.env.FIELD_ENCRYPTION_KEY) < 32) {
  throw new Error('[STARTUP] FIELD_ENCRYPTION_KEY must be at least 32 bytes');
}

module.exports = {};
