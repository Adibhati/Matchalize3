# Chunk 21 — Server Routes

> Matchalize · `server-routes` · files 21 of 27 chunks · 4 file(s) · 70 KB · ~20,395 tokens
> Generated 2026-10-17 20:14.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./server/routes/admin.js`
> - `./server/routes/alignments.js`
> - `./server/routes/auth.js`
> - `./server/routes/colleges.js`

---
### ./server/routes/admin.js

```
import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Report from '../models/Report.js';
import Alignment from '../models/Alignment.js';
import Message from '../models/Message.js';
import Setting from '../models/Setting.js';
import College from '../models/College.js';
import CollegeRequest from '../models/CollegeRequest.js';
import { normaliseDomain } from '../utils/collegeDomain.js';
import { sendCollegeLive } from '../utils/email.js';
import { adminProtect } from '../middleware/admin.js';

const router = express.Router();
router.use(adminProtect);

// ─── Helpers ───
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const VALID_REPORT_STATUSES = ['pending', 'reviewed', 'dismissed', 'actioned'];
const ALLOWED_SETTING_KEYS = new Set([
  'supportEmail',
  'maintenanceMode',
  'shadowbanThreshold',
  'autoShadowban',
  'appConfig',
]);

// ─── STATS ───
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, newToday, active7d, active30d, pendingReports, activeBans, shadowbannedUsers] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false, createdAt: { $gte: todayStart } }),
      User.countDocuments({ isDeleted: false, lastActive: { $gte: sevenDaysAgo } }),
      User.countDocuments({ isDeleted: false, lastActive: { $gte: thirtyDaysAgo } }),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ isDeleted: false, suspended: true }),
      User.countDocuments({ isDeleted: false, shadowbannedAt: { $ne: null } }),
    ]);

    res.json({
      totalUsers,
      newToday,
      active7d,
      active30d,
      pendingReports,
      activeBans,
      activeShadowbans: shadowbannedUsers,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// ─── REPORTS ───
router.get('/reports', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(Number(req.query.perPage) || 15, 100);
    const { status, search, reason } = req.query;
    const skip = (page - 1) * perPage;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (reason && reason !== 'all') filter.reason = reason;

    if (search) {
      const safeSearch = escapeRegex(search);
      const searchUsers = await User.find({
        $or: [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ],
      }).select('_id').lean();
      const userIds = searchUsers.map(u => u._id);
      filter.$or = [
        { reporter: { $in: userIds } },
        { reported: { $in: userIds } },
      ];
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'name email photos')
        .populate('reported', 'name email photos suspended shadowbannedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Report.countDocuments(filter),
    ]);

    const reportedIds = [...new Set(reports.map(r => r.reported?._id?.toString()))];
    const reportCounts = {};
    if (reportedIds.length) {
      const counts = await Report.aggregate([
        { $match: { reported: { $in: reportedIds }, status: { $ne: 'dismissed' } } },
        { $group: { _id: '$reported', count: { $sum: 1 } } },
      ]);
      counts.forEach(c => { reportCounts[c._id.toString()] = c.count; });
    }

    const data = reports.map(r => ({
      _id: r._id,
      reporter: {
        name: r.reporter?.name || 'Unknown',
        email: r.reporter?.email || '',
        photo: r.reporter?.photos?.[0] || '',
      },
      reported: {
        name: r.reported?.name || 'Unknown',
        email: r.reported?.email || '',
        photo: r.reported?.photos?.[0] || '',
        suspended: r.reported?.suspended || false,
        shadowbanned: !!r.reported?.shadowbannedAt,
        reportCount: reportCounts[r.reported?._id?.toString()] || 0,
      },
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
    }));

    res.json({
      data,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    console.error('Admin reports error:', err);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

router.put('/reports/bulk', async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length || !status) {
      return res.status(400).json({ message: 'ids (array) and status required' });
    }
    if (ids.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'One or more invalid report IDs' });
    }
    if (!VALID_REPORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_REPORT_STATUSES.join(', ')}` });
    }
    await Report.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );
    res.json({ message: `${ids.length} reports updated to ${status}` });
  } catch (err) {
    console.error('Admin bulk update error:', err);
    res.status(500).json({ message: 'Failed to bulk update' });
  }
});

router.put('/reports/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }

    const { status } = req.body;
    if (status && !VALID_REPORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_REPORT_STATUSES.join(', ')}` });
    }

    const update = {};
    if (status) update.status = status;

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });

    res.json({ message: 'Report updated', report });
  } catch (err) {
    console.error('Admin report update error:', err);
    res.status(500).json({ message: 'Failed to update report' });
  }
});

