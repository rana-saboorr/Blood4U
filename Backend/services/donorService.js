const Donor = require('../models/Donor');
const User = require('../models/User');
const Donation = require('../models/Donation');
const { getCompatibleGroups } = require('../utils/bloodCompatibility');
const donorRepository = require('../repositories/donorRepository');

const DONATION_COOLDOWN_DAYS = 90;

class DonorService {
  async registerDonor(userId, data) {
    const existing = await donorRepository.findByUserId(userId);
    if (existing) throw new Error('You are already registered as a donor.');

    // Capture location as GeoJSON
    const donorData = { ...data, userId };
    if (data.lat && data.lng) {
      donorData.location = {
        type: 'Point',
        coordinates: [parseFloat(data.lng), parseFloat(data.lat)],
      };
      delete donorData.lat;
      delete donorData.lng;
    }

    const donor = await donorRepository.create(donorData);
    await User.findByIdAndUpdate(userId, { role: 'donor' });
    return donor;
  }

  async getAllDonors(filters) {
    await donorRepository.reactivateExpiredCooldowns();
    return donorRepository.findWithFilters(filters);
  }

  async searchDonors({ bloodGroup, city, limit = 10 }) {
    if (!bloodGroup) throw new Error('bloodGroup is required for smart matching.');

    await donorRepository.reactivateExpiredCooldowns();
    const compatibleGroups = getCompatibleGroups(bloodGroup);
    const donors = await donorRepository.findCompatible({ compatibleGroups, city, limit });

    const scored = donors.map((d) => {
      let score = 0;
      if (d.bloodGroup === bloodGroup) score += 50;
      if (city && d.city.toLowerCase() === city.toLowerCase()) score += 30;
      if (d.donationCount > 0) score += Math.min(d.donationCount * 2, 20);
      return { ...d.toObject(), matchScore: score };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return { donors: scored, compatibleGroups };
  }

  async getMyDonorProfile(userId) {
    await donorRepository.reactivateExpiredCooldowns();
    const donor = await Donor.findOne({ userId }).populate('userId', 'username email');
    if (!donor) throw new Error('Donor profile not found.');
    return donor;
  }

  async updateMyDonorProfile(userId, body) {
    const currentDonor = await donorRepository.findByUserId(userId);
    if (!currentDonor) throw new Error('Donor profile not found.');

    const allowedFields = ['fullName', 'mobile', 'city', 'available', 'paymentType', 'socialLinks', 'image'];
    const isResting = currentDonor.isResting;
    const requestedAvailability =
      body.available !== undefined ? (body.available === true || body.available === 'true') : undefined;

    if (isResting && requestedAvailability === true) {
      const err = new Error('You cannot change availability during the donation cooldown period.');
      err.status = 403;
      throw err;
    }

    const update = {};
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) update[field] = body[field];
    });
    if (update.available !== undefined) {
      update.available = update.available === true || update.available === 'true';
    }

    const donor = await donorRepository.findOneAndUpdate(userId, update);
    if (!donor) throw new Error('Donor profile not found.');
    return donor;
  }

  async logDonation(donorId) {
    const donor = await donorRepository.findById(donorId);
    if (!donor) throw new Error('Donor not found.');

    donor.donationCount += 1;
    donor.lastDonationDate = new Date();
    donor.available = false;
    await donorRepository.update(donor);
    return donor;
  }

  async logManualDonation(userId, { location, quantity }) {
    if (!location || !quantity) throw new Error('Location and quantity are required.');

    const donor = await donorRepository.findByUserId(userId);
    if (!donor) throw new Error('Donor profile not found.');

    const daysSince = donor.lastDonationDate
      ? (Date.now() - new Date(donor.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    if (daysSince < DONATION_COOLDOWN_DAYS) {
      const daysLeft = Math.ceil(DONATION_COOLDOWN_DAYS - daysSince);
      const err = new Error(`You are still in the cooldown period. ${daysLeft} day(s) remaining.`);
      err.status = 403;
      throw err;
    }

    donor.donationCount += 1;
    donor.lastDonationDate = new Date();
    donor.available = false;
    await donorRepository.update(donor);

    await Donation.create({ donorId: donor._id, userId, location, quantity, date: new Date() });
    return donor;
  }
}

module.exports = new DonorService();
