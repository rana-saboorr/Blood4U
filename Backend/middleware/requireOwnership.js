'use strict';
/**
 * requireOwnership.js — Ownership check middleware factory.
 *
 * Admins bypass this check automatically.
 * For all other roles: fetches the document and compares the ownerField value
 * against req.user._id.
 *
 * Usage:
 *   router.patch('/banks/:id', protect, requireOwnership(BloodBank, 'owner'), controller)
 */

const logger = require('../utils/logger');

module.exports = (Model, ownerField = 'owner') =>
  async (req, res, next) => {
    try {
      // Admins can access anything
      if (req.user?.role === 'admin') return next();

      const doc = await Model.findById(req.params.id).select(ownerField).lean();
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Resource not found.' });
      }

      const ownerId = doc[ownerField];
      if (!ownerId || String(ownerId) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied. You do not own this resource.' });
      }

      next();
    } catch (err) {
      logger.error({ msg: 'requireOwnership error', err: err.message });
      next(err);
    }
  };