// ─── USERS ───
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(Number(req.query.perPage) || 15, 100);
    const { status, search } = req.query;
    const skip = (page - 1) * perPage;

    const filter = { isDeleted: false };
    if (status === 'active') { filter.suspended = false; filter.shadowbannedAt = null; }
    else if (status === 'suspended') filter.suspended = true;
    else if (status === 'shadowbanned') filter.shadowbannedAt = { $ne: null };

    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email college year gender photos suspended suspendedReason shadowbannedAt isDeleted lastActive createdAt adminNotes')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      User.countDocuments(filter),
    ]);

    const userIds = users.map(u => u._id);
    const reportCounts = {};
    if (userIds.length) {
      const counts = await Report.aggregate([
        { $match: { reported: { $in: userIds } } },
        { $group: {
          _id: '$reported',
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        } },
      ]);
      counts.forEach(c => { reportCounts[c._id.toString()] = c; });
    }

    const data = users.map(u => ({
      ...u,
      reportStats: {
        count: reportCounts[u._id.toString()]?.total || 0,
        pendingCount: reportCounts[u._id.toString()]?.pending || 0,
      },
    }));

    res.json({
      data,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-onboardingData -pushSubscription +adminNotes +suspendedReason')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const reportCount = await Report.countDocuments({ reported: user._id });
    const pendingReports = await Report.countDocuments({ reported: user._id, status: 'pending' });
    const matchCount = await Alignment.countDocuments({ users: user._id, isActive: true });

    res.json({
      ...user,
      reportStats: { count: reportCount, pendingCount: pendingReports },
      matchCount,
    });
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const { suspended, suspendedReason, shadowbanned, adminNotes } = req.body;
    const update = {};

    if (suspended !== undefined) {
      if (typeof suspended !== 'boolean') {
        return res.status(400).json({ message: 'suspended must be a boolean' });
      }
      update.suspended = suspended;
      update.suspendedAt = suspended ? new Date() : null;
      update.suspendedReason = suspended ? (suspendedReason || null) : null;
      // Revoke push on the way IN, not only on account deletion. A suspended
      // user's alignment stays `isActive: true`, so without this their counterpart
      // can keep messaging them and their lock screen keeps lighting up with the
      // message preview. Clearing it here means suspension actually stops contact
      // on suspension day — restoring `suspended: false` leaves it null, so they
      // simply re-enable notifications themselves.
      if (suspended) update.pushSubscription = null;
    }
    if (shadowbanned !== undefined) {
      if (typeof shadowbanned !== 'boolean') {
        return res.status(400).json({ message: 'shadowbanned must be a boolean' });
      }
      update.shadowbannedAt = shadowbanned ? new Date() : null;
      if (!shadowbanned) update.contentFrozen = false;
    }
    if (adminNotes !== undefined) {
      if (typeof adminNotes !== 'string') {
        return res.status(400).json({ message: 'adminNotes must be a string' });
      }
      update.adminNotes = adminNotes;
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('name email suspended suspendedReason shadowbannedAt adminNotes');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (suspended) {
      const io = req.app.get('io');
      if (io) {
        io.to(req.params.id.toString()).emit('force-disconnect', {
          reason: suspendedReason || 'Account suspended',
        });
        // Force-close every socket belonging to this user (all their devices).
        // `force-disconnect` above is emitted on their personal room, but a
        // suspended user must stop both sending and RECEIVING realtime frames —
        // otherwise "…" typing indicators and presence keep flowing. socket/chat.js
        // stores identity as `socket.user._id`, not `socket.data.userId`.
        for (const s of io.sockets.sockets.values()) {
          if (String(s.user?._id) === String(req.params.id)) {
            s.disconnect(true);
          }
        }
      }
    }

    res.json({ message: 'User updated', user });
  } catch (err) {
    console.error('Admin user update error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

router.post('/users/:id/disconnect', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(req.params.id.toString()).emit('force-disconnect', {
        reason: 'Admin forced disconnect',
      });
    }
    res.json({ message: 'Disconnect signal sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to disconnect user' });
  }
});

// ─── ANALYTICS ───
router.get('/analytics', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [dailySignups, dailyReports, dailyMatches, dailyMessages, dailyActive] = await Promise.all([
      User.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Report.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Alignment.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Message.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, deleted: false } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { isDeleted: false, lastActive: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastActive' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      dailySignups: dailySignups.map(d => ({ date: d._id, count: d.count })),
      dailyReports: dailyReports.map(d => ({ date: d._id, count: d.count })),
      dailyMatches: dailyMatches.map(d => ({ date: d._id, count: d.count })),
      dailyMessages: dailyMessages.map(d => ({ date: d._id, count: d.count })),
      dailyActive: dailyActive.map(d => ({ date: d._id, count: d.count })),
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// ─── COLLEGES ────────────────────────────────────────────────────────────
// Colleges live in the DATABASE so an operator can add a campus without a
// deploy. This is the whole reason `COLLEGE_MAP` in appData.js stopped being
// the source of truth.
//
// Two rules are enforced here rather than trusted to the UI:
//   1. At least one valid domain. A college with no domain has nothing to
//      verify an email against, so it would accept anyone.
//   2. `code` is immutable once students exist. It is the join key on every
//      user document; renaming it splits one campus into two in the data.

/** Normalise + validate a list of domains into storage form. */
const sanitiseDomains = (raw) => {
  const list = Array.isArray(raw) ? raw : String(raw || '').split(',');
  const out = [];
  for (const item of list) {
    const d = normaliseDomain(item);
    if (d && !out.includes(d)) out.push(d);
  }
  return out;
};

/* 📍 Parse a campus map position from the admin form.
 *
 * Accepts an already-paired `[lat, lng]` (how the API receives it) or the two
 * separate string fields the form posts, because an operator types "19.076" into
 * a latitude box and a comma-separated pair is awkward to validate by eye.
 *
 * Returns null for anything unusable so callers can distinguish "not supplied"
 * from "supplied and wrong" — those two need different handling: the first is
 * normal, the second is a data-entry error worth reporting.
 *
 * Rounding is deliberately NOT applied here. Campus coordinates are public
 * building locations, not user data, so they keep full precision — the privacy
 * rounding in `sanitizeLatLng` exists to protect a person's home coordinates
 * and a campus does not need it. */
const parseCollegeLatLng = (raw, rawLng) => {
  let pair = null;
  if (Array.isArray(raw)) {
    pair = raw;
  } else if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    const parts = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
    pair = rawLng !== undefined && parts.length === 1 ? [parts[0], rawLng] : parts;
  }
  if (!pair || pair.length !== 2) return null;
  const [lat, lng] = pair.map((n) => Number(n));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
};

router.get('/colleges', async (req, res) => {
  try {
    const colleges = await College.find().sort({ name: 1 }).lean();
    // Student counts come from the user index on collegeCode, so this is one
    // aggregation rather than a query per college.
    const counts = await User.aggregate([
      { $match: { collegeCode: { $nin: ['', null] } } },
      { $group: { _id: '$collegeCode', n: { $sum: 1 } } },
    ]);
    const byCode = Object.fromEntries(counts.map((c) => [c._id, c.n]));

    res.json({
      colleges: colleges.map((c) => ({
        ...c,
        studentCount: byCode[c.code] || 0,
      })),
    });
  } catch (err) {
    console.error('Admin colleges list error:', err);
    res.status(500).json({ message: 'Failed to fetch colleges' });
  }
});

router.post('/colleges', async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim().toLowerCase();
    const name = String(req.body?.name || '').trim();
    const domains = sanitiseDomains(req.body?.domains);
    const latLngFromBody = parseCollegeLatLng(req.body?.latLng);

    /* Reject a malformed coordinate pair rather than silently discarding it.
       This is an operator data-entry form, so a typo here would otherwise
       quietly leave the campus unranked by distance with nothing to indicate
       why. Absent is fine; present-and-wrong is an error. */
    if (req.body?.latLng !== undefined && req.body?.latLng !== null && req.body?.latLng !== '' && !latLngFromBody) {
      return res.status(400).json({
        message: 'Map position must be a latitude and longitude between -90/90 and -180/180',
      });
    }

    if (!/^[a-z0-9-]{2,30}$/.test(code)) {
      return res.status(400).json({ message: 'Code must be 2-30 lowercase letters, numbers or dashes' });
    }
    if (name.length < 3) {
      return res.status(400).json({ message: 'Enter the full official college name' });
    }
    if (domains.length === 0) {
      return res.status(400).json({
        message: 'Add at least one email domain. Without one, anyone could verify as a student there.',
      });
    }

    if (await College.findOne({ code })) {
      return res.status(400).json({ message: `A college with code "${code}" already exists` });
    }

    const college = await College.create({
      code,
      name,
      domains,
      city: String(req.body?.city || '').trim(),
      state: String(req.body?.state || '').trim(),
      country: String(req.body?.country || '').trim(),
      // 📍 Optional campus position for distance ranking. Validated by
      // sanitizeLatLng() and omitted entirely when blank — a college with no
      // position is fully functional, its students just sort as unknown
      // distance rather than being guessed at.
      ...(latLngFromBody ? { latLng: latLngFromBody } : {}),
      active: req.body?.active !== false,
    });

    res.status(201).json({ college: { ...college.toObject(), studentCount: 0 } });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: 'That college code is already taken' });
    }
    console.error('Admin college create error:', err);
    res.status(500).json({ message: 'Failed to create college' });
  }
});

