'use strict';
/**
 * notificationController.js — HTTP layer for Notifications
 */

const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/appError');

// GET /api/notifications — Get notifications for current user
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    $or: [
      { recipients: 'all' },
      { recipients: req.user.role }
    ]
  }).sort({ createdAt: -1 }).limit(50);

  res.status(200).json({ success: true, notifications });
});

// POST /api/notifications/read/:id — Mark as read
const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    $addToSet: { readBy: req.user._id }
  });
  res.status(200).json({ success: true });
});

// POST /api/notifications — Admin create notification
const createNotification = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Admin only.', 403);
  }
  const notification = await Notification.create(req.body);
  
  // Broadcast via socket
  req.app.get('io')?.emit('notification:new', notification);

  res.status(201).json({ success: true, notification });
});

module.exports = { getNotifications, markAsRead, createNotification };
