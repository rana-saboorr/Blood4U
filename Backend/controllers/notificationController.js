const Notification = require('../models/Notification');

// GET /api/notifications — Get notifications for current user
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipients: 'all' },
        { recipients: req.user.role }
      ]
    }).sort({ createdAt: -1 }).limit(50);

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

// POST /api/notifications/read/:id — Mark as read
const markAsRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id }
    });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// POST /api/notifications — Admin create notification
const createNotification = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    const notification = await Notification.create(req.body);
    
    // Broadcast via socket
    req.app.get('io').emit('notification:new', notification);

    res.status(201).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, createNotification };
