'use strict';
/**
 * ioredis client — shared singleton across the application.
 * Wraps reconnect logic and graceful degradation so that
 * the app keeps running when Redis is temporarily unavailable.
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

let client;

function getRedisClient() {
  if (client) return client;

  // In test environments use ioredis-mock to avoid needing a real Redis
  if (process.env.NODE_ENV === 'test') {
    const RedisMock = require('ioredis-mock');
    client = new RedisMock();
    return client;
  }

  client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    // Exponential back-off up to 3 seconds
    retryStrategy: (times) => Math.min(times * 100, 3000),
    // Reconnect on replica failover
    reconnectOnError: (err) => err.message.includes('READONLY'),
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    // Fail fast when Redis is down — do NOT queue commands
    enableOfflineQueue: false,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('ready',   () => logger.info('Redis ready'));
  client.on('error',   (err) => logger.error({ msg: 'Redis error', err: err.message }));
  client.on('close',   () => logger.warn('Redis connection closed'));
  client.on('reconnecting', () => logger.warn('Redis reconnecting...'));

  return client;
}

module.exports = getRedisClient();
