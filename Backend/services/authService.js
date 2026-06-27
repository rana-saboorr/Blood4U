'use strict';
/**
 * authService.js — Authentication business logic.
 * Implements dual-token (access + refresh), fingerprinting,
 * Redis-backed lockout, and OTP hardening.
 */

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const userRepository = require('../repositories/userRepository');
const otpRepository  = require('../repositories/otpRepository');
const { hashPassword, comparePassword } = require('../utils/hash');
const { sendOtpEmail, sendSimpleEmail } = require('../utils/mailer');
const loginProtection = require('../utils/loginProtection');
const { logAudit }    = require('../utils/audit');
const redis           = require('../utils/redis');
const logger          = require('../utils/logger');
const { computeFingerprint } = require('../middleware/auth');
const { getConfig }   = require('../config/systemConfig');
const CircuitBreaker  = require('../utils/circuitBreaker');
const AppError        = require('../utils/appError');

// Circuit breaker for email sending
const mailBreaker = new CircuitBreaker(sendOtpEmail, { name: 'sendOtpEmail', failureThreshold: 3 });

// ── Token helpers ─────────────────────────────────────────────────────────────

function generateAccessToken(user, fp) {
  return jwt.sign(
    {
      id:           String(user._id),
      userId:       String(user._id),
      role:         user.role,
      tokenVersion: user.tokenVersion,
      fp,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: String(user._id), userId: String(user._id), type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Set both auth cookies on the response.
 * accessToken  → 15 min, available to all /api routes
 * refreshToken → 7 days,  restricted to /api/v1/auth/refresh
 */
function setAuthCookies(res, accessToken, refreshToken) {
  const isProd    = process.env.NODE_ENV === 'production';
  const baseOpts  = { httpOnly: true, secure: isProd, sameSite: 'Strict' };

  res.cookie('accessToken', accessToken, {
    ...baseOpts,
    maxAge: 15 * 60 * 1000,          // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    ...baseOpts,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path:   '/api/v1/auth/refresh',   // only sent to the refresh endpoint
  });

  // Legacy cookie for backward compat with older middleware
  res.cookie('token', accessToken, {
    ...baseOpts,
    maxAge: 15 * 60 * 1000,
  });
}

function clearAuthCookies(res) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
  res.clearCookie('token');
}

// ── OTP helpers ───────────────────────────────────────────────────────────────
const generateOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;

/** Rate-limit OTP send: max 3 per hour per email */
async function checkOtpSendRate(email) {
  try {
    const key   = `otp:send:rate:${email}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 3600);
    return count;
  } catch {
    return 0; // fail open
  }
}

// ── Service class ─────────────────────────────────────────────────────────────

class AuthService {
  // ── Sign-up OTP ─────────────────────────────────────────────────────────────
  async sendSignupOtp(data) {
    const { username, email, password, phone, role } = data;

    if (!username || !password) throw new AppError('Username and password are required.', 400);
    if (!email)                 throw new AppError('Email is required.', 400);

    if (!phone || !/^0\d{10}$/.test(phone))
      throw new AppError('Valid 11-digit Pakistan phone number is required.', 400);
    if (role === 'admin')
      throw new AppError('Admin accounts cannot be created via signup.', 403);

    let signupRole = role || 'user';
    if (signupRole === 'donor') signupRole = 'user';

    const existing = await userRepository.findByEmailOrUsername(email);
    if (existing) throw new AppError('An account with these credentials already exists.', 409);

    // OTP send rate check
    const sendCount = await checkOtpSendRate(email);
    if (sendCount > 3) throw new AppError('Too many OTP requests. Please wait 1 hour before trying again.', 429);

    const config    = await getConfig();
    const ttlMs     = (config.otpTtlMinutes || 10) * 60 * 1000;
    const otp       = generateOtp();
    const otpHash   = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + ttlMs);

    await otpRepository.deleteByEmailAndPurpose(email, 'signup');
    await otpRepository.create({
      email,
      purpose: 'signup',
      otpHash,
      expiresAt,
      payload: {
        username,
        passwordHash: hashPassword(password),
        phone,
        role: signupRole,
      },
    });

    // Fire-and-forget with circuit breaker
    mailBreaker.call({ email, otp, purpose: 'signup' }).catch((err) =>
      logger.warn({ msg: 'Failed to send signup OTP email', email, err: err.message })
    );

    return { message: `OTP sent to your email. Valid for ${config.otpTtlMinutes || 10} minutes.` };
  }

  // ── Verify sign-up OTP ───────────────────────────────────────────────────────
  async verifySignupOtp({ email, otp, req }) {
    if (!email || !otp) throw new AppError('Email and OTP are required.', 400);

    const otpDoc = await otpRepository.findLatestByEmailAndPurpose(email, 'signup');
    if (!otpDoc) throw new AppError('OTP not found. Please request a new one.', 404);

    if (otpDoc.expiresAt.getTime() < Date.now()) {
      await otpDoc.deleteOne();
      throw new AppError('OTP expired. Please request again.', 410);
    }

    const config = await getConfig();
    if (otpDoc.attempts >= (config.maxOtpAttempts || 3)) {
      await otpDoc.deleteOne();
      throw new AppError('Too many failed attempts. Please request a new OTP.', 429);
    }

    const isMatch = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      throw new AppError('Invalid OTP.', 401);
    }

    if (otpDoc.payload?.role === 'admin')
      throw new AppError('Admin accounts cannot be created via signup.', 403);

    const user = await userRepository.create({
      username:   otpDoc.payload.username,
      email,
      password:   otpDoc.payload.passwordHash,
      phone:      otpDoc.payload.phone,
      role:       otpDoc.payload.role,
      isVerified: true,
    });

    await otpRepository.deleteByEmailAndPurpose(email, 'signup');

    // Automatically log in the user (Dual-token generation)
    const fp           = req ? computeFingerprint(req) : '';
    const accessToken  = generateAccessToken(user, fp);
    const refreshToken = generateRefreshToken(user);
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    
    await userRepository.updateById(user._id, {
      refreshTokenHash: refreshHash,
      lastLoginAt:      new Date(),
      lastLoginIp:      req?.ip,
    });

    await logAudit({ actor: user._id, action: 'login', req });

    return { user, accessToken, refreshToken };
  }

  // ── Login ────────────────────────────────────────────────────────────────────
  async login({ identifier, password, req }) {
    const norm = (identifier || '').trim();
    if (!norm || !password)
      throw new AppError('Credentials are required.', 400);

    // Check account lock (Redis-backed)
    const locked = await loginProtection.isLocked(norm);
    if (locked)
      throw new AppError('Account temporarily locked. Please try again in 15 minutes.', 429);

    const user = await userRepository.findByEmailOrUsername(norm, true); // +password

    // Generic error — never reveal whether email exists
    if (!user) {
      await loginProtection.recordFailedAttempt(norm);
      throw new AppError('Invalid credentials.', 401);
    }

    const isMatch = comparePassword(password, user.password);
    if (!isMatch) {
      await loginProtection.recordFailedAttempt(norm);
      await logAudit({ actor: user._id, action: 'login_failed', req });
      throw new AppError('Invalid credentials.', 401);
    }

    if (!user.isVerified)
      throw new AppError('Please verify your email first.', 403);

    if (!user.isActive)
      throw new AppError('Account deactivated. Please contact support.', 403);

    // Successful login — clear lockout
    await loginProtection.clearAttempts(norm);

    // Build fingerprint for token binding
    const fp           = req ? computeFingerprint(req) : '';
    const accessToken  = generateAccessToken(user, fp);
    const refreshToken = generateRefreshToken(user);

    // Store bcrypt hash of refresh token
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await userRepository.updateById(user._id, {
      refreshTokenHash: refreshHash,
      lastLoginAt:      new Date(),
      lastLoginIp:      req?.ip,
    });

    await logAudit({ actor: user._id, action: 'login', req });
    return { user, accessToken, refreshToken, message: `Welcome back, ${user.username}!` };
  }

  // ── Refresh tokens ───────────────────────────────────────────────────────────
  async refreshTokens({ refreshToken, req }) {
    if (!refreshToken)
      throw new AppError('Refresh token missing.', 401);

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      throw new AppError('Invalid or expired refresh token.', 401);
    }

    const user = await userRepository.findById(decoded.id || decoded.userId, true); // +refreshTokenHash
    if (!user || !user.refreshTokenHash)
      throw new AppError('Session not found. Please log in again.', 401);

    if (!user.isActive)
      throw new AppError('Account deactivated.', 403);

    // Timing-safe comparison via bcrypt
    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      // Possible token theft — invalidate ALL sessions
      logger.warn({ msg: 'Refresh token mismatch — possible theft', userId: user._id, ip: req?.ip });
      await userRepository.updateById(user._id, {
        $inc: { tokenVersion: 1 },
        refreshTokenHash: null,
      });
      throw new AppError('Session invalidated for security. Please log in again.', 401);
    }

    // Rotate both tokens
    const fp              = req ? computeFingerprint(req) : '';
    const newAccessToken  = generateAccessToken(user, fp);
    const newRefreshToken = generateRefreshToken(user);
    const newRefreshHash  = await bcrypt.hash(newRefreshToken, 10);

    await userRepository.updateById(user._id, { refreshTokenHash: newRefreshHash });
    return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // ── Logout ───────────────────────────────────────────────────────────────────
  async logout({ userId, req }) {
    await userRepository.updateById(userId, { refreshTokenHash: null });
    await logAudit({ actor: userId, action: 'logout', req });
  }

  // ── Logout all devices ───────────────────────────────────────────────────────
  async logoutAll({ userId, req }) {
    await userRepository.updateById(userId, {
      $inc: { tokenVersion: 1 },
      refreshTokenHash: null,
    });
    await logAudit({ actor: userId, action: 'logout_all', req });
  }

  // ── Forgot password ──────────────────────────────────────────────────────────
  async sendForgotPasswordOtp({ email }) {
    if (!email) throw new AppError('Email is required.', 400);

    // Always return 200 to not reveal account existence
    const user = await userRepository.findByEmail(email);
    if (!user) return { message: 'If this email exists, an OTP has been sent.' };

    const sendCount = await checkOtpSendRate(email);
    if (sendCount > 3) return { message: 'If this email exists, an OTP has been sent.' };

    const config    = await getConfig();
    const ttlMs     = (config.otpTtlMinutes || 10) * 60 * 1000;
    const otp       = generateOtp();
    const otpHash   = await bcrypt.hash(otp, 10);

    await otpRepository.deleteByEmailAndPurpose(email, 'forgot_password');
    await otpRepository.create({
      email,
      purpose:   'forgot_password',
      otpHash,
      expiresAt: new Date(Date.now() + ttlMs),
      userId:    user._id,
    });

    mailBreaker.call({ email, otp, purpose: 'forgot_password' }).catch((err) =>
      logger.warn({ msg: 'Failed to send forgot-password OTP', email, err: err.message })
    );

    return { message: 'If this email exists, an OTP has been sent.' };
  }

  // ── Verify forgot-password OTP ───────────────────────────────────────────────
  async verifyForgotPasswordOtp({ email, otp }) {
    if (!email || !otp) throw new AppError('Email and OTP are required.', 400);

    const otpDoc = await otpRepository.findLatestByEmailAndPurpose(email, 'forgot_password');
    if (!otpDoc) throw new AppError('OTP not found. Request a new one.', 404);

    if (otpDoc.expiresAt.getTime() < Date.now()) {
      await otpDoc.deleteOne();
      throw new AppError('OTP expired. Request a new one.', 410);
    }

    const config = await getConfig();
    if (otpDoc.attempts >= (config.maxOtpAttempts || 3)) {
      await otpDoc.deleteOne();
      throw new AppError('Too many attempts. Please request a new OTP.', 429);
    }

    const isMatch = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      throw new AppError('Invalid OTP.', 401);
    }

    await otpDoc.deleteOne();
    const resetToken = jwt.sign(
      { email, purpose: 'forgot_password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return { resetToken, message: 'OTP verified. Use the reset token to set a new password.' };
  }

  // ── Reset password ───────────────────────────────────────────────────────────
  async resetPassword({ email, resetToken, newPassword }) {
    if (!email || !resetToken || !newPassword)
      throw new AppError('Email, reset token, and new password are required.', 400);

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      throw new AppError('Invalid or expired reset token.', 401);
    }
    if (decoded.email !== email || decoded.purpose !== 'forgot_password_reset')
      throw new AppError('Invalid reset session.', 401);

    const user = await userRepository.findByEmail(email);
    if (!user) throw new AppError('User not found.', 404);

    user.password    = hashPassword(newPassword);
    user.isVerified  = true;
    user.refreshTokenHash = null;
    await userRepository.update(user);

    await logAudit({ actor: user._id, action: 'password_change' });
    return { message: 'Password reset successful. Please log in with your new password.' };
  }

  // ── Change password (authenticated) ─────────────────────────────────────────
  async changePassword({ userId, currentPassword, newPassword, req }) {
    const user = await userRepository.findById(userId, true); // +password
    if (!user) throw new AppError('User not found.', 404);

    if (!comparePassword(currentPassword, user.password))
      throw new AppError('Current password is incorrect.', 401);

    user.password         = hashPassword(newPassword);
    user.refreshTokenHash = null; // invalidate all sessions
    await userRepository.update(user);

    await logAudit({ actor: userId, action: 'password_change', req });
    return { message: 'Password changed. Please log in again.' };
  }
}

module.exports = { AuthService: new AuthService(), setAuthCookies, clearAuthCookies };
