import express from 'express';
import { body } from '../middleware/validate.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import OTP from '../models/OTP.js';
import User from '../models/User.js';
import ModerationLedger from '../models/ModerationLedger.js';
import { fingerprintModerationEmail, preserveShadowban } from '../utils/moderationLedger.js';
import { validate } from '../middleware/validate.js';
import { protect, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { APP_CONSTANTS } from '../config/appData.js';
import { sendOTP } from '../utils/email.js';
import { hashOtp, verifyOtp, normalizeEmail } from '../utils/otpHash.js';
import College from '../models/College.js';
import { emailMatchesCollege } from '../utils/collegeDomain.js';
import { isCollegeAllowed, COLLEGE_GATE_MESSAGE } from '../utils/campusGate.js';
import { verifyOtpLimiter, otpEmailLimiter, otpIpLimiter, reverifyLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Generate 6-digit cryptographically secure code
// NOTE: randomInt upper bound is EXCLUSIVE — 1000000 makes 999999 reachable
const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * 🔒 COLLEGE RESOLUTION — the user PICKS their college; we never infer it.
 *
 * This used to guess the college from the email domain by taking "the label
 * immediately before .ac.in", which meant `x@cse.iitb.ac.in` and `x@iitb.ac.in`
 * both became `iitb` — and, critically, that the college was a FUNCTION of the
 * email. With the picker, the student states their college and the email must
 * then agree with it.
 *
 * Matching is exact-or-subdomain via utils/collegeDomain.js, so a college
 * registered as `iitb.ac.in` accepts every department address without listing
 * them, while `evil@iitb.ac.in.attacker.com` is rejected.
 */

/**
 * Look up a college and check the email belongs to it.
 *
 * @returns {{ok:true, college}|{ok:false, college?:object, reason:string}}
 */
export const resolveCollege = async (collegeCode, email) => {
  const code = (collegeCode || '').toString().trim().toLowerCase();
  if (!code) {
    return { ok: false, reason: 'Please select your college first.' };
  }

  const college = await College.findOne({ code });
  if (!college) {
    return { ok: false, reason: 'Please select your college from the list.' };
  }
  if (!college.active) {
    return { ok: false, college, reason: 'Sign-ups for this college are currently closed.' };
  }

  // 🔒 THE PILOT GATE.
  //
  // Checked AFTER the college exists and is active, so a student outside the
  // gate gets the same closed-door message whether their campus is missing,
  // deactivated, or simply not yet opened to the pilot. Before this line the
  // three failure modes were indistinguishable to the caller and each leaked a
  // little of the shape of the pilot.
  //
  // This is the security control. The picker hiding non-gated colleges (see
  // collegeGateFilter in the list routes) is only cosmetic — it keeps the UI
  // honest, but a student can post any collegeCode they like to /api/auth, so
  // the check that matters has to live here, server-side, on the path that
  // actually issues an OTP.
  if (!isCollegeAllowed(code)) {
    return { ok: false, college, reason: COLLEGE_GATE_MESSAGE };
  }

  if (!emailMatchesCollege(email, college.domains)) {
    // ── THE OPERATOR ESCAPE HATCH ────────────────────────────────────────────
    //
    // A single account, matched by exact address, is allowed to register
    // without a college-domain email. This exists because adminProtect gates on
    // `user.email === ADMIN_EMAIL`, and an admin whose address is a Gmail or an
    // alumni mailbox can never satisfy an academic-domain check — so without
    // this, setting ADMIN_EMAIL to anything other than a student address makes
    // the entire admin panel permanently unreachable. There is no other way
    // to recover it: the panel has no separate login.
    //
    // Deliberately narrow on all three axes:
    //   • ONE address, exact match after trim+lowercase — never a domain.
    //   • It still needs a valid college CODE that exists and is active, and
    //     still has to clear the pilot gate. This bypasses the email check
    //     only, not the college gate.
    //   • It still requires a real OTP. Nothing about it skips verification;
    //     it only lets a non-@iitb.ac.in mailbox receive that code.
    //
    // Unset ADMIN_EMAIL → the comparison is against undefined, matches
    // nothing, and behaviour is exactly as before.
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (adminEmail && email.toLowerCase() === adminEmail) {
      console.warn(
        `[admin-bootstrap] ${email} registered on "${code}" without a matching college domain.`,
      );
      return { ok: true, college };
    }

    // The one error that names the college and its domain. Specific enough to
    // tell a student what went wrong; it leaks no user data — college domains
    // are public information and the student supplied the email themselves.
    const suffix = college.domains[0] ? `@${college.domains[0]}` : 'a college email address';
    return {
      ok: false,
      college,
      reason: `${college.name} students need an email address ending in ${suffix}.`,
    };
  }

  return { ok: true, college };
};

// How long a verified account stays verified before the annual re-check.
const REVERIFY_INTERVAL_MS = 365 * 24 * 60 * 60 * 1000;

// Grace period after the re-check date passes, before the account is gated.
// Absorbs a college mail-server outage without cutting students off.
const REVERIFY_GRACE_DAYS = 14;

/**
 * Next re-verification date = one year after the moment we just proved inbox
 * control. Deliberately NOT derived from graduatingYear: a student on a
 * semester extension legitimately types a later year, and we must not gate them
 * on a date they never chose. One year from the proof is both simpler and
 * always fair.
 */
const nextReverifyDate = (from = new Date()) => new Date(from.getTime() + REVERIFY_INTERVAL_MS);

/**
 * Whole days remaining in the grace window. Negative once overdue+expired,
 * which is what the login gate keys on. An account with no `reverifyDue` is
 * treated as not-yet-due, so nothing is ever locked out by missing data.
 */
const graceDaysLeft = (due, now = new Date()) => {
  if (!due) return REVERIFY_GRACE_DAYS;
  const end = new Date(due).getTime() + REVERIFY_GRACE_DAYS * 24 * 60 * 60 * 1000;
  return Math.ceil((end - now.getTime()) / (24 * 60 * 60 * 1000));
};

// @route   POST /api/auth/send-otp
// @desc    Generate OTP and send it via email
// @access  Public
router.post(
  '/send-otp',
  otpIpLimiter,
  otpEmailLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address'),
    body('collegeCode')
      .isString()
      .withMessage('Please select your college')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('Please select your college'),
  ],
  validate,
  async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const collegeCode = req.body.collegeCode;

    try {
      // The picker is authoritative: the student chose the college, and the
      // email must belong to THAT college. There is no global .ac.in rule any
      // more — a college registered as `foo.com` works exactly like an .ac.in
      // one, which is what makes this an inter-college network rather than an
      // India-academics-only one.
      const resolved = await resolveCollege(collegeCode, email);
      if (!resolved.ok) {
        return res.status(400).json({ message: resolved.reason });
      }
      const college = resolved.college;
      // Rate limiting: check recent OTP requests (optional, but let's keep it robust)
      const recentOTPs = await OTP.find({
        email,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // last hour
      });

      if (recentOTPs.length >= 5) {
        return res.status(429).json({
          message: 'Too many verification codes requested. Please try again in an hour.',
        });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

      // Save to DB — only the HMAC fingerprint, never the code itself.
      //
      // collegeCode is persisted HERE, server-side, at the moment the challenge
      // is issued. verify-otp reads it from this record rather than accepting it
      // from the request body, so a client cannot ask for a code against one
      // college and then verify as a different one.
      await OTP.create({
        email,
        otpHash: hashOtp(email, otp),
        expiresAt,
        collegeCode: college.code,
      });

      // Send OTP
      await sendOTP(email, otp);

      res.status(200).json({ message: 'Verification code sent successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error, could not send code' });
    }
  }
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and return JWT token
// @access  Public
router.post(
  '/verify-otp',
  verifyOtpLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate,
  async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const otp = req.body.otp;

    try {
      const record = await OTP.findOne({ email }).sort({ createdAt: -1 });

      if (!record) {
        return res.status(400).json({ message: 'No verification code found' });
      }

      // Check expiry
      if (record.expiresAt < new Date()) {
        await OTP.deleteOne({ _id: record._id });
        return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
      }

      // Check attempts
      if (record.attempts >= 3) {
        return res.status(400).json({
          message: 'Too many incorrect attempts. Please request a new code.',
        });
      }

      // Compare (constant-time against the stored HMAC)
      if (!verifyOtp(email, otp, record.otpHash)) {
        const updated = await OTP.findOneAndUpdate(
          { _id: record._id, attempts: { $lt: 3 } },
          { $inc: { attempts: 1 } },
          { new: true }
        );
        if (!updated) {
          return res.status(400).json({ message: 'Too many incorrect attempts. Please request a new code.' });
        }
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Valid OTP! Find or create user
      let user = await User.findOne({ email });

      // RECLAMATION: a soft-deleted email can be reused once the 30-day
      // Trust & Safety retention window has elapsed. Hard-delete the stale
      // doc so a fresh account can be created below (no cron needed).
      const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
      if (user && user.isDeleted) {
        const deletedAt = user.deletedAt ? user.deletedAt.getTime() : 0;
        if (Date.now() - deletedAt >= RETENTION_MS) {
          await preserveShadowban(user);
          await User.deleteOne({ _id: user._id });
          user = null; // fall through to fresh-account creation
        }
      }

      // The college comes from the OTP record — the same value send-otp validated
      // against this email's domain. Never re-derived here.
      const college = record.collegeCode ? await College.findOne({ code: record.collegeCode }) : null;
      if (!college) {
        // The college was deleted between issuing and verifying the code. Fail
        // closed: no college, no account.
        await OTP.deleteMany({ email });
        return res.status(400).json({
          message: 'That college is no longer available. Please select your college again.',
        });
      }

      if (!user) {
        const moderationRecord = await ModerationLedger.findOne({
          emailFingerprint: fingerprintModerationEmail(email),
        }).lean();
        user = await User.create({
          email,
          college: college.name,
          collegeCode: college.code,
          isVerified: true,
          isOnboarded: false,
          status: 'active',
          lastVerifiedAt: new Date(),
          reverifyDue: nextReverifyDate(),
          ...(moderationRecord ? {
            shadowbanScore: moderationRecord.shadowbanScore,
            shadowbannedAt: moderationRecord.shadowbannedAt,
            contentFrozen: moderationRecord.contentFrozen,
          } : {}),
        });
      } else {
        // 🛡️ Block suspended users from logging in
        if (user.suspended) {
          return res.status(403).json({
            message: 'Your account has been suspended. Contact support for assistance.',
            suspended: true,
            reason: user.suspendedReason || 'Multiple community reports',
          });
        }

        // 🛡️ Block deleted users from logging in
        if (user.isDeleted) {
          const unlockAt = user.deletedAt
            ? new Date(user.deletedAt.getTime() + RETENTION_MS)
            : new Date(Date.now() + RETENTION_MS);
          return res.status(403).json({
            message: `This account was deleted recently. You can create a new account with this email on or after ${unlockAt.toDateString()}.`,
            deleted: true,
            reusableAt: unlockAt.toISOString(),
          });
        }

        user.isVerified = true;
        // ⚠️ college/collegeCode are NOT overwritten on login any more.
        //
        // This used to re-derive them from the email domain on every single
        // login. With the picker that was actively wrong — it silently discarded
        // the student's stated college and replaced it with a guess, which would
        // have made the picker decorative. They're set once at account creation
        // and only change via the explicit "change college" flow.
        //
        // Each successful OTP proof renews the re-verification clock.
        user.status = 'active';
        user.lastVerifiedAt = new Date();
        user.reverifyDue = nextReverifyDate();
        await user.save();
      }

      // Delete OTP records for this email
      await OTP.deleteMany({ email });

      // Create JWT
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set httpOnly cookie (primary auth mechanism)
      setAuthCookie(res, token);

      res.status(200).json({
        user: {
          _id: user._id,
          email: user.email,
          college: user.college,
          collegeCode: user.collegeCode,
          isOnboarded: user.isOnboarded,
          name: user.name,
          isUnderReview: Boolean(user.shadowbannedAt || user.contentFrozen),
          suspended: user.suspended,
          isDeleted: user.isDeleted,
          status: user.status || 'active',
          reverifyDue: user.reverifyDue || null,
          // Returned so the client can decide whether to show the annual
          // student check. `required` is false inside the grace window, so a
          // student with a temporarily broken inbox is nudged, not blocked.
          reverifyRequired:
            Boolean(user.reverifyDue) &&
            new Date(user.reverifyDue).getTime() + REVERIFY_GRACE_DAYS * 86400000 < Date.now(),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during verification' });
    }
  }
);

// ─── ANNUAL RE-VERIFICATION ──────────────────────────────────────────────
// The product claims "Students only." A college email proves inbox control at
// one moment, and alumni mailboxes keep working for decades. Re-checking once a
// year is the only thing that makes the claim true rather than aspirational —
// when a graduate's inbox finally dies, the code stops arriving and they stop
// being a student. Nobody is blocked by us; the inbox does it.
//
// ⚠️ NEVER deletes or suspends for a failed check. Losing mail access is not
// proof of anything, and silently destroying an account because a university
// mail server had a bad afternoon is unacceptable.

// @route   POST /api/auth/reverify
// @desc    Send a fresh code to the user's college email (annual student check)
// @access  Private
router.post('/reverify', protect, reverifyLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const college = user.collegeCode ? await College.findOne({ code: user.collegeCode }) : null;
    if (!college) {
      // Their college was removed from the directory. Do NOT delete — they may
      // just need to be moved to a corrected record by an operator.
      return res.status(400).json({
        message: 'Your college is no longer listed. Please contact support.',
        code: 'COLLEGE_UNAVAILABLE',
      });
    }

    const now = new Date();
    const otp = generateOTP();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    await OTP.create({
      email: user.email,
      otpHash: hashOtp(user.email, otp),
      expiresAt,
      collegeCode: college.code,
    });

    await sendOTP(user.email, otp);

    const body = {
      message: `Code sent to your ${college.name} email.`,
      reverifyDue: user.reverifyDue,
      graceDaysLeft: graceDaysLeft(user.reverifyDue, now),
    };

    /* ⚠️ TEST-ONLY. The plaintext code is unrecoverable by design — only its
       HMAC is stored — and Dev Mode inside sendOTP prints it to the server
       console, which isn't reachable when the route is driven over HTTP. This
       returns it so the re-verify flow can be verified end to end without
       reading logs.
       Gated on NODE_ENV === 'test' so it cannot fire in production, where it
       would hand a caller the code for the account they're already logged into
       (which would defeat the entire annual check). */
    if (process.env.NODE_ENV === 'test') body.__testOtp = otp;

    res.json(body);
  } catch (err) {
    console.error('Reverify send error:', err);
    res.status(500).json({ message: 'Could not send verification code' });
  }
});

// @route   POST /api/auth/reverify/confirm
// @desc    Complete the annual student check and renew the re-verification date
// @access  Private
router.post('/reverify/confirm', protect, verifyOtpLimiter, [
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], validate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const record = await OTP.findOne({ email: user.email }).sort({ createdAt: -1 });
    if (!record || !record.collegeCode) {
      return res.status(400).json({ message: 'Request a new code first.' });
    }
    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'That code expired. Request a new one.' });
    }
    if (!verifyOtp(user.email, req.body.otp, record.otpHash)) {
      await OTP.findOneAndUpdate(
        { _id: record._id, attempts: { $lt: 3 } },
        { $inc: { attempts: 1 } },
      );
      return res.status(400).json({ message: 'Incorrect code.' });
    }

    await OTP.deleteMany({ email: user.email });

    // Success: clear the gate and push the next check a year out. `suspended`
    // is deliberately untouched — moderation state is independent of whether a
    // student still receives their college mail.
    user.status = 'active';
    user.lastVerifiedAt = new Date();
    user.reverifyDue = nextReverifyDate();
    await user.save();

    res.json({ ok: true, reverifyDue: user.reverifyDue });
  } catch (err) {
    console.error('Reverify confirm error:', err);
    res.status(500).json({ message: 'Could not complete re-verification' });
  }
});

