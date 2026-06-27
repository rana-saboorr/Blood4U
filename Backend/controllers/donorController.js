'use strict';
/**
 * donorController.js — HTTP layer for Donors
 */

const donorService = require('../services/donorService');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/donors — Register as donor
const registerDonor = asyncHandler(async (req, res) => {
  const donor = await donorService.registerDonor(req.user._id, req.body);
  res.status(201).json({ success: true, message: 'Donor registered successfully!', donor });
});

// GET /api/donors — Get all donors (with filters)
const getAllDonors = asyncHandler(async (req, res) => {
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
});

// GET /api/donors/search — Smart matching engine
const searchDonors = asyncHandler(async (req, res) => {
  const { bloodGroup, city, limit } = req.query;
  const { donors, compatibleGroups } = await donorService.searchDonors({ bloodGroup, city, limit });
  res.status(200).json({
    success: true,
    count: donors.length,
    requestedBloodGroup: bloodGroup,
    compatibleGroups,
    donors,
  });
});

// GET /api/donors/me — Get logged-in user's donor profile
const getMyDonorProfile = asyncHandler(async (req, res) => {
  const donor = await donorService.getMyDonorProfile(req.user._id);
  res.status(200).json({ success: true, donor });
});

// PUT /api/donors/me — Update own donor profile
const updateMyDonorProfile = asyncHandler(async (req, res) => {
  const donor = await donorService.updateMyDonorProfile(req.user._id, req.body);
  res.status(200).json({ success: true, message: 'Profile updated.', donor });
});

// PATCH /api/donors/:id/donation — Log a donation (admin or self)
const logDonation = asyncHandler(async (req, res) => {
  const donor = await donorService.logDonation(req.params.id);
  res.status(200).json({ success: true, message: 'Donation logged.', donor });
});

// PATCH /api/donors/me/log-donation — Log a donation by the user themselves
const logManualDonation = asyncHandler(async (req, res) => {
  const donor = await donorService.logManualDonation(req.user._id, req.body);
  res.status(200).json({
    success: true,
    message: 'Donation logged successfully. You are now in recovery mode for 90 days.',
    donor,
  });
});

module.exports = { registerDonor, getAllDonors, searchDonors, getMyDonorProfile, updateMyDonorProfile, logDonation, logManualDonation };
