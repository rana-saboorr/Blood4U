const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  toggleRsvp,
} = require('../controllers/eventController');
const { protect, optionalProtect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// POST /api/events — Authenticated users can request event creation; admin approval is required later.
router.post('/', protect, createEvent);

// GET /api/events — public: only approved/upcoming events
router.get('/', optionalProtect, getEvents);

// GET /api/events/:id — public: only approved/upcoming events (non-admin)
router.get('/:id', optionalProtect, getEventById);

// PATCH /api/events/:id — Admin or creator
router.patch('/:id', protect, updateEvent);

// DELETE /api/events/:id — Admin only
router.delete('/:id', protect, authorize('admin'), deleteEvent);

// POST /api/events/:id/rsvp — Any authenticated user
router.post('/:id/rsvp', protect, toggleRsvp);

module.exports = router;
