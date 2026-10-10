import crypto from 'crypto';

// OTP codes are stored as an HMAC-SHA256 fingerprint, never in plaintext.
// A bare SHA-256 would be useless here: only 10^6 possible codes, so a stolen
// hash could be reversed in seconds by hashing all of them. HMAC needs the
// secret key too, so a database-only leak cannot be brute-forced.
//
// The email is bound into the HMAC input so the same code used on two accounts
// yields two different fingerprints (domain separation).
const getSecret = () => process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;

// MUST normalise: hashOtp has to be byte-identical at store time (send-otp)
// and at verify time, and the route callers are not trusted to normalise.
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const hashOtp = (email, otp) =>
  crypto
    .createHmac('sha256', getSecret())
    .update(`${normalizeEmail(email)}:${otp}`)
    .digest('hex');

// Constant-time compare so the comparison does not leak the fingerprint
// character by character. The length guard makes legacy plaintext rows fail
// safe to `false` instead of throwing on a Buffer length mismatch.
export const verifyOtp = (email, otp, storedHash) => {
  const candidate = Buffer.from(hashOtp(email, otp), 'hex');
  const stored = Buffer.from(String(storedHash || ''), 'hex');
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
};

export { normalizeEmail };
