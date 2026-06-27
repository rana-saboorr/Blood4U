'use strict';
const BloodBank = require('../models/BloodBank');
const User      = require('../models/User');
const { logAudit } = require('../utils/audit');
const { emitToUser, emitToRole } = require('../utils/socketEmit');

class BloodBankService {
  async registerBank(userId, body) {
    const existingBank = await BloodBank.findOne({ owner: userId });
    if (existingBank) {
      throw Object.assign(new Error('You have already registered a blood bank. You can only manage one.'), { statusCode: 409 });
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

  async getBanks(query) {
    const { city } = query;
    const filter = { status: 'approved' };
    if (city) filter.city = { $regex: city, $options: 'i' };
    
    // For public endpoint, only return approved banks and select public fields
    return BloodBank.find(filter).select('-bloodStock -registeredBy').lean();
  }

  async getBankById(id) {
    const bank = await BloodBank.findOne({ _id: id, status: 'approved' })
      .populate('owner', 'username email phone')
      .lean();
    if (!bank) {
      throw Object.assign(new Error('Blood bank not found or not approved.'), { statusCode: 404 });
    }
    return bank;
  }

  async updateBank(id, userId, body) {
    const bank = await BloodBank.findById(id);
    if (!bank) throw Object.assign(new Error('Blood bank not found.'), { statusCode: 404 });

    if (String(bank.owner) !== String(userId)) {
      throw Object.assign(new Error('Access denied. You do not own this resource.'), { statusCode: 403 });
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
    if (!bank) throw Object.assign(new Error('Blood bank not found or not approved.'), { statusCode: 404 });
    return bank.inventory;
  }

  async updateInventory(id, userId, updates) {
    // updates is an array of { bloodGroup, delta }
    const bank = await BloodBank.findById(id);
    if (!bank) throw Object.assign(new Error('Blood bank not found.'), { statusCode: 404 });

    // Admins bypass requireOwnership at router level, so this only checks if a bankOwner is trying to edit another's bank
    const user = await User.findById(userId).select('role').lean();
    if (user.role !== 'admin' && String(bank.owner) !== String(userId)) {
      throw Object.assign(new Error('Access denied. You do not own this resource.'), { statusCode: 403 });
    }

    if (bank.status !== 'approved') {
      throw Object.assign(new Error('Blood bank must be approved before managing inventory.'), { statusCode: 403 });
    }

    for (const { bloodGroup, delta } of updates) {
      const current = bank.inventory[bloodGroup] || 0;
      const result = current + delta;
      if (result < 0) {
        throw Object.assign(new Error(`Cannot decrease ${bloodGroup} below 0. Current: ${current}, Delta: ${delta}`), { statusCode: 400 });
      }
      bank.inventory[bloodGroup] = result;
      // keep bloodStock in sync for backward compat
      bank.bloodStock[bloodGroup] = result;
    }

    await bank.save();
    await logAudit({ actor: userId, action: 'inventory_updated', targetModel: 'BloodBank', targetId: bank._id, metadata: { updates } });

    return bank.inventory;
  }
}

module.exports = new BloodBankService();