router.put('/colleges/:code', async (req, res) => {
  try {
    const college = await College.findOne({ code: req.params.code });
    if (!college) return res.status(404).json({ message: 'College not found' });

    const studentCount = await User.countDocuments({ collegeCode: college.code });

    // The join key. Renaming it after students exist would orphan every one of
    // them onto a college that no longer exists, and split them from their peers.
    if (req.body?.code && String(req.body.code).trim().toLowerCase() !== college.code) {
      if (studentCount > 0) {
        return res.status(400).json({
          message: `Cannot change the code — ${studentCount} student(s) already use it. The code is a permanent identifier.`,
        });
      }
      college.code = String(req.body.code).trim().toLowerCase();
    }

    if (req.body?.name !== undefined) {
      const n = String(req.body.name).trim();
      if (n.length < 3) return res.status(400).json({ message: 'Enter the full official college name' });
      college.name = n;
    }

    if (req.body?.domains !== undefined) {
      const domains = sanitiseDomains(req.body.domains);
      if (domains.length === 0) {
        return res.status(400).json({ message: 'A college needs at least one email domain' });
      }
      college.domains = domains;
    }

    for (const k of ['city', 'state', 'country']) {
      if (req.body?.[k] !== undefined) college[k] = String(req.body[k]).trim();
    }

    /* 📍 Map position. Setting it to null/'' CLEARS it, which is how an operator
       removes a coordinate that was entered against the wrong campus. */
    if (req.body?.latLng !== undefined) {
      const parsed = parseCollegeLatLng(req.body.latLng);
      if (!parsed && req.body.latLng !== null && req.body.latLng !== '') {
        return res.status(400).json({
          message: 'Map position must be a latitude and longitude between -90/90 and -180/180',
        });
      }
      college.latLng = parsed ?? undefined;
    }
    if (req.body?.active !== undefined) college.active = Boolean(req.body.active);

    await college.save();
    res.json({ college: { ...college.toObject(), studentCount } });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: 'That college code is already taken' });
    }
    console.error('Admin college update error:', err);
    res.status(500).json({ message: 'Failed to update college' });
  }
});

