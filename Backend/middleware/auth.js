'use strict';
/**
 * auth.js (authMiddleware) — JWT verification from httpOnly cookie.
 *
 * Checks:
 *   1. Token present in `accessToken` cookie (or Authorization header fallback for dev)
 *   2. Token is valid and not expired
 *   3. User exists and isActive === true
 *   4. Token version matches (invalidated on logout-all / deactivation)
 *   5. Token fingerprint matches (detects token theft across different UA/IP)
 */

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../models/User');
const logger = require('../utils/logger');

/**
 * Compute a fingerprint from the request's User-Agent and IP.
 * If either changes after login, we treat it as a potential theft.
 */
const computeFingerprint = (req) =>
  crypto
    .createHash('sha256')
    .update((req.headers['user-agent'] || '') + ':' + (req.ip || ''))
    .digest('hex');

const protect = async (req, res, next) => {
  try {
    let token;

    // 1) Prefer the dedicated `accessToken` httpOnly cookie
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    // 2) Legacy `token` cookie (backward compat during migration)
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    // 3) Authorization header — allowed in dev/test only
    } else if (
      req.headers.authorization?.startsWith('Bearer ') &&
      process.env.NODE_ENV !== 'production'
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
    }

    // Verify signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    // Fetch user — include tokenVersion for version-check
    const user = await User.findById(decoded.id || decoded.userId)
      .select('+tokenVersion +isActive +refreshTokenHash')
      .lean();

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    // Account active check
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Please contact support.' });
    }

    // Token version check — catches logout-all and forced invalidations
    if (
      decoded.tokenVersion !== undefined &&
      user.tokenVersion !== decoded.tokenVersion
    ) {
      return res.status(401).json({ success: false, message: 'Session invalidated. Please log in again.' });
    }

    // Fingerprint check — detect token theft (only when fp is in payload)
    if (decoded.fp) {
      const currentFp = computeFingerprint(req);
      if (decoded.fp !== currentFp) {
        // Possible token theft — invalidate ALL sessions
        logger.warn({
          msg: 'Fingerprint mismatch — possible token theft',
          userId: user._id,
          ip: req.ip,
        });
        await User.findByIdAndUpdate(user._id, {
          $inc: { tokenVersion: 1 },
          refreshTokenHash: null,
        });
        return res.status(401).json({
          success: false,
          message: 'Session invalidated for security reasons. Please log in again.',
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error({ msg: 'authMiddleware error', err: error.message });
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

/**
 * optionalProtect — same as protect but never blocks the request.
 * Sets req.user = null when no valid token is present.
 */
const optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (req.cookies?.accessToken) token = req.cookies.accessToken;
    else if (req.cookies?.token)   token = req.cookies.token;
    else if (req.headers.authorization?.startsWith('Bearer ') && process.env.NODE_ENV !== 'production')
      token = req.headers.authorization.split(' ')[1];

    if (!token) { req.user = null; return next(); }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded.userId).lean();
    req.user = user || null;
    return next();
  } catch {
    req.user = null;
    return next();
  }
};

module.exports = { protect, optionalProtect, computeFingerprint };
