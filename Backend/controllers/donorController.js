const donorService = require('../services/donorService');

// POST /api/donors — Register as donor
const registerDonor = async (req, res, next) => {
  try {
    const donor = await donorService.registerDonor(req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Donor registered successfully!', donor });
  } catch (error) {
    next(error);
  }
};

// GET /api/donors — Get all donors (with filters)
const getAllDonors = async (req, res, next) => {
  try {
    const { donors, total } = await donorService.getAllDonors(req.query);
    const { page = 1, limit = 20 } = req.query;
    res.status(200).json({
      success: true,
      count: donors.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      donors,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/donors/search — Smart matching engine
const searchDonors = async (req, res, next) => {
  try {
    const { bloodGroup, city, limit } = req.query;
    const { donors, compatibleGroups } = await donorService.searchDonors({ bloodGroup, city, limit });
    res.status(200).json({
      success: true,
      count: donors.length,
      requestedBloodGroup: bloodGroup,
      compatibleGroups,
      donors,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/donors/me — Get logged-in user's donor profile
const getMyDonorProfile = async (req, res, next) => {
  try {
    const donor = await donorService.getMyDonorProfile(req.user._id);
    res.status(200).json({ success: true, donor });
  } catch (error) {
    next(error);
  }
};

// PUT /api/donors/me — Update own donor profile
const updateMyDonorProfile = async (req, res, next) => {
  try {
    const donor = await donorService.updateMyDonorProfile(req.user._id, req.body);
    res.status(200).json({ success: true, message: 'Profile updated.', donor });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/donors/:id/donation — Log a donation (admin or self)
const logDonation = async (req, res, next) => {
  try {
    const donor = await donorService.logDonation(req.params.id);
    res.status(200).json({ success: true, message: 'Donation logged.', donor });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/donors/me/log-donation — Log a donation by the user themselves
const logManualDonation = async (req, res, next) => {
  try {
    const donor = await donorService.logManualDonation(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Donation logged successfully. You are now in recovery mode for 90 days.',
      donor,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerDonor, getAllDonors, searchDonors, getMyDonorProfile, updateMyDonorProfile, logDonation, logManualDonation };
