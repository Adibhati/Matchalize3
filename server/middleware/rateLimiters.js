import rateLimit from 'express-rate-limit';

// Limit message sending to 30 messages per 10 minutes per user
export const messageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many messages sent. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit discover actions (likes/passes) to 100 per 10 minutes per user
export const discoverLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many actions. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit OTP verification attempts to prevent brute-force and DoS
// 15 attempts per 15 minutes per IP address.
// This allows a small group on shared Wi-Fi to make typos, but stops automated scripts dead.
export const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  keyGenerator: (req) => req.ip,
  message: { 
    message: 'Too many verification attempts. Please wait 15 minutes before trying again.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit OTP requests by IP to prevent spamming across multiple emails
export const otpIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  message: { message: 'Too many verification requests from this network. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
