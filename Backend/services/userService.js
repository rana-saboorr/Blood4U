'use strict';
const userRepository = require('../repositories/userRepository');
const BloodBank = require('../models/BloodBank');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const { logAudit } = require('../utils/audit');
const AppError = require('../utils/appError');

class UserService {
  async getAllUsers(query) {
    const { role, isVerified } = query;
    const filter = {};
    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    return userRepository.findAll(filter);
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found.', 404);
    return user;
  }

  async updateUser(id, body) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found.', 404);

    const { username, city, phone } = body;
    if (username) user.username = username;
    if (city) user.city = city;
    if (phone) user.phone = phone;

    await user.save();
    return user;
  }

  async deleteUser(id, adminId) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found.', 404);

    // Clean up related data
    await Promise.all([
      BloodBank.deleteMany({ owner: id }),
      BloodRequest.deleteMany({ userId: id }),
      Donor.deleteMany({ userId: id }),
      userRepository.findByIdAndDelete(id)
    ]);

    await logAudit({ actor: adminId, action: 'account_deleted', targetModel: 'User', targetId: id });
    return true;
  }

  async getStats() {
    const [totalUsers, activeDonors, activeBanks] = await Promise.all([
      userRepository.findAll().then(u => u.length),
      Donor.countDocuments({ available: true }),
      BloodBank.countDocuments({ status: 'approved' })
    ]);
    return { totalUsers, activeDonors, activeBanks };
  }
}

module.exports = new UserService();
