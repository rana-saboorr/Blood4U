const bcrypt = require('bcryptjs');

/**
 * Hash a password using bcrypt
 */
const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

/**
 * Compare plain text password against stored hash
 */
const comparePassword = (password, storedHash) => {
  // Graceful fallback for previously stored SHA-256 hashes during migration
  if (storedHash.includes(':')) {
    const crypto = require('crypto');
    const [salt, oldHash] = storedHash.split(':');
    const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
    return hash === oldHash;
  }
  return bcrypt.compareSync(password, storedHash);
};

module.exports = { hashPassword, comparePassword };
