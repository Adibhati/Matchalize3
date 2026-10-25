import crypto from 'crypto';
import { normalizeEmail } from './otpHash.js';
import ModerationLedger from '../models/ModerationLedger.js';

export const fingerprintModerationEmail = (email) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required to fingerprint moderation identifiers');

  return crypto
    .createHmac('sha256', secret)
    .update(`moderation-ledger:${normalizeEmail(email)}`)
    .digest('hex');
};

export const preserveShadowban = async (user) => {
  if (!user?.email || !user.shadowbannedAt) return null;

  const emailFingerprint = fingerprintModerationEmail(user.email);
  return ModerationLedger.findOneAndUpdate(
    { emailFingerprint },
    {
      $set: {
        shadowbannedAt: user.shadowbannedAt,
        shadowbanScore: Number(user.shadowbanScore) || 0,
        contentFrozen: Boolean(user.contentFrozen),
      },
    },
    { upsert: true, new: true, runValidators: true }
  );
};
