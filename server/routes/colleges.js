import express from 'express';
import { body } from '../middleware/validate.js';
import { validate } from '../middleware/validate.js';
import College from '../models/College.js';
import CollegeRequest from '../models/CollegeRequest.js';
import { extractDomain } from '../utils/collegeDomain.js';
import { collegeRequestLimiter } from '../middleware/rateLimiters.js';
import { collegeGateFilter, getAllowedColleges } from '../utils/campusGate.js';

const router = express.Router();

/**
 * 🏫 PUBLIC COLLEGE ROUTES
 *
 * Two endpoints, both public by necessity — the picker runs before anyone has
 * an account:
 *
 *   GET  /api/colleges          the picker list (active colleges only)
 *   POST /api/colleges/request  "can't find my college, add it"
 *
 * Neither reveals anything about a user: the picker list is campus metadata
 * with no student counts, no emails, and no traffic. College counts are only
 * ever exposed through /api/admin, which is behind adminProtect.
 */

/**
 * @route   GET /api/colleges
 * @desc    Active colleges, for the signup picker. Public — no auth yet.
 */
router.get('/', async (req, res) => {
  try {
    // Search matches the fields a student actually knows: the official name,
    // or just their city/state ("Delhi" → IIT Delhi). `active` only — a
    // deactivated college must not be selectable, but existing students who
    // verified through it are untouched.
    const q = String(req.query.q || '').trim();

    // Gate first, then search. Both merge into one filter so the campus limit
    // cannot be bypassed by supplying a `q` — an `$or` written after this would
    // still be ANDed against `code`, so a gated-out campus stays invisible
    // however it is searched for.
    const filter = { active: true, ...collegeGateFilter() };
    if (q) {
      // Escaped so a student typing "(" can't turn into a regex that throws.
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { city: rx }, { state: rx }];
    }

    const colleges = await College.find(filter).sort({ name: 1 }).limit(50).lean();

    res.json({
      colleges: colleges.map((c) => ({
        code: c.code,
        name: c.name,
        // Domains are returned so the email screen can pre-fill the suffix.
        // This is public campus information (it has to be, for the flow to
        // work) and is NOT user data — no student information is involved.
        domains: c.domains,
        city: c.city,
        state: c.state,
        country: c.country,
      })),
    });
  } catch (err) {
    console.error('Colleges list error:', err);
    res.status(500).json({ message: 'Server error fetching colleges' });
  }
});

/**
 * @route   POST /api/colleges/request
 * @desc    Student asks for their college to be added. Rate limited.
 * @access  Public
 *
 * ⚠️ This does NOT grant access. The requester still cannot sign up — an
 * operator must verify the domain and add the college first. Deliberate: if a
 * request could self-declare a college plus a domain, anyone could invent a
 * fake campus and verify against it, which defeats the entire product.
 *
 * ⚠️ No email is sent here, on purpose. Emailing the submitted address would
 * let an attacker use this form as a message-delivery or account-takeover
 * primitive (submit someone else's address, have a link sent to them).
 * Notification happens only when an operator explicitly presses Notify.
 */
router.post(
  '/request',
  collegeRequestLimiter,
  [
    body('collegeName')
      .isString()
      .withMessage('College name is required')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('College name is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Enter the full name of your college'),
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(),
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name is too long'),
    body('city').optional().trim().isLength({ max: 100 }).withMessage('City is too long'),
    body('state').optional().trim().isLength({ max: 100 }).withMessage('State is too long'),
    body('country').optional().trim().isLength({ max: 100 }).withMessage('Country is too long'),
  ],
  validate,
  async (req, res) => {
    const { collegeName, email, name = '', city = '', state = '', country = '' } = req.body;

    try {
      // If the college already exists, don't create noise — send them to the
      // picker. Rejecting a public-provider address here is deliberate too: a
      // gmail.com address is not evidence of belonging to any campus.
      const domain = extractDomain(email);
      const publicProvider = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com', 'icloud.com'];
      if (!domain || publicProvider.includes(domain)) {
        return res.status(400).json({
          message: 'Please use your college email address so we can verify your campus.',
        });
      }

      const alreadyListed = await College.findOne({
        name: new RegExp(`^${collegeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      });
      if (alreadyListed) {
        return res.status(400).json({ message: 'That college is already listed — please pick it above.' });
      }

      // upsert so a student who submits twice updates their row instead of
      // creating a duplicate. Their request stays visible rather than vanishing
      // into a duplicate pile.
      await CollegeRequest.findOneAndUpdate(
        { email },
        {
          $set: {
            collegeName, name, city, state, country,
            status: 'pending',
            // Clear any previous outcome so re-requesting actually re-enters
            // the operator queue.
            notifiedAt: null,
            collegeCode: '',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      res.status(201).json({
        message: "Thanks! We've received your request. We'll email you when your college is live.",
      });
    } catch (err) {
      // A duplicate-key here is the unique email index racing; the request is
      // already recorded, so this is a success as far as the user is concerned.
      if (err?.code === 11000) {
        return res.status(201).json({
          message: "Thanks! We've received your request. We'll email you when your college is live.",
        });
      }
      console.error('College request error:', err);
      res.status(500).json({ message: 'Server error submitting request' });
    }
  }
);

export default router;