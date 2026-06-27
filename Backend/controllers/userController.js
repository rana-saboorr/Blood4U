'use strict';
/**
 * userController.js — HTTP layer for Users
 */

const userService = require('../services/userService');
const { sanitizeUser } = require('../utils/sanitize');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers(req.query);
  res.status(200).json({
    success: true,
    count: users.length,
    users: users.map(u => sanitizeUser(u, req.user?.role, req.user?._id))
  });
});

// GET /api/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({
    success: true,
    user: sanitizeUser(user, req.user?.role, req.user?._id)
  });
});

// PATCH /api/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: 'User updated.',
    user: sanitizeUser(user, req.user?.role, req.user?._id)
  });
});

// DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user._id);
  res.status(200).json({ success: true, message: 'User deleted successfully.' });
});

// GET /api/users/stats
const getStats = asyncHandler(async (req, res) => {
  const stats = await userService.getStats();
  res.status(200).json({ success: true, stats });
});

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getStats };
