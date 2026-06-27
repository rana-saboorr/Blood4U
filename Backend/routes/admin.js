'use strict';
/**
 * routes/admin.js — Admin-only routes.
 * All routes require 'admin' role.
 */

const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const v = require('../validators/shared');
const handleValidationErrors = require('../middleware/handleValidationErrors');
const { protect }            = require('../middleware/auth');
const requireRole            = require('../middleware/requireRole');

const {
  listUsers, deactivateUser, reactivateUser, changeUserRole, forceLogoutUser,
  listBanks, approveBank, rejectBank, suspendBank,
  listRequests, forceFulfillRequest,
  listDonors, suspendDonor,
  getAuditLog,
  getSystemConfig, updateSystemConfig,
  analyticsSummary, requestsOverTime, donorsByCity, bloodGroupDistribution, registrationsOverTime,
} = require('../controllers/adminController');

// All admin routes require authentication and the admin role
router.use(protect);
router.use(requireRole('admin'));

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', v.pagination(), handleValidationErrors, listUsers);
router.patch('/users/:id/deactivate', v.mongoId('id'), handleValidationErrors, deactivateUser);
router.patch('/users/:id/reactivate', v.mongoId('id'), handleValidationErrors, reactivateUser);
router.patch('/users/:id/role',
  [v.mongoId('id'), v.role('role')],
  handleValidationErrors,
  changeUserRole
);
router.post('/users/:id/force-logout', v.mongoId('id'), handleValidationErrors, forceLogoutUser);

// ── Banks ─────────────────────────────────────────────────────────────────────
router.get('/banks', v.pagination(), handleValidationErrors, listBanks);
router.patch('/banks/:id/approve', v.mongoId('id'), handleValidationErrors, approveBank);
router.patch('/banks/:id/reject',
  [v.mongoId('id'), body('reason').notEmpty().withMessage('Reason is required for rejection')],
  handleValidationErrors,
  rejectBank
);
router.patch('/banks/:id/suspend',
  [v.mongoId('id'), body('reason').notEmpty().withMessage('Reason is required for suspension')],
  handleValidationErrors,
  suspendBank
);

// ── Blood Requests ────────────────────────────────────────────────────────────
router.get('/requests', v.pagination(), handleValidationErrors, listRequests);
router.patch('/requests/:id/force-fulfill', v.mongoId('id'), handleValidationErrors, forceFulfillRequest);

// ── Donors ────────────────────────────────────────────────────────────────────
router.get('/donors', v.pagination(), handleValidationErrors, listDonors);
router.patch('/donors/:id/suspend', v.mongoId('id'), handleValidationErrors, suspendDonor);

// ── Audit Log ─────────────────────────────────────────────────────────────────
router.get('/audit-log', v.pagination(), handleValidationErrors, getAuditLog);

// ── System Config ─────────────────────────────────────────────────────────────
router.get('/config', getSystemConfig);
router.patch('/config', updateSystemConfig); // In reality, we could add strict validation here too

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics/summary', analyticsSummary);
router.get('/analytics/requests-over-time', requestsOverTime);
router.get('/analytics/donors-by-city', donorsByCity);
router.get('/analytics/blood-group-distribution', bloodGroupDistribution);
router.get('/analytics/registrations-over-time', registrationsOverTime);

module.exports = router;
