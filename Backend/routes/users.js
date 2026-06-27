'use strict';
/**
 * routes/users.js — User route definitions.
 */

const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const v = require('../validators/shared');
const handleValidationErrors = require('../middleware/handleValidationErrors');
const { protect, optionalProtect } = require('../middleware/auth');
const requireRole            = require('../middleware/requireRole');

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStats
} = require('../controllers/userController');

// ── Public / Optional routes ──────────────────────────────────────────────────
router.get('/stats', getStats);
router.get('/', optionalProtect, getAllUsers);
router.get('/:id', optionalProtect, [v.mongoId('id')], handleValidationErrors, getUserById);

// ── Authenticated routes ──────────────────────────────────────────────────────
router.use(protect);

// Users can only update themselves (or admin). We handle the ID check in the route here for simplicity,
// or we can use a custom requireOwnership that works on the User model.
const ensureSelfOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin' || String(req.user._id) === req.params.id) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied.' });
};

router.patch('/:id',
  [
    v.mongoId('id'),
    body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    v.phone('phone').optional(),
    v.safeStr('city').optional(),
  ],
  handleValidationErrors,
  ensureSelfOrAdmin,
  updateUser
);

// Admin-only explicit deletion (cascade deletes)
router.delete('/:id',
  [v.mongoId('id')],
  handleValidationErrors,
  requireRole('admin'),
  deleteUser
);

module.exports = router;
