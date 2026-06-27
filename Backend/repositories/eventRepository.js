const Event = require('../models/Event');

class EventRepository {
  async create(data) {
    return Event.create(data);
  }

  async findWithFilters({ filter, skip, limit }) {
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('createdBy', 'username')
        .sort({ dateTime: 1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(filter),
    ]);
    return { events, total };
  }

  async findById(id) {
    return Event.findById(id).populate('createdBy', 'username email');
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    return Event.findByIdAndUpdate(id, update, options);
  }

  async deleteOne(id) {
    return Event.findByIdAndDelete(id);
  }

  async countDocuments(filter) {
    return Event.countDocuments(filter);
  }
}

module.exports = new EventRepository();
