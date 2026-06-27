'use strict';
/**
 * socketEmit.js — Safe Socket.io emit helpers.
 * Always use these instead of calling io.emit() directly.
 * Enforces room-based isolation so users only receive their own events.
 */

const logger = require('./logger');

/**
 * Emit an event to a specific user's private room.
 * @param {import('socket.io').Server} io
 * @param {string} userId
 * @param {string} event
 * @param {*} data
 */
function emitToUser(io, userId, event, data) {
  try {
    io.to(`user:${userId}`).emit(event, data);
  } catch (err) {
    logger.error({ msg: 'emitToUser failed', userId, event, err: err.message });
  }
}

/**
 * Emit an event to all sockets in a given role room.
 * @param {import('socket.io').Server} io
 * @param {string} role
 * @param {string} event
 * @param {*} data
 */
function emitToRole(io, role, event, data) {
  try {
    io.to(`role:${role}`).emit(event, data);
  } catch (err) {
    logger.error({ msg: 'emitToRole failed', role, event, err: err.message });
  }
}

/**
 * Emit an event to all admin sockets.
 */
function emitToAdmins(io, event, data) {
  emitToRole(io, 'admin', event, data);
}

/**
 * Broadcast an emergency event to all connected sockets in a list of user rooms.
 * @param {import('socket.io').Server} io
 * @param {string[]} userIds
 * @param {string} event
 * @param {*} data
 */
function emitToUsers(io, userIds, event, data) {
  userIds.forEach((id) => emitToUser(io, id, event, data));
}

module.exports = { emitToUser, emitToUsers, emitToRole, emitToAdmins };