router.delete('/colleges/:code', async (req, res) => {
  try {
    const college = await College.findOne({ code: req.params.code });
    if (!college) return res.status(404).json({ message: 'College not found' });

    // Deleting a college with students would orphan them — no college to
    // display, no domain to re-verify against. Deactivate instead: that hides
    // it from new signups and leaves existing students intact.
    const studentCount = await User.countDocuments({ collegeCode: college.code });
    if (studentCount > 0) {
      return res.status(400).json({
        message: `Cannot delete — ${studentCount} student(s) verified through this college. Deactivate it instead to stop new signups.`,
      });
    }

    await college.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin college delete error:', err);
    res.status(500).json({ message: 'Failed to delete college' });
  }
});

// ─── COLLEGE REQUESTS ────────────────────────────────────────────────────
// Students who can't find their campus submit one. They do NOT get access:
// an operator must verify the domain and add the college first.
//
// Grouped by collegeName and sorted by request count, because for a solo
// operator the count IS the priority queue — it tells you which campus has the
// most people waiting.

router.get('/college-requests', async (req, res) => {
  try {
    const requests = await CollegeRequest.find().sort({ createdAt: -1 }).lean();

    const groups = {};
    for (const r of requests) {
      const key = r.collegeName.trim();
      if (!groups[key]) {
        groups[key] = {
          collegeName: key,
          count: 0,
          city: r.city,
          state: r.state,
          country: r.country,
          domains: new Set(),
          status: r.status,
          oldest: r.createdAt,
          requesters: [],
        };
      }
      const g = groups[key];
      g.count += 1;
      // Fill blanks from later rows rather than leaving them empty.
      g.city = g.city || r.city;
      g.state = g.state || r.state;
      g.country = g.country || r.country;
      // The submitted address hints at the domain to verify. Masked in the
      // list so the queue doesn't display a wall of full addresses.
      const d = String(r.email || '').split('@')[1];
      if (d) g.domains.add(d);
      if (r.status === 'pending') g.requesters.push({
        _id: r._id,
        name: r.name,
        email: r.email.replace(/^(.{2}).*(@.*)$/, '$1•••$2'),
        createdAt: r.createdAt,
      });
    }

    const list = Object.values(groups)
      .map((g) => ({
        ...g,
        domains: [...g.domains],
        // Age of the oldest pending request — the "old requests" view is just
        // this list filtered to 30+ days, so nothing sits forgotten.
        ageDays: Math.floor((Date.now() - new Date(g.oldest).getTime()) / 86400000),
      }))
      // Most requests first: that ordering is the operator's to-do list.
      .sort((a, b) => b.count - a.count || new Date(a.oldest) - new Date(b.oldest));

    res.json({ groups: list, total: requests.length });
  } catch (err) {
    console.error('Admin college requests error:', err);
    res.status(500).json({ message: 'Failed to fetch college requests' });
  }
});

