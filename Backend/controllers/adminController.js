'use strict';
/**
 * adminController.js — Admin-only actions.
 * All actions here emit audit logs. No action is destructive without a reason.
 */

const User        = require('../models/User');
const BloodBank   = require('../models/BloodBank');
const BloodRequest = require('../models/BloodRequest');
const Donor       = require('../models/Donor');
const Event       = require('../models/Event');
const AuditLog    = require('../models/AuditLog');
const SystemConfig = require('../models/SystemConfig');
const { logAudit }       = require('../utils/audit');
const { sanitizeUser }   = require('../utils/sanitize');
const { invalidateConfig } = require('../config/systemConfig');
const { sendSimpleEmail }  = require('../utils/mailer');
const { emitToUser, emitToAdmins } = require('../utils/socketEmit');
const logger = require('../utils/logger');

// ── Users ─────────────────────────────────────────────────────────────────────

const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const filter = {};
    if (role)   filter.role = role;
    if (status) filter.isActive = status === 'active';
    if (search) filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data:  items.map((u) => sanitizeUser(u, 'admin', u._id)),
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) { next(err); }
};

const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false, $inc: { tokenVersion: 1 }, refreshTokenHash: null },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await logAudit({ actor: req.user._id, action: 'user_deactivated', targetModel: 'User', targetId: user._id, req });

    // Notify via socket + email
    const io = req.app.get('io');
    if (io) emitToUser(io, String(user._id), 'auth:deactivated', { message: 'Your account has been deactivated.' });
    sendSimpleEmail({ to: user.email, subject: 'Blood4U — Account Deactivated', text: 'Your account has been deactivated by an administrator. Contact support for assistance.' }).catch(() => {});

    res.status(200).json({ success: true, message: 'User deactivated.' });
  } catch (err) { next(err); }
};

const reactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await logAudit({ actor: req.user._id, action: 'user_reactivated', targetModel: 'User', targetId: user._id, req });
    sendSimpleEmail({ to: user.email, subject: 'Blood4U — Account Reactivated', text: 'Your account has been reactivated. You can now log in.' }).catch(() => {});
    res.status(200).json({ success: true, message: 'User reactivated.' });
  } catch (err) { next(err); }
};

const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await logAudit({ actor: req.user._id, action: 'user_role_changed', targetModel: 'User', targetId: user._id, metadata: { newRole: role }, req });
    res.status(200).json({ success: true, message: `Role updated to ${role}.` });
  } catch (err) { next(err); }
};

const forceLogoutUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { $inc: { tokenVersion: 1 }, refreshTokenHash: null });
    await logAudit({ actor: req.user._id, action: 'logout_all', targetModel: 'User', targetId: req.params.id, req });
    const io = req.app.get('io');
    if (io) emitToUser(io, req.params.id, 'auth:deactivated', { message: 'You have been logged out by an administrator.' });
    res.status(200).json({ success: true, message: 'All sessions terminated.' });
  } catch (err) { next(err); }
};

// ── Banks ─────────────────────────────────────────────────────────────────────

const listBanks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = status ? { status } : {};
    const skip   = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      BloodBank.find(filter).populate('owner', 'username email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      BloodBank.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, data: items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

const approveBank = async (req, res, next) => {
  try {
    const bank = await BloodBank.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true }).populate('owner');
    if (!bank) return res.status(404).json({ success: false, message: 'Bank not found.' });
    await logAudit({ actor: req.user._id, action: 'bank_approved', targetModel: 'BloodBank', targetId: bank._id, req });
    const io = req.app.get('io');
    if (io) emitToUser(io, String(bank.owner._id), 'bank:statusUpdated', { bankId: bank._id, status: 'approved' });
    sendSimpleEmail({ to: bank.owner.email, subject: 'Blood4U — Bank Approved', text: `Your blood bank "${bank.name}" has been approved.` }).catch(() => {});
    res.status(200).json({ success: true, message: 'Bank approved.' });
  } catch (err) { next(err); }
};

const rejectBank = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const bank = await BloodBank.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectReason: reason, rejectedAt: new Date() }, { new: true }).populate('owner');
    if (!bank) return res.status(404).json({ success: false, message: 'Bank not found.' });
    await logAudit({ actor: req.user._id, action: 'bank_rejected', targetModel: 'BloodBank', targetId: bank._id, metadata: { reason }, req });
    sendSimpleEmail({ to: bank.owner.email, subject: 'Blood4U — Bank Application Rejected', text: `Your bank application was rejected. Reason: ${reason}` }).catch(() => {});
    res.status(200).json({ success: true, message: 'Bank rejected.' });
  } catch (err) { next(err); }
};

