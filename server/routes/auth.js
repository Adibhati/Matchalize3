import express from 'express';
import { body } from '../middleware/validate.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import OTP from '../models/OTP.js';
import User from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { protect, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { sendOTP } from '../utils/email.js';
import { COLLEGE_MAP } from '../config/appData.js';
import { verifyOtpLimiter, otpIpLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Generate 6-digit cryptographically secure code
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Helper to extract college code and name
const extractCollegeDetails = (email) => {
  const parts = email.split('@');
  if (parts.length < 2) return { college: '', collegeCode: '' };
  const domain = parts[1].toLowerCase();
  
  // Example: someone@iitb.ac.in -> domain: iitb.ac.in -> code: iitb
  const domainParts = domain.split('.');
  let collegeCode = domainParts[0];
  
  // Map common college codes to readable names
  let college = COLLEGE_MAP[collegeCode] || domain;
  if (collegeCode === 'gmail') collegeCode = 'iit'; // fallback/dev code

  return { college, collegeCode };
};

// @route   POST /api/auth/send-otp
// @desc    Generate OTP and send it via email
// @access  Public
router.post(
  '/send-otp',
  otpIpLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .custom((value) => {
        // Enforce .ac.in domain except when ALLOW_ALL_EMAILS is true
        const isAcademic = value.endsWith('.ac.in');
        const allowAll = process.env.ALLOW_ALL_EMAILS === 'true';
        if (!isAcademic && !allowAll) {
          throw new Error('Only academic (.ac.in) emails are allowed');
        }
        return true;
      }),
  ],
  validate,
  async (req, res) => {
    const { email } = req.body;

    try {
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

      // Save to DB
      await OTP.create({
        email,
        otp,
        expiresAt,
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
    const { email, otp } = req.body;

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

      // Compare
      if (record.otp !== otp) {
        record.attempts += 1;
        await record.save();
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Valid OTP! Find or create user
      let user = await User.findOne({ email });
      const { college, collegeCode } = extractCollegeDetails(email);

      if (!user) {
        user = await User.create({
          email,
          college,
          collegeCode,
          isVerified: true,
          isOnboarded: false,
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
          return res.status(403).json({
            message: 'This account has been deleted.',
            deleted: true,
          });
        }

        user.isVerified = true;
        // Update college/collegeCode if they were empty
        if (!user.college) user.college = college;
        if (!user.collegeCode) user.collegeCode = collegeCode;
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
        token,
        user: {
          _id: user._id,
          email: user.email,
          college: user.college,
          collegeCode: user.collegeCode,
          isOnboarded: user.isOnboarded,
          name: user.name,
          isGhost: user.isGhost,
          suspended: user.suspended,
          suspendedReason: user.suspendedReason,
          isDeleted: user.isDeleted,
          shadowbanScore: user.shadowbanScore || 0,
          shadowbannedAt: user.shadowbannedAt || null,
          contentFrozen: user.contentFrozen || false,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during verification' });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Clear auth cookie
// @access  Public
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/me
// @desc    Get current user profile from token
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
