const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Any'];

const bloodRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: { values: BLOOD_GROUPS, message: 'Invalid blood group' },
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity (units) is required'],
      min: [1, 'At least 1 unit is required'],
    },
    hospitalName: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        validator: function (d) {
          return new Date(d) >= new Date(new Date().setHours(0, 0, 0, 0));
        },
        message: 'Date must be today or in the future',
      },
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    contactInfo: {
      type: String,
      required: [true, 'Contact info is required'],
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
    },
    fullAddress: {
      type: String,
      required: [true, 'Full address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'fulfilled'],
      default: 'pending',
    },
    urgent: {
      type: Boolean,
      default: false,
    },
    matchedDonors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donor',
      },
    ],
    rejectedAt: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);

// Production Indexes for performance tuning
bloodRequestSchema.index({ bloodGroup: 1, city: 1, status: 1 });
bloodRequestSchema.index({ urgent: 1 });
bloodRequestSchema.index({ date: 1 });
bloodRequestSchema.index({ userId: 1 });

// TTL index: delete document 24 hours after rejectedAt is set
bloodRequestSchema.index({ rejectedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
