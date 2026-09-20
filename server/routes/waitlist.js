import express from 'express';
import { body } from '../middleware/validate.js';
import { validate } from '../middleware/validate.js';
import Waitlist from '../models/Waitlist.js';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// FIXED: Hardcoded launch date — no more drift
const LAUNCH_DATE = new Date('2026-10-02T00:00:00Z');

// Rate limit: 5 joins per 15 min per IP
const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.ip,
  message: { message: 'Too many join attempts. Please wait a bit.' },
});

// Extract college details from email (matches pattern in auth.js)
const extractCollege = (email) => {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const code = domain.split('.')[0];
  const map = {
    iitb: 'IIT Bombay', iitd: 'IIT Delhi', iitk: 'IIT Kanpur',
    iitkgp: 'IIT Kharagpur', iitm: 'IIT Madras', iitr: 'IIT Roorkee',
    iitg: 'IIT Guwahati', iith: 'IIT Hyderabad', iitbhu: 'IIT BHU',
  };
  return { collegeCode: code, college: map[code] || domain };
};

// Variable-ratio reward engine. The slot machine.
// Weighted toward small bonuses with rare jackpots.
const computeReferralBonus = (referrerCurrentCount) => {
  const roll = Math.random();
  let bonus;
  if (roll < 0.50) bonus = 2 + Math.floor(Math.random() * 2);       // 50%: 2-3 spots
  else if (roll < 0.80) bonus = 4 + Math.floor(Math.random() * 3);  // 30%: 4-6 spots
  else if (roll < 0.95) bonus = 7 + Math.floor(Math.random() * 4);  // 15%: 7-10 spots
  else bonus = 11 + Math.floor(Math.random() * 5);                  // 5%: 11-15 spots (JACKPOT)

  // Early evangelist bonus: first 10 referrals get +5 extra
  if (referrerCurrentCount < 10) bonus += 5;
  return bonus;
};

// Proper block-shift: moves everyone in [newPosition, oldPosition) up by 1,
// then recomputes tiers for the affected block + the referrer.
const shiftPositionsUp = async (referrerId, oldPosition, newPosition) => {
  if (newPosition >= oldPosition) return; // No shift needed

  // 1. Shift everyone in the gap up by 1
  await Waitlist.updateMany(
    {
      _id: { $ne: referrerId },
      position: { $gte: newPosition, $lt: oldPosition },
    },
    { $inc: { position: 1 } }
  );

  // 2. Recompute tiers for the shifted block + the referrer
  const T = Waitlist.TIER_THRESHOLDS;
  const affected = await Waitlist.find({
    position: { $gte: newPosition, $lte: oldPosition },
  }).lean();

  const ops = affected.map((entry) => {
    const tier = entry.position <= T.charter ? 'charter'
               : entry.position <= T.founding ? 'founding'
               : 'original';
    return {
      updateOne: {
        filter: { _id: entry._id },
        update: { $set: { tier } },
      },
    };
  });
  if (ops.length > 0) await Waitlist.bulkWrite(ops);
};

// ─── JOIN THE WAITLIST ───
router.post(
  '/join',
  joinLimiter,
  [
    body('email')
      .isEmail().withMessage('Valid email required')
      .custom((value) => {
        const normalized = value.trim().toLowerCase();
        if (!normalized.endsWith('@iitb.ac.in')) {
          throw new Error('Currently only @iitb.ac.in emails are accepted');
        }
        return true;
      }),
    body('name').optional().isString().trim().isLength({ max: 60 }),
    body('referralCode').optional().isString().trim().isLength({ min: 6, max: 6 }),
  ],
  validate,
  async (req, res) => {
    try {
      const email = req.body.email.trim().toLowerCase();
      const { name, referralCode } = req.body;

      // Duplicate check
      const existing = await Waitlist.findOne({ email });
      if (existing) {
        return res.status(409).json({
          message: 'You are already in the cohort.',
          position: existing.position,
          referralCode: existing.referralCode,
        });
      }

      // Process referral if provided
      let referrer = null;
      let bonusSpots = 0;
      let oldPosition = null;

      if (referralCode) {
        referrer = await Waitlist.findOne({ referralCode: referralCode.toUpperCase() });
        if (referrer) {
          // Self-referral guard
          if (referrer.email === email) {
            return res.status(400).json({ message: 'Nice try. You cannot refer yourself.' });
          }

          // THE SLOT MACHINE MOMENT
          bonusSpots = computeReferralBonus(referrer.referralCount);
          oldPosition = referrer.position;
          const newPosition = Math.max(1, referrer.position - bonusSpots);

          referrer.position = newPosition;
          referrer.referralCount += 1;
          referrer.spotsJumped += bonusSpots;
          referrer.tier = referrer.computeTier();
          await referrer.save();

          // Proper block-shift
          await shiftPositionsUp(referrer._id, oldPosition, newPosition);
        }
      }

      // Assign position (end of queue)
      const totalBefore = await Waitlist.countDocuments();
      const position = totalBefore + 1;
      const newReferralCode = await Waitlist.generateReferralCode();
      const { college, collegeCode } = extractCollege(email);

      const T = Waitlist.TIER_THRESHOLDS;
      const entry = await Waitlist.create({
        email,
        name: name || '',
        college, collegeCode,
        referralCode: newReferralCode,
        referredBy: referrer?._id || null,
        position,
        tier: position <= T.charter ? 'charter' : position <= T.founding ? 'founding' : 'original',
      });

      res.status(201).json({
        success: true,
        position: entry.position,
        referralCode: entry.referralCode,
        tier: entry.tier,
        totalWaiting: position,
        referralBonus: referrer ? {
          referrerName: referrer.name || 'A fellow IITian',
          spotsJumped: bonusSpots,
          newPosition: referrer.position,
        } : null,
      });
    } catch (error) {
      console.error('Waitlist join error:', error);
      res.status(500).json({ message: 'The archives encountered an error. Please try again.' });
    }
  }
);

