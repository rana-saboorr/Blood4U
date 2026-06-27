const BloodBank = require('../models/BloodBank');

class BloodBankRepository {
  async findByOwnerId(ownerId) {
    return BloodBank.findOne({ registeredBy: ownerId });
  }

  async create(data) {
    return BloodBank.create(data);
  }

  async findWithFilters(filter) {
    return BloodBank.find(filter)
      .populate('registeredBy', 'username')
      .sort({ createdAt: -1 });
  }

  async findById(id) {
    return BloodBank.findById(id).populate('registeredBy', 'username email');
  }

  async findByIdAndDelete(id) {
    return BloodBank.findByIdAndDelete(id);
  }
}

module.exports = new BloodBankRepository();
