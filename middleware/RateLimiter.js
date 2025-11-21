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
    10, // 10 attempts
    'Too many login attempts, please try again later.'
  ),
  
  registerLimiter: createRateLimiter(
    1 * 60 * 1000, // 1 minute
    10, // 10 registrations per minute
    'Too many registration attempts, please try again soon.'
  ),
  
  otpLimiter: createRateLimiter(
    1 * 60 * 1000, // 1 minute
    20, // 20 OTP requests per minute
    'Too many OTP requests, please try again in a minute.'
  ),
  
  generalLimiter: createRateLimiter(
    1 * 60 * 1000, // 1 minute
    500, // generous cap for normal traffic
    'Too many requests, please try again later.'
  )
};
