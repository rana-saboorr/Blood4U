'use strict';
const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const bloodBankSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Blood bank name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    contact: {
      type: String,
      required: [true, 'Contact number is required'],
      validate: {
        validator: (v) => /^0\d{10}$/.test(v),
        message: (props) => `${props.value} is not a valid 11-digit Pakistan phone number!`,
      },
    },
    license: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    /** Primary owner — required for requireOwnership checks */
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /** Legacy field kept for backward compat — mirrors owner */
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    /** Blood units by group — replaces bloodStock */
    inventory: {
      'A+':  { type: Number, default: 0, min: 0 },
      'A-':  { type: Number, default: 0, min: 0 },
      'B+':  { type: Number, default: 0, min: 0 },
      'B-':  { type: Number, default: 0, min: 0 },
      'AB+': { type: Number, default: 0, min: 0 },
      'AB-': { type: Number, default: 0, min: 0 },
      'O+':  { type: Number, default: 0, min: 0 },
      'O-':  { type: Number, default: 0, min: 0 },
    },
    /** Kept for backward compat with existing routes that use bloodStock */
    bloodStock: {
      'A+':  { type: Number, default: 0 },
      'A-':  { type: Number, default: 0 },
      'B+':  { type: Number, default: 0 },
      'B-':  { type: Number, default: 0 },
      'AB+': { type: Number, default: 0 },
      'AB-': { type: Number, default: 0 },
      'O+':  { type: Number, default: 0 },
      'O-':  { type: Number, default: 0 },
    },
    suspendedAt:   { type: Date,   default: null },
    suspendReason: { type: String, default: null },
    rejectedAt:    { type: Date,   default: null },
    rejectReason:  { type: String, default: null },
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

// ── Indexes ─────────────────────────────────────────────────────────────────
bloodBankSchema.index({ status: 1 });
bloodBankSchema.index({ 'location.coordinates': '2dsphere' });
bloodBankSchema.index({ city: 1, status: 1 });
bloodBankSchema.index({ owner: 1 }, { unique: true });
// TTL: auto-delete rejected banks after 24 hours
bloodBankSchema.index({ rejectedAt: 1 }, { expireAfterSeconds: 86400, sparse: true });

module.exports = mongoose.model('BloodBank', bloodBankSchema);
