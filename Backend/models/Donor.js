const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const donorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      validate: {
        validator: function(v) {
          // Pakistan formats: 11-digit numeric starting with 0
          return /^0\d{10}$/.test(v);
        },
        message: props => `${props.value} is not a valid 11-digit Pakistan number!`
      }
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: { values: BLOOD_GROUPS, message: 'Invalid blood group' },
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
      validate: {
        validator: function (dob) {
          const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          return age >= 18;
        },
        message: 'Donor must be at least 18 years old',
      },
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [50, 'Weight must be at least 50kg to donate safely'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    available: {
      type: Boolean,
      default: true,
    },
    paymentType: {
      type: String,
      enum: ['paid', 'unpaid'],
      default: 'unpaid',
    },
    lastDonationDate: {
      type: Date,
      default: null,
    },
    donationCount: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: null,
    },
    socialLinks: {
      instagram: { type: String, default: null },
      whatsapp: { type: String, default: null },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0], // [longitude, latitude]
      },
    },
  },
  { timestamps: true }
);

// Production Indexes
donorSchema.index({ bloodGroup: 1, city: 1, available: 1 });
donorSchema.index({ paymentType: 1 });
donorSchema.index({ location: '2dsphere' });

// Virtual: compute badge level
donorSchema.virtual('badge').get(function () {
  if (this.donationCount >= 10) return 'Gold';
  if (this.donationCount >= 4) return 'Silver';
  return 'Bronze';
});

// Virtual: check if resting (donated within last 90 days / 3 months)
donorSchema.virtual('isResting').get(function () {
  if (!this.lastDonationDate) return false;
  const daysSince = (Date.now() - new Date(this.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < 90;
});

// Pre-save hook to enforce cooldown and Pakistan rules
donorSchema.pre('save', function(next) {
  // If donor is resting, they MUST be unavailable
  if (this.isResting) {
    this.available = false;
  }
  next();
});

donorSchema.set('toJSON', { virtuals: true });
donorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Donor', donorSchema);
