'use strict';
/**
 * eventController.js — HTTP layer for Events
 */

const eventService = require('../services/eventService');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/events
const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.user, req.body);
  req.app.get('io')?.emit('data:sync:command', { type: 'event', id: event._id });

  res.status(201).json({ 
    success: true, 
    message: req.user.role === 'admin' ? 'Event created and published.' : 'Event submitted for admin review.', 
    event 
  });
});

// GET /api/events
const getEvents = asyncHandler(async (req, res) => {
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
});

// GET /api/events/:id
const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id, req.user);
  res.status(200).json({ success: true, event });
});

// PATCH /api/events/:id
const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.user, req.body);
  req.app.get('io')?.emit('data:sync:command', { type: 'event', id: event._id });
  res.status(200).json({ success: true, message: 'Event updated.', event });
});

// DELETE /api/events/:id
const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.params.id, req.user);
  req.app.get('io')?.emit('data:sync:command', { type: 'event' });
  res.status(200).json({ success: true, message: 'Event deleted.' });
});

// POST /api/events/:id/rsvp
const toggleRsvp = asyncHandler(async (req, res) => {
  const { isRsvpd, event } = await eventService.toggleRsvp(req.params.id, req.user);
  req.app.get('io')?.emit('data:sync:command', { type: 'event', id: event._id });
  res.status(200).json({
    success: true,
    message: isRsvpd ? 'RSVP confirmed!' : 'RSVP cancelled.',
    attending: isRsvpd,
    attendanceCount: event.rsvpList.length,
    event,
  });
});

module.exports = { createEvent, getEvents, getEventById, updateEvent, deleteEvent, toggleRsvp };
