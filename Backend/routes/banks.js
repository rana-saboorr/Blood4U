'use strict';
/**
 * routes/banks.js — Blood Bank routes.
 */

const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const v = require('../validators/shared');
const handleValidationErrors = require('../middleware/handleValidationErrors');
const { protect, optionalProtect } = require('../middleware/auth');
const requireOwnership       = require('../middleware/requireOwnership');
const BloodBank              = require('../models/BloodBank');

const {
  registerBank,
  getBanks,
  getBankById,
  updateBank,
  getBankInventory,
  updateBankInventory
} = require('../controllers/bloodBankController');

// ── Register a new bank ───────────────────────────────────────────────────────
router.post('/',
  protect,
  [
    body('name').trim().notEmpty().withMessage('Bank name is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    v.phone('contact'),
    v.coords().optional(),
  ],
  handleValidationErrors,
  registerBank
);

// ── Get approved banks (public) ───────────────────────────────────────────────
router.get('/', optionalProtect, getBanks);

// ── Get a specific bank (public if approved) ──────────────────────────────────
router.get('/:id',
  optionalProtect,
  [v.mongoId('id')],
  handleValidationErrors,
  getBankById
);

// ── Update bank profile (owner/admin) ─────────────────────────────────────────
router.patch('/:id',
  protect,
  requireOwnership(BloodBank, 'owner'),
  [
    v.mongoId('id'),
    body('name').optional().trim().notEmpty().withMessage('Bank name cannot be empty'),
    body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
    v.phone('contact').optional(),
    v.coords().optional(),
  ],
  handleValidationErrors,
  updateBank
);

// ── Get bank inventory (public if approved) ───────────────────────────────────
router.get('/:id/inventory',
  optionalProtect,
  [v.mongoId('id')],
  handleValidationErrors,
  getBankInventory
);

// ── Update bank inventory (owner/admin) ───────────────────────────────────────
router.patch('/:id/inventory',
  protect,
  requireOwnership(BloodBank, 'owner'),
  [
    v.mongoId('id'),
    body('updates').isArray({ min: 1 }).withMessage('updates must be an array'),
    body('updates.*.bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group in updates array'),
    body('updates.*.delta').isInt().withMessage('delta must be an integer'),
  ],
  handleValidationErrors,
  updateBankInventory
);

module.exports = router;
