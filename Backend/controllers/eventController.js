const eventService = require('../services/eventService');

// POST /api/events
const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.user, req.body);
    req.app.get('io').emit('data:sync:command', { type: 'event', id: event._id });

    res.status(201).json({ 
      success: true, 
      message: req.user.role === 'admin' ? 'Event created and published.' : 'Event submitted for admin review.', 
      event 
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/events
const getEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { events, total } = await eventService.getEvents({ user: req.user, query: req.query });

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      events,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:id
const getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id, req.user);
    res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/events/:id
const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.user, req.body);
    req.app.get('io').emit('data:sync:command', { type: 'event', id: event._id });
    res.status(200).json({ success: true, message: 'Event updated.', event });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/events/:id
const deleteEvent = async (req, res, next) => {
  try {
    await eventService.deleteEvent(req.params.id, req.user);
    req.app.get('io').emit('data:sync:command', { type: 'event' });
    res.status(200).json({ success: true, message: 'Event deleted.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/events/:id/rsvp
const toggleRsvp = async (req, res, next) => {
  try {
    const { isRsvpd, event } = await eventService.toggleRsvp(req.params.id, req.user);
    req.app.get('io').emit('data:sync:command', { type: 'event', id: event._id });
    res.status(200).json({
      success: true,
      message: isRsvpd ? 'RSVP confirmed!' : 'RSVP cancelled.',
      attending: isRsvpd,
      attendanceCount: event.rsvpList.length,
      event,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createEvent, getEvents, getEventById, updateEvent, deleteEvent, toggleRsvp };

