'use strict';
/**
 * requestController.js — HTTP layer for Blood Requests
 */

const requestService = require('../services/requestService');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/requests
const createRequest = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const { request, matchedDonors } = await requestService.createRequest(req.user, req.body, io);
  res.status(201).json({
    success: true,
    message: 'Blood request submitted.',
    request,
    matchedDonors,
    matchCount: matchedDonors.length,
  });
});

// GET /api/requests
const getRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { requests, total } = await requestService.getRequests({ user: req.user, query: req.query });
  res.status(200).json({
    success: true,
    count: requests.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    requests,
  });
});

// GET /api/requests/:id
const getRequestById = asyncHandler(async (req, res) => {
  const request = await requestService.getRequestById(req.params.id, req.user);
  res.status(200).json({ success: true, request });
});

// PATCH /api/requests/:id
const updateRequest = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const request = await requestService.updateRequest(req.params.id, req.body, io);
  res.status(200).json({ success: true, message: 'Request updated.', request });
});

// POST /api/requests/:id/donate
const donorDonateToRequest = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await requestService.donorDonateToRequest(req.params.id, req.user, req.body, io);
  res.status(200).json({ success: true, ...result });
});

// DELETE /api/requests/:id
const deleteRequest = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  await requestService.deleteRequest(req.params.id, req.user, io);
  res.status(200).json({ success: true, message: 'Request deleted.' });
});

module.exports = { createRequest, getRequests, getRequestById, updateRequest, donorDonateToRequest, deleteRequest };