const suspendBank = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const bank = await BloodBank.findByIdAndUpdate(req.params.id, { status: 'suspended', suspendReason: reason, suspendedAt: new Date() }, { new: true }).populate('owner');
    if (!bank) return res.status(404).json({ success: false, message: 'Bank not found.' });
    await logAudit({ actor: req.user._id, action: 'bank_suspended', targetModel: 'BloodBank', targetId: bank._id, metadata: { reason }, req });
    res.status(200).json({ success: true, message: 'Bank suspended.' });
  } catch (err) { next(err); }
};

// ── Blood Requests ────────────────────────────────────────────────────────────

const listRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, urgency, status, bloodGroup } = req.query;
    const filter = {};
    if (urgency)    filter.urgency    = urgency;
    if (status)     filter.status     = status;
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      BloodRequest.find(filter).populate('userId', 'username email').sort({ urgency: -1, createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      BloodRequest.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, data: items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

const forceFulfillRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findByIdAndUpdate(req.params.id, { status: 'fulfilled' }, { new: true });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    await logAudit({ actor: req.user._id, action: 'request_force_fulfilled', targetModel: 'BloodRequest', targetId: request._id, req });
    res.status(200).json({ success: true, message: 'Request marked as fulfilled.' });
  } catch (err) { next(err); }
};

// ── Donors ────────────────────────────────────────────────────────────────────

const listDonors = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, bloodGroup } = req.query;
    const filter = bloodGroup ? { bloodGroup } : {};
    const skip   = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Donor.find(filter).populate('userId', 'username email phone').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Donor.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, data: items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

const suspendDonor = async (req, res, next) => {
  try {
    const donor = await Donor.findByIdAndUpdate(req.params.id, { available: false }, { new: true });
    if (!donor) return res.status(404).json({ success: false, message: 'Donor not found.' });
    await logAudit({ actor: req.user._id, action: 'donor_suspended', targetModel: 'Donor', targetId: donor._id, req });
    res.status(200).json({ success: true, message: 'Donor suspended.' });
  } catch (err) { next(err); }
};

// ── Audit Log ─────────────────────────────────────────────────────────────────

const getAuditLog = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, actor, from, to } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (actor)  filter.actor  = actor;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      AuditLog.find(filter).populate('actor', 'username email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      AuditLog.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, data: items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

// ── System Config ─────────────────────────────────────────────────────────────

const getSystemConfig = async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne().lean();
    if (!config) config = await SystemConfig.create({});
    res.status(200).json({ success: true, data: config });
  } catch (err) { next(err); }
};

const updateSystemConfig = async (req, res, next) => {
  try {
    const allowed = [
      'emergencyBroadcastRadiusKm', 'donorCooldownDays', 'maxOtpAttempts',
      'otpTtlMinutes', 'loginLockThreshold', 'loginLockDurationMins',
      'maintenanceMode', 'maintenanceMessage', 'contactEmail',
    ];
    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    update.updatedBy = req.user._id;
    update.updatedAt = new Date();

    const config = await SystemConfig.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true });
    invalidateConfig();
    await logAudit({ actor: req.user._id, action: 'config_updated', metadata: update, req });
    res.status(200).json({ success: true, data: config });
  } catch (err) { next(err); }
};

// ── Analytics ─────────────────────────────────────────────────────────────────

const analyticsSummary = async (req, res, next) => {
  try {
    const [users, donors, banks, requests] = await Promise.all([
      User.countDocuments(),
      Donor.countDocuments(),
      BloodBank.countDocuments({ status: 'approved' }),
      BloodRequest.countDocuments(),
    ]);
    res.status(200).json({ success: true, data: { users, donors, banks, requests } });
  } catch (err) { next(err); }
};

const requestsOverTime = async (req, res, next) => {
  try {
    const days  = Number(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const data  = await BloodRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: {
          date:    { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          urgency: '$urgency',
        },
        count: { $sum: 1 },
      }},
      { $sort: { '_id.date': 1 } },
    ]);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const donorsByCity = async (req, res, next) => {
  try {
    const data = await Donor.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const bloodGroupDistribution = async (req, res, next) => {
  try {
    const data = await Donor.aggregate([
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const registrationsOverTime = async (req, res, next) => {
  try {
    const days  = Number(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const data  = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = {
  listUsers, deactivateUser, reactivateUser, changeUserRole, forceLogoutUser,
  listBanks, approveBank, rejectBank, suspendBank,
  listRequests, forceFulfillRequest,
  listDonors, suspendDonor,
  getAuditLog,
  getSystemConfig, updateSystemConfig,
  analyticsSummary, requestsOverTime, donorsByCity, bloodGroupDistribution, registrationsOverTime,
};
