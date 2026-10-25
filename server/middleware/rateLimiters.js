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

export const destructiveActionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many destructive actions. Please slow down.' },
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

// Limit OTP verification attempts to prevent brute-force.
// KEYED BY EMAIL (not IP): brute force is per-email anyway (each email has
// its own OTP + 3-attempt cap in DB). This lets students across ANY Indian
// college — behind shared campus NAT — verify without blocking each other.
export const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.OTP_VERIFY_MAX) || 15,
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toString().toLowerCase().trim();
    return email || `no-email-${req.ip}`;
  },
  message: {
    message: 'Too many verification attempts. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit OTP send requests BY EMAIL (not IP).
// With potentially hundreds of Indian colleges behind NAT, IP-based limiting
// would lock out entire campuses. Per-email keying means every student gets
// their own bucket. Real anti-spam protection stays in the send-otp route:
// 5 codes/hour/email DB check + .ac.in domain restriction.
export const otpEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.OTP_EMAIL_LIMIT_MAX) || 5,
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toString().toLowerCase().trim();
    return email || `no-email-${req.ip}`;
  },
  message: { message: 'Too many verification requests for this email. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Add a per-source cap before the per-email cap so one client cannot consume
// arbitrary OTP sends for many addresses. Keep this generous for shared campus
// networks; the per-email limiter remains as a separate delivery-abuse guard.
export const otpIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.OTP_IP_LIMIT_MAX) || 20,
  message: { message: 'Too many verification requests from this device. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 📨 COLLEGE REQUEST limiter — protects the public "add my college" form.
 *
 * Keyed by IP, NOT email: the threat here is someone scripting thousands of
 * submissions to bury real requests under fake ones, which is an IP-shaped
 * problem. (College requests are also deduped by email at the DB layer, so one
 * person cannot pad a campus's count by submitting repeatedly.)
 *
 * IP-based is safe here precisely because it doesn't gate signups — an IP
 * limiter on otpEmailLimiter would lock out a whole NAT'd campus.
 */
export const collegeRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.COLLEGE_REQUEST_LIMIT_MAX) || 5,
  message: { message: 'Too many college requests from this device. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * ♻️ RE-VERIFICATION limiter — the yearly student re-check.
 *
 * Keyed by user id, not IP or email: every student sits behind shared campus
 * NAT, so an IP limiter here would lock out a whole college at once on the same
 * day their re-verification came due. A user needs exactly one code, so a tight
 * budget is safe.
 */
export const reverifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.REVERIFY_MAX) || 10,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many re-verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