// ─── CHECK STATUS (by referral code — no auth needed) ───
router.get('/status/:code', async (req, res) => {
  try {
    const entry = await Waitlist.findOne({ referralCode: req.params.code.toUpperCase() }).lean();
    if (!entry) return res.status(404).json({ message: 'Code not found' });
    const total = await Waitlist.countDocuments();
    res.json({
      position: entry.position,
      tier: entry.tier,
      totalWaiting: total,
      ahead: entry.position - 1,
      referralCount: entry.referralCount,
      spotsJumped: entry.spotsJumped,
      spotsToTop100: entry.position > 100 ? entry.position - 100 : 0,
      spotsToTop50: entry.position > 50 ? entry.position - 50 : 0,
      status: entry.status,
      joinedAt: entry.joinedAt,
      checkInStreak: entry.checkInStreak,
      name: entry.name,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch status' });
  }
});

// ─── PUBLIC STATS (for social proof counter) ───
router.get('/stats', async (req, res) => {
  try {
    const [total, charter, founding, last24h, recentJoins] = await Promise.all([
      Waitlist.countDocuments(),
      Waitlist.countDocuments({ position: { $lte: 50 } }),
      Waitlist.countDocuments({ position: { $gt: 50, $lte: 250 } }),
      Waitlist.countDocuments({ joinedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Waitlist.find().sort({ joinedAt: -1 }).limit(12).select('name branch year joinedAt').lean(),
    ]);
    res.json({
      total, charter, founding, last24h,
      // Real joins for transparent social proof
      recentJoins: recentJoins.map(j => ({
        name: j.name || 'An IITian',
        branch: j.branch || '',
        year: j.year || '',
        joinedAt: j.joinedAt,
      })),
      // Fixed launch date (move to Setting model later)
      launchDate: LAUNCH_DATE.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// ─── DAILY CHECK-IN (engagement loop) ───
router.post('/checkin/:code', async (req, res) => {
  try {
    const entry = await Waitlist.findOne({ referralCode: req.params.code.toUpperCase() });
    if (!entry) return res.status(404).json({ message: 'Code not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Already checked in today
    if (entry.lastCheckIn && new Date(entry.lastCheckIn).setHours(0,0,0,0) >= today.getTime()) {
      return res.json({ streak: entry.checkInStreak, alreadyCheckedIn: true });
    }

    // Maintain or reset streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastCheckInDay = entry.lastCheckIn ? new Date(entry.lastCheckIn).setHours(0,0,0,0) : null;
    entry.checkInStreak = (lastCheckInDay === yesterday.getTime()) ? entry.checkInStreak + 1 : 1;
    entry.lastCheckIn = now;

    // Reward: every 3-day streak = jump 2 spots
    let reward = null;
    if (entry.checkInStreak > 0 && entry.checkInStreak % 3 === 0) {
      const jump = 2;
      const oldPosition = entry.position;
      const newPosition = Math.max(1, entry.position - jump);
      entry.position = newPosition;
      entry.spotsJumped += jump;
      entry.tier = entry.computeTier();
      await entry.save();
      await shiftPositionsUp(entry._id, oldPosition, newPosition);
      reward = { spotsJumped: jump, newPosition };
    } else {
      await entry.save();
    }

    res.json({ streak: entry.checkInStreak, position: entry.position, reward });
  } catch (error) {
    res.status(500).json({ message: 'Check-in failed' });
  }
});

export default router;