router.post('/college-requests/:id/approve', async (req, res) => {
  try {
    const request = await CollegeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const domain = String(request.email || '').split('@')[1];
    const code = String(req.body?.code || request.collegeName).trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, '').slice(0, 30);
    if (!code) return res.status(400).json({ message: 'Provide a college code' });

    const domains = sanitiseDomains(req.body?.domains || [domain]);
    if (domains.length === 0) {
      return res.status(400).json({ message: 'A college needs at least one email domain' });
    }

    // Upsert so re-approving a group the operator already added is a no-op
    // rather than a duplicate-key 500.
    const college = await College.findOneAndUpdate(
      { code },
      {
        $set: {
          name: request.collegeName,
          domains,
          city: request.city || '',
          state: request.state || '',
          country: request.country || '',
          active: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Mark every pending request for this college as approved, so the operator
    // can then press Notify once for the whole group.
    await CollegeRequest.updateMany(
      { collegeName: request.collegeName, status: 'pending' },
      { $set: { status: 'approved', collegeCode: college.code } },
    );

    res.json({ ok: true, college: { ...college.toObject(), studentCount: 0 } });
  } catch (err) {
    console.error('Admin approve request error:', err);
    res.status(500).json({ message: 'Failed to approve request' });
  }
});

router.post('/college-requests/:id/reject', async (req, res) => {
  try {
    const request = await CollegeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    await CollegeRequest.updateOne(
      { _id: request._id },
      { $set: { status: 'rejected' } },
    );
    // No email is sent on rejection, by design: a silent rejection is
    // indistinguishable from being ignored.
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin reject request error:', err);
    res.status(500).json({ message: 'Failed to reject request' });
  }
});

// Manual, explicit — never automatic. Notifying is the one moment we email an
// address someone typed into a public form, which is exactly why it must be a
// deliberate press rather than a side effect of adding the college: an operator
// who mistypes a college name would otherwise email everyone who requested it.
router.post('/college-requests/:id/notify', async (req, res) => {
  try {
    const request = await CollegeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const targets = await CollegeRequest.find(
      { collegeName: request.collegeName, status: 'approved' },
    ).lean();

    const college = request.collegeCode
      ? await College.findOne({ code: request.collegeCode })
      : null;

    let sent = 0;
    const failed = [];
    for (const r of targets) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await sendCollegeLive(r.email, college?.name || request.collegeName);
        sent += 1;
      } catch (e) {
        failed.push(r.email);
      }
    }

    await CollegeRequest.updateMany(
      { collegeName: request.collegeName, status: 'approved', notifiedAt: null },
      { $set: { notifiedAt: new Date() } },
    );

    res.json({ ok: true, sent, failed: failed.length, total: targets.length });
  } catch (err) {
    console.error('Admin notify error:', err);
    res.status(500).json({ message: 'Failed to send notifications' });
  }
});