// @route   GET /api/auth/reverify/status
// @desc    Does this account need the annual student check?
// @access  Private
//
// Called by the client on load. Returns `required: false` inside the grace
// window so a student is nudged rather than blocked, and a college mail
// outage can't strand an entire campus.
router.get('/reverify/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('status reverifyDue lastVerifiedAt college');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const overdue = user.reverifyDue ? new Date(user.reverifyDue) < now : false;
    const days = graceDaysLeft(user.reverifyDue, now);

    /* Three distinct states, and the client must be able to tell them apart:
         required:false, past=false → nothing to do
         required:false, past=true  → nudge only, still inside the grace window
         required:true              → gated until they confirm

       Named off `days` rather than `overdue`, because a student 10 days past
       due and one 30 days past due are both "past" but only the second is
       actually blocked. */
    res.json({
      required: overdue && days < 0,
      pastDue: overdue,
      graceDaysLeft: days,
      reverifyDue: user.reverifyDue,
      college: user.college,
    });
  } catch (err) {
    console.error('Reverify status error:', err);
    res.status(500).json({ message: 'Could not read re-verification status' });
  }
});

// @route   POST /api/auth/logout
// @desc    Clear auth cookie
// @access  Public
router.post('/logout', async (req, res) => {
  let userId = null;
  try {
    const token =
      req.cookies?.[APP_CONSTANTS.AUTH_COOKIE_NAME] ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    }
  } catch {
    // Invalid/expired token — still proceed to clear the cookie
  }

  if (userId) {
    req.app.get('io')?.in(userId.toString()).disconnectSockets(true);
    try {
      await User.findByIdAndUpdate(userId, { lastLogoutAt: new Date() });
    } catch (error) {
      console.error('Logout session invalidation error:', error);
      clearAuthCookie(res);
      return res.status(500).json({ message: 'Could not fully invalidate the session' });
    }
  }

  clearAuthCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/me
// @desc    Get current user profile from token
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    // protect attaches a LIGHT user (route-critical fields only) for performance.
    // /me must return the FULL profile (photos, prompts, bio, etc.), so re-fetch it.
    const fullUser = await User.findById(req.user._id);
    if (!fullUser) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({
      ...fullUser.toJSON(),
      isUnderReview: Boolean(fullUser.shadowbannedAt || fullUser.contentFrozen),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
