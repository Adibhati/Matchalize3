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