// ─── SETTINGS ───
router.get('/settings', async (req, res) => {
  try {
    const settings = await Setting.find().lean();
    const obj = {};
    settings.forEach(s => { obj[s.key] = s.value; });
    res.json(obj);
  } catch (err) {
    console.error('Admin settings error:', err);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const entries = Object.entries(req.body || {});
    if (!entries.length) {
      return res.status(400).json({ message: 'No settings provided' });
    }
    if (entries.length > 50) {
      return res.status(400).json({ message: 'Too many settings at once' });
    }

    for (const [key, value] of entries) {
      if (!ALLOWED_SETTING_KEYS.has(key)) {
        return res.status(400).json({ message: `Unknown setting key: ${key}` });
      }
      if (key === 'shadowbanThreshold') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1000) {
          return res.status(400).json({ message: 'shadowbanThreshold must be a finite number between 0 and 1000' });
        }
      } else if (typeof value === 'string' && value.trim().length > 50) {
        return res.status(400).json({ message: `${key} must be 50 characters or fewer` });
      }
    }

    const ops = entries.map(([key, value]) =>
      Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true })
    );
    await Promise.all(ops);
    res.json({ message: 'Settings saved' });
  } catch (err) {
    console.error('Admin settings save error:', err);
    res.status(500).json({ message: 'Failed to save settings' });
  }
});

export default router;

```

### ./server/routes/alignments.js

```
import express from 'express';
import mongoose from 'mongoose';
import Alignment from '../models/Alignment.js';
import User from '../models/User.js';
import Interaction from '../models/Interaction.js';
import Block from '../models/Block.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { withFreshAge } from '../utils/age.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/** Ids the given user has blocked, or who have blocked them. */
const getBlockedUserIds = async (userId) => {
  const blocks = await Block.find({
    $or: [{ blocker: userId }, { blocked: userId }],
  }).lean();
  return blocks.map((b) =>
    b.blocker.toString() === userId.toString() ? b.blocked : b.blocker
  );
};

