const rateLimit = require('express-rate-limit');

// Rate-limit auth endpoints to reduce OTP/brute-force abuse.
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === 'development' ? 1000 : 10, // max 1000 in dev, 10 in prod
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again after 15 minutes.',
    });
  },
});


module.exports = authRateLimiter;

