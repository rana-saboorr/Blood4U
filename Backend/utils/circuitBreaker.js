'use strict';
/**
 * circuitBreaker.js — Circuit breaker pattern for external services.
 * Apply to: email sending, third-party geocoding, SMS gateways.
 *
 * States:
 *   CLOSED    — normal operation; failures are counted
 *   OPEN      — service is considered down; calls fail fast
 *   HALF_OPEN — one test call is allowed; success → CLOSED, failure → OPEN
 */

const logger = require('./logger');

class CircuitBreaker {
  /**
   * @param {Function} fn              The async function to protect
   * @param {object}   opts
   * @param {number}   opts.failureThreshold  failures before OPEN (default 5)
   * @param {number}   opts.resetTimeout      ms before attempting HALF_OPEN (default 60000)
   * @param {string}   opts.name              human-readable name for logging
   */
  constructor(fn, opts = {}) {
    this.fn               = fn;
    this.name             = opts.name || fn.name || 'anonymous';
    this.failureThreshold = opts.failureThreshold || 5;
    this.resetTimeout     = opts.resetTimeout || 60_000;

    this.failures    = 0;
    this.state       = 'CLOSED';
    this.nextAttempt = Date.now();
  }

  async call(...args) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit OPEN — ${this.name} is temporarily unavailable. Try again later.`);
      }
      // Transition to HALF_OPEN for one test call
      this.state = 'HALF_OPEN';
      logger.info({ msg: `Circuit breaker HALF_OPEN for ${this.name}` });
    }

    try {
      const result = await this.fn(...args);
      // Success — reset
      if (this.state !== 'CLOSED') {
        logger.info({ msg: `Circuit breaker CLOSED (recovered) for ${this.name}` });
      }
      this.failures = 0;
      this.state    = 'CLOSED';
      return result;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.failureThreshold) {
        this.state       = 'OPEN';
        this.nextAttempt = Date.now() + this.resetTimeout;
        logger.warn({
          msg: `Circuit breaker OPEN for ${this.name}`,
          failures: this.failures,
          nextAttemptIn: `${this.resetTimeout / 1000}s`,
        });
      }
      throw err;
    }
  }

  get status() {
    return {
      name:     this.name,
      state:    this.state,
      failures: this.failures,
    };
  }
}

module.exports = CircuitBreaker;