// @route   GET /api/alignments
// @desc    Get all active alignments for the current user with details (paginated) using Aggregation
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    // Clamped. `parseInt('-1') || 1` yields -1 (truthy), so a negative page
    // reached `$skip: -40`, which MongoDB rejects — a 500 plus a log-spam
    // vector. The limit was previously uncapped, so ?limit=1e9 went straight
    // to Mongo. admin.js already used this form.
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

    // 🚫 BLOCK FILTER — second layer behind the accept-letter check.
    //
    // This route gated only on `isActive`, and never consulted the Block
    // collection at all. A block sets `isActive: false` on the alignment, but any
    // path that flipped it back (the accept-letter route, which had no block
    // check) put a blocked chat straight back into this list for both users.
    // Filtering here means a stale/re-activated alignment can never surface a
    // block, regardless of what wrote it.
    const blockedUserIds = await getBlockedUserIds(userId);
    const blockedClause = blockedUserIds.length
      ? { users: { $not: { $in: blockedUserIds } } }
      : {};

    const query = { users: userId, isActive: true, ...blockedClause };

    const total = await Alignment.countDocuments(query);

    // SINGLE AGGREGATION PIPELINE
    // FIXED: sortDate is computed BEFORE $skip/$limit so pagination and display
    // order use the SAME key. (Old code paginated by updatedAt, then re-sorted
    // the page by sortDate — alignments could duplicate/vanish across pages.)
    const rawAlignments = await Alignment.aggregate([
      { $match: query },

      // 1. Most recent message — computed BEFORE pagination so sortDate is stable.
      //    Cheap indexed lookup ({ alignmentId: 1, createdAt: 1 } index in Message.js).
      {
        $lookup: {
          from: 'messages',
          let: { alignmentId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$alignmentId', '$$alignmentId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { text: 1, senderId: 1, createdAt: 1, readAt: 1, type: 1, mediaUrl: 1 } }
          ],
          as: 'lastMessageArr'
        }
      },
      {
        $unwind: {
          path: '$lastMessageArr',
          preserveNullAndEmptyArrays: true // Keep alignment even if no messages exist
        }
      },

      // 1b. Unread message count for this alignment (messages from other user, not read, not deleted)
      {
        $lookup: {
          from: 'messages',
          let: { alignmentId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$alignmentId', '$$alignmentId'] } } },
            { $match: { senderId: { $ne: userId }, readAt: null, deleted: false } },
            { $count: 'count' }
          ],
          as: 'unreadCountArr'
        }
      },
      {
        $addFields: {
          unreadCount: {
            $ifNull: [{ $arrayElemAt: ['$unreadCountArr.count', 0] }, 0]
          }
        }
      },

      // 2. Sort ONCE by the same key the client sees, with an _id tiebreaker for
      //    deterministic page boundaries. THEN paginate.
      { $addFields: { sortDate: { $ifNull: ['$lastMessageArr.createdAt', '$updatedAt'] } } },
      { $sort: { sortDate: -1, _id: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },

      // 3. Join the aligned user's profile (heavy lookup — AFTER pagination,
      //    so it only runs for this page's alignments)
      {
        $lookup: {
          from: 'users',
          let: { userIds: '$users' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$userIds'] } } },
            { $match: { _id: { $ne: userId } } },
            // `dob` instead of `age`: the stored age is written once at
            // onboarding and goes stale, so projecting it straight out of the
            // database shows an out-of-date number on the Matches page and the
            // chat header. withFreshAge() below derives a current age and drops
            // dob before the response — see utils/age.js. `age` is projected too
            // only as the fallback for rows with no dob.
            { $project: { name: 1, photos: 1, year: 1, dob: 1, age: 1, lastActive: 1, gender: 1, bio: 1, prompts: 1, intent: 1, interests: 1, suspended: 1, isDeleted: 1 } }
          ],
          as: 'otherUserArr'
        }
      },
      { $unwind: { path: '$otherUserArr', preserveNullAndEmptyArrays: true } },
      { $match: { otherUserArr: { $ne: null } } },

      // 4. Join the original interaction that created this alignment
      {
        $lookup: {
          from: 'interactions',
          let: { interactionId: '$unlockedByInteractionId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$interactionId'] } } },
            { $project: { targetArtifact: 1, letterContent: 1, actionType: 1 } }
          ],
          as: 'originInteraction'
        }
      },
      {
        $unwind: {
          path: '$originInteraction',
          preserveNullAndEmptyArrays: true
        }
      },

      // 5. Shape the final output to match frontend expectations
      {
        $project: {
          _id: 1,
          user: '$otherUserArr',
          lastMessage: '$lastMessageArr',
          originInteraction: 1,
          createdAt: 1,
          updatedAt: 1,
          sortDate: 1,
          unreadCount: 1,
          yourTurn: {
            $cond: {
              if: { $ifNull: ['$lastMessageArr.senderId', false] },
              then: {
                $and: [
                  { $ne: ['$lastMessageArr.senderId', userId] },
                  { $eq: [{ $ifNull: ['$lastMessageArr.readAt', null] }, null] }
                ]
              },
              else: false
            }
          }
        }
      }
    ]);

    // Age is derived from dob here rather than inside the pipeline, so the deck
    // (routes/discover.js) and this list can never disagree about someone's age.
    // `user` is the only profile object in the response, and withFreshAge()
    // strips dob so the date of birth is never sent to the client.
    const alignments = rawAlignments.map((a) => ({
      ...a,
      user: a.user ? withFreshAge(a.user) : a.user,
    }));

    res.status(200).json({
      // `matches` is the key the client reads. Three call sites — Matches.jsx:76,
      // AppShell.jsx:69 and AppShell.jsx:79/83 — all read `.matches`, and this
      // route used to send the list under `alignments` instead, so every one of
      // them resolved to `undefined`. The Matches page rendered an empty list,
      // the unread count was permanently 0, and the realtime update handlers
      // bailed on their first line (`if (!old?.matches) return old`). Mutual
      // matches were invisible to both sides.
      matches: alignments,
      // Deprecated alias, same array. Kept for one release so nothing that
      // still reads `.alignments` breaks mid-deploy. Remove once no client code
      // references it — the client's only reads of this endpoint are the three
      // above.
      alignments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching alignments' });
  }
});

