const OtpToken = require('../models/OtpToken');

class OtpRepository {
  async deleteByEmailAndPurpose(email, purpose) {
    return OtpToken.deleteMany({ email, purpose });
  }

  async create(otpData) {
    return OtpToken.create(otpData);
  }

  async findLatestByEmailAndPurpose(email, purpose) {
    return OtpToken.findOne({ email, purpose }).sort({ createdAt: -1 });
  }
}

module.exports = new OtpRepository();
