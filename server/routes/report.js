import express from 'express';
import Report from '../models/Report.js';
import Block from '../models/Block.js';
import Alignment from '../models/Alignment.js';
import User from '../models/User.js';
import Interaction from '../models/Interaction.js';
import Setting from '../models/Setting.js';
import { protect } from '../middleware/auth.js';
import { REPORT_REASONS } from '../models/Report.js';
import { destructiveActionLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();
const DEFAULT_REPORT_REVIEW_THRESHOLD = 3;

// @route   GET /api/report/reasons
// @desc    Get available report reasons
// @access  Private
router.get('/reasons', protect, (req, res) => {
  res.status(200).json({ reasons: REPORT_REASONS });
});

// @route   POST /api/report/:userId
// @desc    Report a user (flag for admin review after distinct-reporter threshold)
// @access  Private
router.post('/:userId', protect, async (req, res) => {
  const { reason, details } = req.body;
  const reportedId = req.params.userId;

  if (!reason || !REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ message: 'Valid reason is required' });
  }

  if (reportedId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot report yourself' });
  }

  try {
    const reported = await User.findById(reportedId);
    if (!reported) return res.status(404).json({ message: 'User not found' });

    const reviewThresholdSetting = await Setting.findOne({ key: 'reportReviewThreshold' }).lean();
    const reviewThreshold = reviewThresholdSetting?.value ?? DEFAULT_REPORT_REVIEW_THRESHOLD;
    if (!Number.isInteger(reviewThreshold) || reviewThreshold < 1 || reviewThreshold > 1000) {
      throw new Error('Invalid reportReviewThreshold setting');
    }

    const report = await Report.create({
      reporter: req.user._id,
      reported: reportedId,
      reason,
      details: details || '',
    });

    // Repeated reports are retained as separate moderation evidence, but only
    // distinct reporters contribute to automatic escalation.
    const activeReporterIds = await Report.distinct('reporter', {
      reported: reportedId,
      status: { $ne: 'dismissed' },
    });
    const activeReportCount = activeReporterIds.length;

    // Reports can flag an account for review, but suspension requires an admin.
    if (activeReportCount >= reviewThreshold) {
      reported.shadowbannedAt = reported.shadowbannedAt || new Date();
      reported.shadowbanScore = Math.max(reported.shadowbanScore || 0, 5);
      reported.contentFrozen = true;
      await reported.save();
    }

    res.status(201).json({ message: 'Report submitted', reportId: report._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error submitting report' });
  }
});

// @route   POST /api/block/:userId
// @desc    Block a user
// @access  Private
router.post('/block/:userId', protect, destructiveActionLimiter, async (req, res) => {
  const blockedId = req.params.userId;

  if (blockedId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot block yourself' });
  }

  try {
    const blockedUser = await User.findById(blockedId);
    if (!blockedUser) return res.status(404).json({ message: 'User not found' });

    await Block.findOneAndUpdate(
      { blocker: req.user._id, blocked: blockedId },
      { blocker: req.user._id, blocked: blockedId },
      { upsert: true, new: true }
    );

    // Deactivate any existing alignment
    const match = await Alignment.findOne({
      users: { $all: [req.user._id, blockedId] },
    });
    if (match) {
      if (match.isActive) {
        match.isActive = false;
        await match.save();
      }
    }

    // Upsert both exclusions. Preserve an existing unmatch/pass archive's origin
    // so unblocking cannot accidentally remove its permanent Discover exclusion.
    await Promise.all([
      Interaction.updateOne(
        { actorId: req.user._id, targetId: blockedId, actionType: 'archive' },
        { $setOnInsert: { cooldownExpiresAt: null, origin: 'block' } },
        { upsert: true }
      ),
      Interaction.updateOne(
        { actorId: blockedId, targetId: req.user._id, actionType: 'archive' },
        { $setOnInsert: { cooldownExpiresAt: null, origin: 'block' } },
        { upsert: true }
      ),
    ]);

    const io = req.app.get('io');
    if (io) {
      if (match) {
        const alignmentId = match._id.toString();
        io.in(alignmentId).socketsLeave(alignmentId);
        io.to(req.user._id.toString()).emit('unmatch-notification', { alignmentId });
        io.to(blockedId).emit('unmatch-notification', { alignmentId });
      } else {
        io.to(blockedId).emit('unmatch-notification', { alignmentId: null });
      }
    }

    res.status(200).json({ message: 'User blocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error blocking user' });
  }
});

// @route   DELETE /api/block/:userId
// @desc    Unblock a user
// @access  Private
router.delete('/block/:userId', protect, async (req, res) => {
  try {
    await Block.findOneAndDelete({
      blocker: req.user._id,
      blocked: req.params.userId,
    });

    // Remove permanent exclusion so they can re-encounter in Discover.
    // Only block-created archives are reversed — unmatches/passes stay permanent.
    await Interaction.deleteMany({
      origin: 'block',
      $or: [
        { actorId: req.user._id, targetId: req.params.userId, actionType: 'archive' },
        { actorId: req.params.userId, targetId: req.user._id, actionType: 'archive' },
      ],
    });
    res.status(200).json({ message: 'User unblocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error unblocking user' });
  }
});

// @route   GET /api/block/list
// @desc    Get list of blocked users
// @access  Private
router.get('/list', protect, async (req, res) => {
  try {
    const blocks = await Block.find({ blocker: req.user._id })
      .populate('blocked', 'name photos year pronouns')
      .sort({ createdAt: -1 });

    res.status(200).json({
      blocked: blocks.map((b) => ({
        _id: b.blocked._id,
        name: b.blocked.name,
        photo: b.blocked.photos?.[0],
        year: b.blocked.year,
        pronouns: b.blocked.pronouns,
        blockedAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching blocked users' });
  }
});

// 🚫 REMOVED: GET /api/report/block/status/:userId
//
// It answered a SYMMETRIC question — `{ isBlocked, iBlockedThem }` for ANY pair
// of user ids — which made it an oracle: probe any id and learn definitively that
// a block exists, and in which direction. That tells a blocked person they were
// blocked specifically, which is exactly what blocking exists to conceal (it also
// confirms the blocker is still on the platform).
//
// Nothing in the client ever called it (only POST /block/:id from Chat.jsx and
// DELETE /block/:id from Settings.jsx), so it was pure attack surface with no
// product purpose. If a UI ever needs "did *I* block this person", re-add it
// scoped to `{ blocker: req.user._id }` only — never the symmetric $or.

export default router;
