const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['emergency', 'event', 'info', 'system'],
      default: 'info',
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    bloodGroup: String,
    city: String,
    hospital: String,
    recipients: {
      type: [String], // Array of roles or 'all'
      default: ['all'],
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
