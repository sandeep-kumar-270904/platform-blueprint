const rateLimit = require('express-rate-limit');

// Rate limiter for QA Post routes: Max 5 posts per hour
const qaPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: 'Too many posts created from this IP, please try again after an hour.' }
});

// Rate limiter for Voting routes: Max 30 votes per hour
const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { message: 'Too many votes cast from this IP, please try again after an hour.' }
});

// Rate limiter for Reviews: Max 1 per hour (already somewhat handled by college validation, but good at IP level)
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // Max 2 reviews per hour per IP to prevent spamming
  message: { message: 'Too many reviews submitted, please try again after an hour.' }
});

module.exports = {
  qaPostLimiter,
  voteLimiter,
  reviewLimiter
};
