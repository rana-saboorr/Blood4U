'use strict';
/**
 * loginProtection.js — Redis-backed brute-force protection.
 * Tracks failed login attempts per email and locks accounts automatically.
 */

const redis = require('./redis');
const logger = require('./logger');

const THRESHOLD    = 5;     // failed attempts before lock
const WINDOW_SECS  = 900;   // 15 minutes

/**
 * Record a failed login attempt for the given email.
 * Locks the account and triggers a notification email if threshold is hit.
 * @param {string} email
 * @returns {Promise<number>} current fail count
 */
async function recordFailedAttempt(email) {
  try {
    const key = `login:fail:${email}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WINDOW_SECS);

    if (count >= THRESHOLD) {
      await redis.set(`login:lock:${email}`, '1', 'EX', WINDOW_SECS);
      logger.warn({ msg: 'Account locked after failed attempts', email });
      // Fire-and-forget — lock email notification
      try {
        const { sendSimpleEmail } = require('./mailer');
        await sendSimpleEmail({
          to: email,
          subject: 'Blood4U — Account Temporarily Locked',
          text: `Your account has been temporarily locked due to ${THRESHOLD} failed login attempts.\n\nIt will be unlocked automatically in 15 minutes. If this was not you, please reset your password immediately.`,
        });
      } catch (mailErr) {
        logger.warn({ msg: 'Failed to send account-lock email', err: mailErr.message });
      }
    }

    return count;
  } catch (err) {
    // Redis unavailable — fail open (log but don't block login)
    logger.error({ msg: 'loginProtection.recordFailedAttempt failed', err: err.message });
    return 0;
  }
}

/**
 * Check if an email is currently locked.
 * @param {string} email
 * @returns {Promise<boolean>}
 */
async function isLocked(email) {
  try {
    return Boolean(await redis.get(`login:lock:${email}`));
  } catch (err) {
    logger.error({ msg: 'loginProtection.isLocked failed', err: err.message });
    return false; // fail open
  }
}

/**
 * Clear all failed-attempt and lock keys on successful login.
 * @param {string} email
 */
async function clearAttempts(email) {
  try {
    await redis.del(`login:fail:${email}`, `login:lock:${email}`);
  } catch (err) {
    logger.error({ msg: 'loginProtection.clearAttempts failed', err: err.message });
  }
}

module.exports = { recordFailedAttempt, isLocked, clearAttempts };
