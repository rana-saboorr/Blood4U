const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  registerDonor,
  getAllDonors,
  searchDonors,
  getMyDonorProfile,
  updateMyDonorProfile,
  logDonation,
  logManualDonation,
} = require('../controllers/donorController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');

const donorValidationRules = [
  body('fullName').notEmpty().trim().withMessage('Full name is required'),
  body('mobile').matches(/^0\d{10}$/).withMessage('Valid 11-digit Pakistan number required'),
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('city').notEmpty().withMessage('City is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
  body('weight').isFloat({ min: 50 }).withMessage('Minimum weight 50kg required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
];

const donorUpdateValidationRules = [
  body('fullName').notEmpty().trim().withMessage('Full name is required'),
  body('mobile').matches(/^0\d{10}$/).withMessage('Valid 11-digit Pakistan number required'),
  body('city').notEmpty().withMessage('City is required'),
];

// GET /api/donors/search — Smart matching engine
router.get('/search', protect, searchDonors);

// GET /api/donors/me — Own donor profile
router.get('/me', protect, getMyDonorProfile);

// PATCH /api/donors/me/log-donation — Log a donation by self
router.patch('/me/log-donation', protect, authorize('donor'), logManualDonation);

// PUT /api/donors/me — Update own donor profile
router.put('/me', protect, authorize('donor'), donorUpdateValidationRules, validate, updateMyDonorProfile);

// POST /api/donors — Register as donor
router.post('/', protect, donorValidationRules, validate, registerDonor);

// GET /api/donors — All donors (with filters)
router.get('/', protect, getAllDonors);

// PATCH /api/donors/:id/donation — Log a donation (admin only)
router.patch('/:id/donation', protect, authorize('admin'), logDonation);

module.exports = router;

