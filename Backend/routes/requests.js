const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  donorDonateToRequest,
  deleteRequest,
} = require('../controllers/requestController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');

const requestValidationRules = [
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Any']).withMessage('Invalid blood group'),
  body('quantity').isInt({ min: 1 }).withMessage('Minimum 1 unit required'),
  body('hospitalName').notEmpty().trim().withMessage('Hospital name is required'),
  body('reason').notEmpty().trim().withMessage('Reason is required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('time').notEmpty().trim().withMessage('Time is required'),
  body('contactInfo').notEmpty().trim().withMessage('Contact info is required'),
  body('mobileNumber')
    .matches(/^\d{11}$/)
    .withMessage('Contact number must be exactly 11 digits, containing only numbers'),
  body('fullAddress').notEmpty().trim().withMessage('Full address is required'),
  body('city').notEmpty().withMessage('City is required'),
];

// POST /api/requests — Create blood request
router.post('/', protect, requestValidationRules, validate, createRequest);

// GET /api/requests — All or own (role-filtered)
router.get('/', protect, getRequests);

// GET /api/requests/:id — Single request
router.get('/:id', protect, getRequestById);

// PATCH /api/requests/:id — Update status/urgent (admin)
router.patch('/:id', protect, authorize('admin'), updateRequest);

// POST /api/requests/:id/donate — Donor confirms donation
router.post('/:id/donate', protect, authorize('donor'), donorDonateToRequest);

// DELETE /api/requests/:id — Owner or admin
router.delete('/:id', protect, deleteRequest);

module.exports = router;

