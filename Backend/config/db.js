'use strict';
/**
 * config/db.js — MongoDB connection with retry logic and event listeners.
 */

const mongoose = require('mongoose');
const logger   = require('../utils/logger');

const connectDB = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS:     10000,
        maxPoolSize:              10,
        minPoolSize:              2,
      });
      logger.info('MongoDB connected');
      return;
    } catch (err) {
      logger.error(`MongoDB connect attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delay * attempt));
    }
  }
};

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected',  () => logger.info('MongoDB reconnected'));
mongoose.connection.on('error',        (err) => logger.error({ msg: 'MongoDB error', err: err.message }));

module.exports = connectDB;
