'use strict';
/**
 * routes/auth.js — Auth route definitions.
 * Pattern: [validators] → handleValidationErrors → authMiddleware? → controller
 */

const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const v = require('../validators/shared');
const handleValidationErrors = require('../middleware/handleValidationErrors');
const { protect }            = require('../middleware/auth');

const {
  sendSignupOtp,
  verifySignupOtp,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  changePassword,
} = require('../controllers/authController');

// ── Signup ────────────────────────────────────────────────────────────────────
router.post('/signup/send-otp',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    v.email('email'),
    v.password('password'),
    v.phone('phone'),
  ],
  handleValidationErrors,
  sendSignupOtp
);

router.post('/signup/verify-otp',
  [
    v.email('email'),
    v.otp('otp'),
  ],
  handleValidationErrors,
  verifySignupOtp
);

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login',
  [
    body('identifier').trim().notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  login
);

// ── Token refresh ─────────────────────────────────────────────────────────────
// Reads from the `refreshToken` httpOnly cookie — no body needed
router.post('/refresh', ...refresh);

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout',     protect, logout);
router.post('/logout-all', protect, logoutAll);

// ── Get current user ──────────────────────────────────────────────────────────
router.get('/me', protect, getMe);

// ── Forgot password ───────────────────────────────────────────────────────────
router.post('/forgot-password/send-otp',
  [v.email('email')],
  handleValidationErrors,
  sendForgotPasswordOtp
);

router.post('/forgot-password/verify-otp',
  [v.email('email'), v.otp('otp')],
  handleValidationErrors,
  verifyForgotPasswordOtp
);

router.post('/forgot-password/reset',
  [
    v.email('email'),
    body('resetToken').notEmpty().withMessage('Reset token is required'),
    v.password('newPassword'),
  ],
  handleValidationErrors,
  resetPassword
);

// ── Change password (authenticated) ──────────────────────────────────────────
router.post('/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    v.password('newPassword'),
  ],
  handleValidationErrors,
  changePassword
);

module.exports = router;
