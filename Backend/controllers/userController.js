'use strict';
/**
 * userController.js — HTTP layer for Users
 */

const userService = require('../services/userService');
const { sanitizeUser } = require('../utils/sanitize');

// GET /api/users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers(req.query);
    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map(u => sanitizeUser(u, req.user?.role, req.user?._id))
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({
      success: true,
      user: sanitizeUser(user, req.user?.role, req.user?._id)
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'User updated.',
      user: sanitizeUser(user, req.user?.role, req.user?._id)
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user._id);
    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/stats
const getStats = async (req, res, next) => {
  try {
    const stats = await userService.getStats();
    res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getStats };
