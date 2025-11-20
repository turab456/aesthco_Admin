const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = {
  loginLimiter: createRateLimiter(
    2 * 60 * 1000, // 2 minutes
    5, // 5 attempts
    'Too many login attempts, please try again later.'
  ),
  
  registerLimiter: createRateLimiter(
    5 * 60 * 1000, // 5 minutes
    5, // 5 registrations
    'Too many registration attempts, please try again later.'
  ),
  
  otpLimiter: createRateLimiter(
    5 * 60 * 1000, // 5 minutes
    5, // 5 OTP requests
    'Too many OTP requests, please try again later.'
  ),
  
  generalLimiter: createRateLimiter(
    1 * 60 * 1000, // 1 minutes
    100, // 100 requests
    'Too many requests, please try again later.'
  )
};
