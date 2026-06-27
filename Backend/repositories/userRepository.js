'use strict';
const User = require('../models/User');

class UserRepository {
  /**
   * Find by email, username, or phone.
   * @param {string} identifier
   * @param {boolean} withPassword — include password field
   */
  findByEmailOrUsername(identifier, withPassword = false) {
    const query = User.findOne({
      $or: [{ email: identifier }, { username: identifier }, { phone: identifier }],
    });
    if (withPassword) query.select('+password +refreshTokenHash');
    return query;
  }

  findByEmail(email, withPassword = false) {
    const query = User.findOne({ email });
    if (withPassword) query.select('+password +refreshTokenHash');
    return query;
  }

  /**
   * @param {boolean} withSensitive — include password + refreshTokenHash
   */
  findById(id, withSensitive = false) {
    const query = User.findById(id);
    if (withSensitive) query.select('+password +refreshTokenHash +tokenVersion');
    return query;
  }

  create(userData) {
    return User.create(userData);
  }

  findAll(filter = {}, select = '') {
    return User.find(filter).select(select).sort({ createdAt: -1 });
  }

  /**
   * updateById — wraps findByIdAndUpdate.
   * Supports both plain objects and $-operators.
   */
  updateById(id, update, options = { new: true, runValidators: true }) {
    return User.findByIdAndUpdate(id, update, options);
  }

  /** Alias kept for backward compat */
  findByIdAndUpdate(id, update, options) {
    return this.updateById(id, update, options);
  }

  findByIdAndDelete(id) {
    return User.findByIdAndDelete(id);
  }

  update(user) {
    return user.save();
  }

  /** Paginated list for admin panel */
  async paginate({ filter = {}, page = 1, limit = 20, select = '' }) {
    const skip  = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find(filter).select(select).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }
}

module.exports = new UserRepository();
