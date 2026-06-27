'use strict';
const BloodBank = require('../models/BloodBank');
const User      = require('../models/User');
const { logAudit } = require('../utils/audit');
const { emitToUser, emitToRole } = require('../utils/socketEmit');
const AppError = require('../utils/appError');

class BloodBankService {
  async registerBank(userId, body) {
    const existingBank = await BloodBank.findOne({ owner: userId });
    if (existingBank) {
      throw new AppError('You have already registered a blood bank. You can only manage one.', 409);
    }

    const { name, city, address, contact, license, location } = body;
    const bank = await BloodBank.create({
      name, city, address, contact, license, location,
      owner: userId,
      registeredBy: userId,
      status: 'pending',
    });

    await User.findByIdAndUpdate(userId, { role: 'bankOwner' });
    await logAudit({ actor: userId, action: 'bank_registered', targetModel: 'BloodBank', targetId: bank._id });
    
    return bank;
  }

  async getBanks(query, user) {
    const { city } = query;
    const cityFilter = city ? { city: { $regex: city, $options: 'i' } } : {};

    if (user?.role === 'admin') {
      return BloodBank.find(cityFilter)
        .populate('registeredBy', 'username email')
        .populate('owner', 'username email')
        .lean();
    }

    if (user?.role === 'bankOwner') {
      const [ownBank, approved] = await Promise.all([
        BloodBank.findOne({ owner: user._id }).populate('registeredBy', 'username email').lean(),
        BloodBank.find({ status: 'approved', ...cityFilter })
          .select('-bloodStock -inventory -registeredBy')
          .lean(),
      ]);

      const banks = approved.filter((b) => !ownBank || String(b._id) !== String(ownBank._id));
      if (ownBank) {
        ownBank.bloodStock = ownBank.inventory || ownBank.bloodStock || {};
        banks.unshift(ownBank);
      }
      return banks;
    }

    // Public: approved banks only, omit sensitive fields
    return BloodBank.find({ status: 'approved', ...cityFilter })
      .select('-bloodStock -inventory -registeredBy')
      .lean();
  }

  async getBankById(id) {
    const bank = await BloodBank.findOne({ _id: id, status: 'approved' })
      .populate('owner', 'username email phone')
      .lean();
    if (!bank) {
      throw new AppError('Blood bank not found or not approved.', 404);
    }
    return bank;
  }

  async updateBank(id, userId, body) {
    const bank = await BloodBank.findById(id);
    if (!bank) throw new AppError('Blood bank not found.', 404);

    if (String(bank.owner) !== String(userId)) {
      throw new AppError('Access denied. You do not own this resource.', 403);
    }

    // If profile is approved, modifying it reverts to pending for review
    const { name, city, address, contact, license, location } = body;
    let revertedToPending = false;
    
    if (name) bank.name = name;
    if (city) bank.city = city;
    if (address) bank.address = address;
    if (contact) bank.contact = contact;
    if (license) bank.license = license;
    if (location) bank.location = location;

    if (bank.status === 'approved' || bank.status === 'rejected') {
      bank.status = 'pending';
      revertedToPending = true;
    }

    await bank.save();
    await logAudit({ actor: userId, action: 'bank_updated', targetModel: 'BloodBank', targetId: bank._id });

    return { bank, revertedToPending };
  }

  async getInventory(id) {
    const bank = await BloodBank.findOne({ _id: id, status: 'approved' }).select('inventory').lean();
    if (!bank) throw new AppError('Blood bank not found or not approved.', 404);
    return bank.inventory;
  }

  async updateInventory(id, userId, updates) {
    // updates is an array of { bloodGroup, delta }
    const bank = await BloodBank.findById(id);
    if (!bank) throw new AppError('Blood bank not found.', 404);

    // Admins bypass requireOwnership at router level, so this only checks if a bankOwner is trying to edit another's bank
    const user = await User.findById(userId).select('role').lean();
    if (user.role !== 'admin' && String(bank.owner) !== String(userId)) {
      throw new AppError('Access denied. You do not own this resource.', 403);
    }

    if (bank.status !== 'approved') {
      throw new AppError('Blood bank must be approved before managing inventory.', 403);
    }

    for (const { bloodGroup, delta } of updates) {
      const current = bank.inventory[bloodGroup] || 0;
      const result = current + delta;
      if (result < 0) {
        throw new AppError(`Cannot decrease ${bloodGroup} below 0. Current: ${current}, Delta: ${delta}`, 400);
      }
      bank.inventory[bloodGroup] = result;
      // keep bloodStock in sync for backward compat
      bank.bloodStock[bloodGroup] = result;
    }

    await bank.save();
    await logAudit({ actor: userId, action: 'inventory_updated', targetModel: 'BloodBank', targetId: bank._id, metadata: { updates } });

    return bank.inventory;
  }

  async setBloodStock(id, userId, bloodStock) {
    const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bank = await BloodBank.findById(id);
    if (!bank) throw new AppError('Blood bank not found.', 404);

    const user = await User.findById(userId).select('role').lean();
    if (user.role !== 'admin' && String(bank.owner) !== String(userId)) {
      throw new AppError('Access denied. You do not own this resource.', 403);
    }

    if (bank.status !== 'approved') {
      throw new AppError('Blood bank must be approved before managing inventory.', 403);
    }

    for (const bloodGroup of BLOOD_GROUPS) {
      const value = Number(bloodStock?.[bloodGroup] ?? 0);
      if (!Number.isFinite(value) || value < 0) {
        throw new AppError(`Invalid stock value for ${bloodGroup}.`, 400);
      }
      bank.inventory[bloodGroup] = value;
      bank.bloodStock[bloodGroup] = value;
    }

    await bank.save();
    await logAudit({
      actor: userId,
      action: 'inventory_updated',
      targetModel: 'BloodBank',
      targetId: bank._id,
      metadata: { mode: 'absolute', bloodStock },
    });

    return bank;
  }
}

module.exports = new BloodBankService();