// @route   DELETE /api/alignments/:id
// @desc    Unmatch/deactivate an alignment
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // isActive guard: a second (double-tap/retry) unmatch finds nothing here,
    // so it can never create duplicate permanent-archive Interactions.
    const alignment = await Alignment.findOne({
      _id: req.params.id,
      users: req.user._id,
      isActive: true,
    });

    if (!alignment) {
      return res.status(400).json({ message: 'Alignment not found or already inactive' });
    }

    alignment.isActive = false;
    await alignment.save();

    // Create permanent exclusion so they never appear in each other's Discover deck
    const otherUserId = alignment.users.find(u => u.toString() !== req.user._id.toString());
    await Interaction.create({
      actorId: req.user._id,
      targetId: otherUserId,
      actionType: 'archive',
      cooldownExpiresAt: null, // Permanent — no cooldown expiry
      origin: 'unmatch',       // Distinguishes from block archives — unblock never sweeps it
    });

    // Notify the other user
    const io = req.app.get('io');
    if (otherUserId && io) {
      io.to(otherUserId.toString()).emit('unmatch-notification', { alignmentId: alignment._id });
    }
    if (otherUserId) {
      addToQueue(() => sendPushNotification(otherUserId, {
        title: 'Unmatched',
        body: `You were unmatched by ${req.user.name}`,
      }));
    }

    res.status(200).json({ success: true, message: 'Unmatched successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing unmatch' });
  }
});

export default router;
```

### ./server/routes/auth.js

```
import express from 'express';
import { body } from '../middleware/validate.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import OTP from '../models/OTP.js';
import User from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { protect, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { APP_CONSTANTS } from '../config/appData.js';
import { sendOTP } from '../utils/email.js';
import { hashOtp, verifyOtp, normalizeEmail } from '../utils/otpHash.js';
import College from '../models/College.js';
import { emailMatchesCollege } from '../utils/collegeDomain.js';
import { isCollegeAllowed, COLLEGE_GATE_MESSAGE } from '../utils/campusGate.js';
import { verifyOtpLimiter, otpEmailLimiter, reverifyLimiter } from '../middleware/rateLimiters.js';

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
        user = await User.create({
          email,
          college: college.name,
          collegeCode: college.code,
          isVerified: true,
          isOnboarded: false,
          status: 'active',
          lastVerifiedAt: new Date(),
          reverifyDue: nextReverifyDate(),
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
          suspended: user.suspended,
          suspendedReason: user.suspendedReason,
          isDeleted: user.isDeleted,
          shadowbanScore: user.shadowbanScore || 0,
          shadowbannedAt: user.shadowbannedAt || null,
          contentFrozen: user.contentFrozen || false,
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
  try {
    const token =
      req.cookies?.[APP_CONSTANTS.AUTH_COOKIE_NAME] ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await User.findByIdAndUpdate(decoded.id, { lastLogoutAt: new Date() });
    }
  } catch {
    // Invalid/expired token — still proceed to clear the cookie
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
    res.status(200).json(fullUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

```

### ./server/routes/colleges.js

```
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
```

