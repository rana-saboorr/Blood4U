const Donor = require('../models/Donor');

const DONATION_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

class DonorRepository {
  async findByUserId(userId) {
    return Donor.findOne({ userId });
  }

  async findById(id) {
    return Donor.findById(id);
  }

  async create(data) {
    return Donor.create(data);
  }

  async findWithFilters({ bloodGroup, city, available, paymentType, gender, page = 1, limit = 20 }) {
    const filter = {};
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (available !== undefined) filter.available = available === 'true' || available === true;
    if (paymentType) filter.paymentType = paymentType;
    if (gender) filter.gender = gender;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [donors, total] = await Promise.all([
      Donor.find(filter)
        .populate('userId', 'username email')
        .sort({ donationCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Donor.countDocuments(filter),
    ]);
    return { donors, total };
  }

  async findCompatible({ compatibleGroups, city, limit }) {
    const restingCutoff = new Date(Date.now() - DONATION_COOLDOWN_MS);
    const filter = {
      bloodGroup: { $in: compatibleGroups },
      available: true,
      $or: [
        { lastDonationDate: null },
        { lastDonationDate: { $lte: restingCutoff } },
      ],
    };
    if (city) filter.city = { $regex: city, $options: 'i' };
    return Donor.find(filter)
      .populate('userId', 'username')
      .sort({ donationCount: -1 })
      .limit(parseInt(limit));
  }

  async findCompatibleForRequest({ compatibleGroups, city }) {
    const restingCutoff = new Date(Date.now() - DONATION_COOLDOWN_MS);
    return Donor.find({
      bloodGroup: { $in: compatibleGroups },
      available: true,
      city: { $regex: city, $options: 'i' },
      $or: [{ lastDonationDate: null }, { lastDonationDate: { $lte: restingCutoff } }],
    }).select('_id fullName bloodGroup city');
  }

  async reactivateExpiredCooldowns() {
    const cutoff = new Date(Date.now() - DONATION_COOLDOWN_MS);
    return Donor.updateMany(
      { available: false, lastDonationDate: { $ne: null, $lte: cutoff } },
      { $set: { available: true } }
    );
  }

  async update(donor) {
    return donor.save();
  }

  async findOneAndUpdate(userId, update) {
    return Donor.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, runValidators: true }
    );
  }
}

module.exports = new DonorRepository();
