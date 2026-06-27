const requestService = require('../services/requestService');

// POST /api/requests
const createRequest = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const { request, matchedDonors } = await requestService.createRequest(req.user, req.body, io);
    res.status(201).json({
      success: true,
      message: 'Blood request submitted.',
      request,
      matchedDonors,
      matchCount: matchedDonors.length,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/requests
const getRequests = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

// GET /api/requests/:id
const getRequestById = async (req, res, next) => {
  try {
    const request = await requestService.getRequestById(req.params.id, req.user);
    res.status(200).json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/requests/:id
const updateRequest = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const request = await requestService.updateRequest(req.params.id, req.body, io);
    res.status(200).json({ success: true, message: 'Request updated.', request });
  } catch (error) {
    next(error);
  }
};

// POST /api/requests/:id/donate
const donorDonateToRequest = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const result = await requestService.donorDonateToRequest(req.params.id, req.user, req.body, io);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/requests/:id
const deleteRequest = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    await requestService.deleteRequest(req.params.id, req.user, io);
    res.status(200).json({ success: true, message: 'Request deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRequest, getRequests, getRequestById, updateRequest, donorDonateToRequest, deleteRequest };
