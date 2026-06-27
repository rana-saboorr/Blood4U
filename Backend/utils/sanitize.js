'use strict';
/**
 * sanitize.js — Response sanitization utilities.
 * Never send sensitive fields to non-admin callers.
 * Masking and GPS truncation happen at the SERVICE layer.
 */

const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (k in obj) acc[k] = obj[k];
    return acc;
  }, {});

const PUBLIC_FIELDS = ['_id', 'name', 'username', 'role', 'createdAt'];
const SELF_FIELDS   = [...PUBLIC_FIELDS, 'email', 'city', 'isActive', 'lastLoginAt', 'isVerified'];
const ADMIN_FIELDS  = [...SELF_FIELDS, 'phone', 'tokenVersion', 'loginAttempts', 'lockUntil', 'lastLoginIp'];

/**
 * Sanitize a User document based on viewer role.
 * @param {object} user  - Mongoose doc or plain object
 * @param {string} viewerRole
 * @param {string|object} viewerId
 */
function sanitizeUser(user, viewerRole, viewerId) {
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.password;
  delete u.refreshTokenHash;
  delete u.__v;

  if (viewerRole === 'admin') return pick(u, ADMIN_FIELDS);
  if (String(viewerId) === String(u._id)) return pick(u, SELF_FIELDS);
  return pick(u, PUBLIC_FIELDS);
}

/**
 * Mask a person's name: "John Doe" → "J**e"
 */
function maskName(name = '') {
  if (!name) return '';
  if (name.length <= 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

/**
 * Mask a phone number: "03001234567" → "0300****567"
 */
function maskPhone(phone = '') {
  if (!phone || phone.length < 8) return '****';
  return phone.slice(0, 4) + '****' + phone.slice(-3);
}

/**
 * Mask an email address: "john@example.com" → "j***@example.com"
 */
function maskEmail(email = '') {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return local[0] + '***';
  return local[0] + '***@' + domain;
}

/**
 * Truncate GPS coordinates to 2 decimal places (~1km precision).
 * Never expose full precision publicly.
 * @param {[number, number]} coords  [lng, lat]
 */
function truncateCoords([lng, lat]) {
  return [
    Math.round(lng * 100) / 100,
    Math.round(lat * 100) / 100,
  ];
}

module.exports = { sanitizeUser, maskName, maskPhone, maskEmail, truncateCoords };
