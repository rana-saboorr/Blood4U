'use strict';
/**
 * utils/logger.js — Structured Winston logger.
 * In production: JSON output for log aggregators (Datadog, CloudWatch, etc.)
 * In development: pretty-printed colorized output.
 */

const winston = require('winston');
const path    = require('path');

const isProd = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProd
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const metaStr = Object.keys(meta).length
              ? '\n  ' + JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')
              : '';
            return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
          })
        )
  ),
  defaultMeta: { service: 'blood4u-api' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level:    'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
    }),
  ],
});

// Add http level (used by morgan stream)
winston.addColors({ http: 'magenta' });

module.exports = logger;
