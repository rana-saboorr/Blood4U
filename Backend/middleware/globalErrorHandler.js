'use strict';
/**
 * globalErrorHandler.js — Centralized error handler.
 * Must be the LAST middleware registered in server.js.
 * Returns consistent error responses and never leaks stack traces in production.
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  const correlationId = req.correlationId || crypto.randomUUID();

  // Structured log with context
  logger.error({
    correlationId,
    url:        req.url,
    method:     req.method,
    userId:     req.user?._id,
    statusCode: err.statusCode || 500,
    message:    err.message,
    stack:      process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // ── Mongoose validation errors ───────────────────────────────────────────
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      status:  'fail',
      errors: Object.values(err.errors).map((e) => ({
        field:   e.path,
        message: e.message,
      })),
    });
  }

  // ── Mongoose duplicate key ───────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      status:  'fail',
      message: `${field} already exists.`,
    });
  }

  // ── Mongoose CastError (bad ObjectId) ───────────────────────────────────
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // ── JWT errors ───────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
  }

  // ── CSRF errors ──────────────────────────────────────────────────────────
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ success: false, message: 'Invalid or missing CSRF token.' });
  }

  // ── Default ──────────────────────────────────────────────────────────────
  const status  = err.statusCode || 500;
  const message = (process.env.NODE_ENV === 'production' && status === 500)
    ? 'Something went wrong. Please try again.'
    : (err.message || 'Internal Server Error');

  res.setHeader('X-Correlation-ID', correlationId);
  res.status(status).json({
    success: false,
    status:  'error',
    message,
    correlationId,
  });
};
