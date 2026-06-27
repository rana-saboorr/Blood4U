'use strict';
/**
 * handleValidationErrors.js
 * Second middleware in every route chain that has validators.
 * Returns 422 with a structured errors array if any validator failed.
 */

const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      status: 'fail',
      errors: errors.array().map((e) => ({
        field:   e.path || e.param,
        message: e.msg,
      })),
    });
  }
  next();
};
