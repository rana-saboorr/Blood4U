'use strict';
/**
 * authController.js — HTTP layer only. No business logic.
 * Delegates to AuthService and writes cookies.
 */

const rateLimit = require('express-rate-limit');
const { AuthService, setAuthCookies, clearAuthCookies } = require('../services/authService');
const { sanitizeUser } = require('../utils/sanitize');

// Refresh endpoint rate limiter: 20 req/15min per IP
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { success: false, message: 'Too many refresh requests.' },
});

// ── Send signup OTP ─────────────────────────────────────────────────────────
const sendSignupOtp = async (req, res, next) => {
  try {
    const result = await AuthService.sendSignupOtp(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ── Verify signup OTP ───────────────────────────────────────────────────────
const verifySignupOtp = async (req, res, next) => {
  try {
    const user = await AuthService.verifySignupOtp(req.body);
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please log in.',
      user:    sanitizeUser(user, 'self', user._id),
    });
  } catch (err) {
    next(err);
  }
};

// ── Login ───────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken, message } =
      await AuthService.login({ ...req.body, req });

    setAuthCookies(res, accessToken, refreshToken);
    res.status(200).json({
      success: true,
      message,
      user: sanitizeUser(user, user.role, user._id),
    });
  } catch (err) {
    next(err);
  }
};

// ── Refresh access token ────────────────────────────────────────────────────
const refresh = [
  refreshLimiter,
  async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const { user, accessToken, refreshToken: newRefreshToken } =
        await AuthService.refreshTokens({ refreshToken, req });

      setAuthCookies(res, accessToken, newRefreshToken);
      res.status(200).json({ success: true, message: 'Token refreshed.' });
    } catch (err) {
      // Clear cookies on invalid refresh so client doesn't loop
      clearAuthCookies(res);
      next(err);
    }
  },
];

// ── Logout ──────────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    await AuthService.logout({ userId: req.user._id, req });
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// ── Logout all devices ──────────────────────────────────────────────────────
const logoutAll = async (req, res, next) => {
  try {
    await AuthService.logoutAll({ userId: req.user._id, req });
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'Logged out from all devices.' });
  } catch (err) {
    next(err);
  }
};

// ── Get current user ────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: sanitizeUser(req.user, req.user.role, req.user._id),
  });
};

// ── Forgot password — send OTP ──────────────────────────────────────────────
const sendForgotPasswordOtp = async (req, res, next) => {
  try {
    const result = await AuthService.sendForgotPasswordOtp({ email: req.body.email });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ── Forgot password — verify OTP ────────────────────────────────────────────
const verifyForgotPasswordOtp = async (req, res, next) => {
  try {
    const result = await AuthService.verifyForgotPasswordOtp(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ── Reset password ──────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const result = await AuthService.resetPassword(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ── Change password (authenticated) ────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await AuthService.changePassword({
      userId: req.user._id,
      currentPassword,
      newPassword,
      req,
    });
    clearAuthCookies(res);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
