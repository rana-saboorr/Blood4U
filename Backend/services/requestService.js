const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const requestRepository = require('../repositories/requestRepository');
const donorRepository = require('../repositories/donorRepository');
const { getCompatibleGroups } = require('../utils/bloodCompatibility');
const AppError = require('../utils/appError');

class RequestService {
  async createRequest(user, body, io) {
    // Prevent duplicate active requests (non-admin only)
    if (user.role !== 'admin') {
      const activeRequest = await requestRepository.findOne({
        userId: user._id,
        status: { $in: ['pending', 'approved'] },
      });
      if (activeRequest) {
        throw new AppError('You already have an active blood request. Please complete or delete it first.', 400);
      }
    }

    const status = (user.role === 'admin' || body.urgent) ? 'approved' : 'pending';
    const request = await requestRepository.create({ ...body, userId: user._id, status });

    // Auto match donors
    const compatibleGroups = getCompatibleGroups(request.bloodGroup);
    await donorRepository.reactivateExpiredCooldowns();
    const matched = await donorRepository.findCompatibleForRequest({
      compatibleGroups,
      city: request.city,
    });

    request.matchedDonors = matched.map((d) => d._id);
    await requestRepository.update(request);

    io.emit('data:sync:command', { type: 'request' });

    return { request, matchedDonors: matched };
  }

  async getRequests({ user, query }) {
    const { status, city, bloodGroup, page = 1, limit = 20 } = query;
    const filter = {};
    const adminIds = await requestRepository.getAdminIds();
    const baseStatuses = ['pending', 'approved'];
    const ownerStatuses = ['pending', 'approved', 'rejected', 'fulfilled'];

    if (user.role === 'admin') {
      if (status) filter.status = status;
    } else {
      filter.userId = { $nin: adminIds };

      if (user.role === 'user') {
        filter.userId = user._id;
        filter.status = { $in: status ? [status] : ownerStatuses };
      } else if (user.role === 'donor') {
        const donor = await donorRepository.findByUserId(user._id);
        if (donor) {
          filter.$or = [
            { matchedDonors: donor._id, status: { $in: baseStatuses }, userId: { $nin: adminIds } },
            { userId: user._id },
          ];
          if (status) filter.status = status;
        } else {
          filter.userId = user._id;
        }
      } else if (user.role === 'bankOwner') {
        filter.status = 'approved';
      } else {
        filter.userId = user._id;
      }
    }

    if (city) filter.city = { $regex: city, $options: 'i' };
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    return requestRepository.findWithFilters({ filter, skip, limit });
  }

  async getRequestById(id, user) {
    const request = await BloodRequest.findById(id)
      .populate('userId', 'username email')
      .populate('matchedDonors', 'fullName bloodGroup city mobile available');

    if (!request) throw new AppError('Blood request not found.', 404);

    const requestUserId = request.userId._id ? request.userId._id.toString() : request.userId.toString();
    const isOwner = user && requestUserId === user._id.toString();
    if (!isOwner && (!user || user.role !== 'admin')) {
      throw new AppError('Not authorized.', 403);
    }
    return request;
  }

  async updateRequest(id, body, io) {
    const { status, urgent } = body;
    const update = {};

    if (status) {
      const validStatuses = ['pending', 'approved', 'rejected', 'fulfilled'];
      if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status value.', 400);
      }
      update.status = status;
      update.rejectedAt = status === 'rejected' ? new Date() : null;
    }

    if (urgent !== undefined) update.urgent = urgent;

    const request = await requestRepository.findByIdAndUpdate(id, { $set: update });
    if (!request) throw new AppError('Request not found.', 404);

    io.emit('data:sync:command', { type: 'request', id });
    return request;
  }

  async donorDonateToRequest(requestId, user, body, io) {
    const confirmed = body?.didDonate === true || body?.didDonate === 'true';

    const request = await BloodRequest.findById(requestId)
      .populate('userId', 'username')
      .populate('matchedDonors', '_id');

    if (!request) throw new AppError('Request not found.', 404);
    if (!['pending', 'approved'].includes(request.status)) {
      throw new AppError('Request is not open for donation.', 400);
    }

    const donor = await donorRepository.findByUserId(user._id);
    if (!donor) {
      throw new AppError('Donor profile not found.', 403);
    }

    const isMatched = (request.matchedDonors || []).some((d) => d._id.toString() === donor._id.toString());
    if (!isMatched) {
      throw new AppError('This request does not match your blood group.', 403);
    }

    if (donor.isResting) {
      throw new AppError('You are in donation cooldown. Try again later.', 403);
    }

    if (!confirmed) {
      return { message: 'Donation not confirmed.', request };
    }

    donor.donationCount += 1;
    donor.lastDonationDate = new Date();
    donor.available = false;
    await donorRepository.update(donor);

    request.status = 'fulfilled';
    await requestRepository.update(request);

    io.emit('data:sync:command', { type: 'request', id: request._id });
    return { message: 'Donation logged.', request, donor };
  }

  async deleteRequest(id, user, io) {
    const request = await requestRepository.findById(id);
    if (!request) throw new AppError('Request not found.', 404);

    const requestUserId = request.userId._id ? request.userId._id.toString() : request.userId.toString();
    const isOwner = user && requestUserId === user._id.toString();
    if (!isOwner && (!user || user.role !== 'admin')) {
      throw new AppError('Not authorized.', 403);
    }

    await request.deleteOne();
    io.emit('data:sync:command', { type: 'request' });
  }
}

module.exports = new RequestService();
