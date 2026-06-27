'use strict';
/**
 * authController.js — HTTP layer only. No business logic.
 * Delegates to AuthService and writes cookies.
 */

const rateLimit = require('express-rate-limit');
const { AuthService, setAuthCookies, clearAuthCookies } = require('../services/authService');
const { sanitizeUser } = require('../utils/sanitize');
const asyncHandler = require('../middleware/asyncHandler');

// Refresh endpoint rate limiter: 20 req/15min per IP
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { success: false, message: 'Too many refresh requests.' },
});

// ── Send signup OTP ─────────────────────────────────────────────────────────
const sendSignupOtp = asyncHandler(async (req, res) => {
  const result = await AuthService.sendSignupOtp(req.body);
  res.status(200).json({ success: true, ...result });
});

// ── Verify signup OTP ───────────────────────────────────────────────────────
const verifySignupOtp = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await AuthService.verifySignupOtp({ ...req.body, req });
  setAuthCookies(res, accessToken, refreshToken);
  res.status(201).json({
    success: true,
    message: 'Signup verified and logged in successfully!',
    user:    sanitizeUser(user, user.role, user._id),
  });
});

// ── Login ───────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken, message } =
    await AuthService.login({ ...req.body, req });

  setAuthCookies(res, accessToken, refreshToken);
  res.status(200).json({
    success: true,
    message,
    user: sanitizeUser(user, user.role, user._id),
  });
});

// ── Refresh access token ────────────────────────────────────────────────────
const refresh = [
  refreshLimiter,
  asyncHandler(async (req, res) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const { user, accessToken, refreshToken: newRefreshToken } =
        await AuthService.refreshTokens({ refreshToken, req });

      setAuthCookies(res, accessToken, newRefreshToken);
      res.status(200).json({ success: true, message: 'Token refreshed.' });
    } catch (err) {
      // Clear cookies on invalid refresh so client doesn't loop
      clearAuthCookies(res);
      throw err;
    }
  }),
];

// ── Logout ──────────────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  await AuthService.logout({ userId: req.user._id, req });
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// ── Logout all devices ──────────────────────────────────────────────────────
const logoutAll = asyncHandler(async (req, res) => {
  await AuthService.logoutAll({ userId: req.user._id, req });
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: 'Logged out from all devices.' });
});

// ── Get current user ────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: sanitizeUser(req.user, req.user.role, req.user._id),
  });
});

// ── Forgot password — send OTP ──────────────────────────────────────────────
const sendForgotPasswordOtp = asyncHandler(async (req, res) => {
  const result = await AuthService.sendForgotPasswordOtp({ email: req.body.email });
  res.status(200).json({ success: true, ...result });
});

// ── Forgot password — verify OTP ────────────────────────────────────────────
const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
  const result = await AuthService.verifyForgotPasswordOtp(req.body);
  res.status(200).json({ success: true, ...result });
});

// ── Reset password ──────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const result = await AuthService.resetPassword(req.body);
  res.status(200).json({ success: true, ...result });
});

// ── Change password (authenticated) ────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await AuthService.changePassword({
    userId: req.user._id,
    currentPassword,
    newPassword,
    req,
  });
  clearAuthCookies(res);
  res.status(200).json({ success: true, ...result });
});

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
