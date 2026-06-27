'use strict';
/**
 * validators/shared.js — Reusable express-validator chains.
 * Import these into route files rather than duplicating validation logic.
 */

const { body, param, query } = require('express-validator');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ROLES        = ['user', 'donor', 'bankOwner', 'admin'];

module.exports = {
  /** Valid blood group enum */
  bloodGroup: (field) =>
    body(field)
      .isIn(BLOOD_GROUPS)
      .withMessage(`${field} must be a valid blood group (${BLOOD_GROUPS.join(', ')})`),

  /** Valid MongoDB ObjectId — from URL param by default */
  mongoId: (field, location = 'param') =>
    (location === 'param' ? param : body)(field)
      .isMongoId()
      .withMessage(`${field} must be a valid ID`),

  /** GeoJSON [lng, lat] coordinates */
  coords: () =>
    body('location.coordinates')
      .isArray({ min: 2, max: 2 })
      .withMessage('location.coordinates must be [longitude, latitude]')
      .custom(([lng, lat]) =>
        lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
      )
      .withMessage('Coordinates out of range: lng [-180,180], lat [-90,90]'),

  /** Pakistan or international phone number - exact 11 digits */
  phone: (field) =>
    body(field)
      .matches(/^\d{11}$/)
      .withMessage(`${field} must be exactly 11 digits`),

  /** Safe string — trimmed, HTML-escaped, length-limited */
  safeStr: (field, max = 500) =>
    body(field)
      .trim()
      .escape()
      .isLength({ max })
      .withMessage(`${field} must be under ${max} characters`),

  /** Valid role enum */
  role: (field) =>
    body(field)
      .isIn(ROLES)
      .withMessage(`${field} must be one of: ${ROLES.join(', ')}`),

  /** Pagination query params */
  pagination: () => [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('limit must be 1–100'),
  ],

  /** ISO 8601 date range query params */
  dateRange: () => [
    query('from').optional().isISO8601().toDate().withMessage('from must be a valid date'),
    query('to').optional().isISO8601().toDate().withMessage('to must be a valid date'),
  ],

  /** Password complexity */
  password: (field = 'password') =>
    body(field)
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])/)
      .withMessage('Password must contain uppercase, lowercase, and a special character'),

  /** Standard email */
  email: (field = 'email') =>
    body(field)
      .isEmail()
      .normalizeEmail()
      .withMessage(`${field} must be a valid email address`),

  /** 6-digit OTP */
  otp: (field = 'otp') =>
    body(field)
      .matches(/^\d{6}$/)
      .withMessage(`${field} must be exactly 6 digits`),

  /** Status enum for blood requests */
  requestStatus: (field = 'status') =>
    body(field)
      .isIn(['pending', 'accepted', 'fulfilled', 'cancelled'])
      .withMessage(`${field} must be: pending, accepted, fulfilled, or cancelled`),
};
