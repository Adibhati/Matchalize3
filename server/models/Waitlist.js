import mongoose from 'mongoose';
import crypto from 'crypto';

const waitlistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, trim: true, default: '' },
    college: { type: String, default: 'IIT Bombay' },
    collegeCode: { type: String, default: 'iitb' },
    branch: { type: String, default: '' },
    year: { type: String, default: '' },

    // Unique 6-char referral code they share
    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Who referred them (ObjectId or null)
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Waitlist',
    },
    // Current queue position (recomputed on referral events)
    position: { type: Number, required: true, index: true },
    // How many people they've referred
    referralCount: { type: Number, default: 0 },
    // Total spots jumped via referrals
    spotsJumped: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['pending', 'invited', 'registered'],
      default: 'pending',
    },
    // Tier based on position
    tier: {
      type: String,
      enum: ['charter', 'founding', 'original'],
      default: 'original',
    },

    // Daily check-in streak (engagement loop)
    lastCheckIn: { type: Date, default: null },
    checkInStreak: { type: Number, default: 0 },

    joinedAt: { type: Date, default: Date.now },
    invitedAt: { type: Date, default: null },
    registeredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Single source of truth for tier thresholds (mirrored in frontend)
waitlistSchema.statics.TIER_THRESHOLDS = { charter: 50, founding: 250 };

// Generate a unique 6-char alphanumeric referral code (no I/O/0/1 to avoid confusion)
waitlistSchema.statics.generateReferralCode = async function () {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  let exists = true;
  while (exists) {
    code = Array.from({ length: 6 }, () => chars[crypto.randomInt(chars.length)]).join('');
    exists = await this.findOne({ referralCode: code });
  }
  return code;
};

waitlistSchema.methods.computeTier = function () {
  const T = this.constructor.TIER_THRESHOLDS;
  if (this.position <= T.charter) return 'charter';
  if (this.position <= T.founding) return 'founding';
  return 'original';
};

const Waitlist = mongoose.model('Waitlist', waitlistSchema);
export default Waitlist;