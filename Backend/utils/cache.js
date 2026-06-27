'use strict';
/**
 * cache.js — Redis-backed cache with TTL and pattern-based invalidation.
 * All operations silently degrade when Redis is unavailable.
 */

const redis  = require('./redis');
const logger = require('./logger');

/** Default TTLs (seconds) for each resource type */
const TTLS = {
  donors:    120,  // 2 minutes
  banks:     120,
  events:    300,  // 5 minutes
  analytics: 600,  // 10 minutes
  config:    300,
};

/**
 * Try to return a cached value; on cache miss, call fetchFn and cache the result.
 * @param {string}   key
 * @param {number}   ttl      seconds
 * @param {Function} fetchFn  async () => data
 */
async function withCache(key, ttl, fetchFn) {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.warn({ msg: 'Cache read failed — proceeding to DB', key, err: err.message });
  }

  const data = await fetchFn();

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (err) {
    logger.warn({ msg: 'Cache write failed', key, err: err.message });
  }

  return data;
}

/**
 * Invalidate one or more Redis key patterns.
 * Uses KEYS scan — acceptable for low-volume admin actions.
 * @param {...string} patterns  e.g. 'cache:donors:*'
 */
async function invalidate(...patterns) {
  try {
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length) {
        await redis.del(...keys);
        logger.debug({ msg: 'Cache invalidated', pattern, count: keys.length });
      }
    }
  } catch (err) {
    logger.warn({ msg: 'Cache invalidation failed', err: err.message });
  }
}

/**
 * Simple set with TTL.
 */
async function set(key, value, ttl) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    logger.warn({ msg: 'Cache set failed', key, err: err.message });
  }
}

/**
 * Simple get.
 * @returns {*|null}
 */
async function get(key) {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    logger.warn({ msg: 'Cache get failed', key, err: err.message });
    return null;
  }
}

/**
 * Delete a specific key.
 */
async function del(key) {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn({ msg: 'Cache del failed', key, err: err.message });
  }
}

module.exports = { withCache, invalidate, set, get, del, TTLS };
