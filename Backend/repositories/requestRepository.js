const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');

class RequestRepository {
  async findOne(filter) {
    return BloodRequest.findOne(filter);
  }

  async findById(id) {
    return BloodRequest.findById(id);
  }

  async create(data) {
    return BloodRequest.create(data);
  }

  async findWithFilters({ filter, skip, limit }) {
    const [requests, total] = await Promise.all([
      BloodRequest.find(filter)
        .populate('userId', 'username email')
        .populate('matchedDonors', 'fullName bloodGroup city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BloodRequest.countDocuments(filter),
    ]);
    return { requests, total };
  }

  async update(request) {
    return request.save();
  }

  async findByIdAndUpdate(id, update) {
    return BloodRequest.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  async getAdminIds() {
    const admins = await User.find({ role: 'admin' }).select('_id');
    return admins.map(a => a._id);
  }
}

module.exports = new RequestRepository();
