const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Organizer email is required'],
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    phone: {
      type: String,
      required: [true, 'Organizer phone is required'],
    },
    eventType: {
      type: String,
      enum: ['Camp', 'Seminar', 'Drive', 'Awareness'],
      default: 'Camp',
    },
    dateTime: {
      type: Date,
      required: [true, 'Event date/time is required'],
      validate: {
        validator: function (d) {
          return new Date(d) > new Date();
        },
        message: 'Event must be scheduled for the future',
      },
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
    },
    capacity: {
      type: Number,
      default: 100,
      min: [10, 'Capacity must be at least 10'],
    },
    rsvpList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rejectedAt: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);

// TTL index: delete document 24 hours after rejectedAt is set
eventSchema.index({ rejectedAt: 1 }, { expireAfterSeconds: 86400 });

// Virtual attendance count
eventSchema.virtual('attendanceCount').get(function () {
  return this.rsvpList ? this.rsvpList.length : 0;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
