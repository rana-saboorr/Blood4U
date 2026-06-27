const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Middleware to handle express-validator errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  logger.warn(`Validation failed for ${req.method} ${req.originalUrl}: ${JSON.stringify(extractedErrors)}`);

  return res.status(422).json({
    success: false,
    message: 'Validation Error',
    errors: extractedErrors,
  });
};

module.exports = {
  validate,
};
