const eventRepository = require('../repositories/eventRepository');
const { sendSimpleEmail } = require('../utils/mailer');

class EventService {
  async createEvent(user, body) {
    const isAdmin = user.role === 'admin';
    const isBankOwner = user.role === 'bankOwner';

    if (!isAdmin && !isBankOwner) {
      const err = new Error('Only admins and blood bank owners can create events.');
      err.status = 403;
      throw err;
    }

    const status = isAdmin ? 'approved' : 'pending';
    return eventRepository.create({
      ...body,
      createdBy: user._id,
      status
    });
  }

  async getEvents({ user, query }) {
    const { city, status, page = 1, limit = 20 } = query;
    const filter = {};

    const isAdmin = user && user.role === 'admin';
    if (!isAdmin) {
      const publicFilters = { status: 'approved', dateTime: { $gte: new Date() } };
      if (user) {
        filter.$or = [publicFilters, { createdBy: user._id }];
      } else {
        Object.assign(filter, publicFilters);
      }
    } else if (status) {
      filter.status = status;
    }

    if (city) filter.city = { $regex: city, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    return eventRepository.findWithFilters({ filter, skip, limit: parseInt(limit) });
  }

  async getEventById(id, user) {
    const event = await eventRepository.findById(id);
    if (!event) {
      const err = new Error('Event not found.');
      err.status = 404;
      throw err;
    }

    const isAdmin = user?.role === 'admin';
    if (!isAdmin) {
      const isApproved = event.status === 'approved';
      const isUpcoming = event.dateTime && event.dateTime >= new Date();
      const isOwner = event.createdBy && event.createdBy._id.toString() === user?._id.toString();
      
      if (!isApproved && !isOwner) {
         const err = new Error('Event not found.');
         err.status = 404;
         throw err;
      }
    }

    return event;
  }

  async updateEvent(id, user, body) {
    const event = await eventRepository.findById(id);
    if (!event) {
      const err = new Error('Event not found.');
      err.status = 404;
      throw err;
    }

    const isAdmin = user.role === 'admin';
    const isOwner = event.createdBy && event.createdBy._id.toString() === user._id.toString();

    if (!isAdmin && !isOwner) {
      const err = new Error('Not authorized to update this event.');
      err.status = 403;
      throw err;
    }

    const previousStatus = event.status;
    const allowedUpdates = [
      'eventName', 'city', 'venue', 'dateTime', 'description', 
      'contactEmail', 'mobileNumber', 'capacity', 'status'
    ];

    if (!isAdmin && isOwner) {
      event.status = 'pending';
    }

    allowedUpdates.forEach((f) => {
      if (body[f] !== undefined) {
        if (f === 'status' && !isAdmin) return;
        event[f] = body[f];
      }
    });

    await event.save();

    if (previousStatus !== event.status && (event.status === 'approved' || event.status === 'rejected')) {
      const to = event.createdBy?.email || event.contactEmail;
      if (to) {
        const subject = event.status === 'approved' ? 'Blood4U - Event Approved' : 'Blood4U - Event Rejected';
        const text = event.status === 'approved' 
          ? `Your blood donation event has been approved.\n\nEvent: ${event.eventName}\nVenue: ${event.venue}`
          : `Your blood donation event has been rejected.\n\nEvent: ${event.eventName}\nReason: ${body.reason || 'Not provided'}`;
        
        sendSimpleEmail({ to, subject, text }).catch(e => console.error('Email notify failed:', e.message));
      }
    }

    return event;
  }

  async deleteEvent(id, user) {
    const event = await eventRepository.findById(id);
    if (!event) {
      const err = new Error('Event not found.');
      err.status = 404;
      throw err;
    }

    const isAdmin = user.role === 'admin';
    const isOwner = event.createdBy && event.createdBy._id.toString() === user._id.toString();

    if (!isAdmin && !isOwner) {
      const err = new Error('Not authorized to delete this event.');
      err.status = 403;
      throw err;
    }

    return event.deleteOne();
  }

  async toggleRsvp(id, user) {
    const event = await eventRepository.findById(id);
    if (!event) {
      const err = new Error('Event not found.');
      err.status = 404;
      throw err;
    }

    if (event.status !== 'approved') {
      throw new Error('This event is not open for registration.');
    }

    const userId = user._id;
    const isRsvpd = event.rsvpList.some((id) => id.toString() === userId.toString());

    if (isRsvpd) {
      event.rsvpList = event.rsvpList.filter((id) => id.toString() !== userId.toString());
    } else {
      if (event.rsvpList.length >= event.capacity) {
        throw new Error('Event is at full capacity.');
      }
      event.rsvpList.push(userId);
    }

    await event.save();
    return { isRsvpd: !isRsvpd, event };
  }
}

module.exports = new EventService();
