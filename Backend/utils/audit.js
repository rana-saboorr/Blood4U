'use strict';
/**
 * audit.js — Append-only audit log writer.
 * Failures here must NEVER crash the main request.
 */

const AuditLog    = require('../models/AuditLog');
const auditLogger = require('./logger');

/**
 * Write an audit log entry.
 *
 * @param {object} params
 * @param {import('mongoose').Types.ObjectId|string} params.actor       - User who performed the action
 * @param {string}  params.action      - One of the AuditLog.action enum values
 * @param {string}  [params.targetModel]
 * @param {*}       [params.targetId]
 * @param {object}  [params.metadata]  - Any extra context (reason, newRole, etc.)
 * @param {object}  [params.req]       - Express request (for ip + userAgent)
 */
async function logAudit({ actor, action, targetModel, targetId, metadata, req }) {
  try {
    await AuditLog.create({
      actor,
      action,
      targetModel,
      targetId,
      metadata,
      ip:        req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
    auditLogger.info({
      stream: 'audit',
      actor:  String(actor),
      action,
      targetId: targetId ? String(targetId) : undefined,
      ip: req?.ip,
    });
  } catch (err) {
    // Audit log failure must never crash the main request
    auditLogger.error({ msg: 'Audit log write failed', err: err.message });
  }
}

module.exports = { logAudit };
