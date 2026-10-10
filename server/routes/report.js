import express from 'express';
import Report from '../models/Report.js';
import Block from '../models/Block.js';
import Alignment from '../models/Alignment.js';
import User from '../models/User.js';
import Interaction from '../models/Interaction.js';
import { protect } from '../middleware/auth.js';
import { REPORT_REASONS } from '../models/Report.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';

const router = express.Router();

// @route   GET /api/report/reasons
// @desc    Get available report reasons
// @access  Private
router.get('/reasons', protect, (req, res) => {
  res.status(200).json({ reasons: REPORT_REASONS });
});

// @route   POST /api/report/:userId
// @desc    Report a user (auto-suspend after 3 unique reporters)
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
    // '+suspendedReason' only lifts that field's default exclusion — the rest
    // of the document still comes back, so the escalation below does not write
    // undefined over any other field.
    const reported = await User.findById(reportedId).select('+suspendedReason');
    if (!reported) return res.status(404).json({ message: 'User not found' });

    // Dismissed-aware report: a dismissed report can be re-opened by the same
    // reporter; an active one still rejects duplicates (keeps the unique index valid).
    const existingReport = await Report.findOne({ reporter: req.user._id, reported: reportedId });
    let report;
    if (existingReport && existingReport.status === 'dismissed') {
      existingReport.reason = reason;
      existingReport.details = details || '';
      existingReport.status = 'pending';
      existingReport.createdAt = new Date();
      report = await existingReport.save();
    } else if (existingReport) {
      return res.status(409).json({ message: 'Already reported this user' });
    } else {
      report = await Report.create({
        reporter: req.user._id,
        reported: reportedId,
        reason,
        details: details || '',
      });
    }

    // Escalation: count only non-dismissed reports so admin dismissals work
    const activeReportCount = await Report.countDocuments({
      reported: reportedId,
      status: { $ne: 'dismissed' },
    });

    // Escalate only. Never auto-clear a restriction an admin applied.
    if (activeReportCount >= 5) {
      reported.suspended = true;
      reported.suspendedAt = reported.suspendedAt || new Date();
      reported.suspendedReason = reported.suspendedReason || 'Multiple community reports';
      reported.shadowbannedAt = reported.shadowbannedAt || new Date();
      reported.contentFrozen = false;
      await reported.save();
    } else if (activeReportCount >= 3) {
      reported.shadowbannedAt = reported.shadowbannedAt || new Date();
      reported.contentFrozen = true;
      await reported.save();
    }
    // activeReportCount < 3 → leave the account as an admin last set it.

    res.status(201).json({ message: 'Report submitted', reportId: report._id });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Already reported this user' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error submitting report' });
  }
});

// @route   POST /api/block/:userId
// @desc    Block a user
// @access  Private
router.post('/block/:userId', protect, async (req, res) => {
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
      isActive: true,
    });
    if (match) {
      match.isActive = false;
      await match.save();
    }

    // Create permanent exclusion so they never appear in each other's Discover deck
    await Interaction.create([
      { actorId: req.user._id, targetId: blockedId, actionType: 'archive', cooldownExpiresAt: null, origin: 'block' },
      { actorId: blockedId, targetId: req.user._id, actionType: 'archive', cooldownExpiresAt: null, origin: 'block' },
    ]);

    const io = req.app.get('io');
    if (io) {
      io.to(blockedId).emit('unmatch-notification', { alignmentId: match?._id });
    }

    // In-app (socket 'unmatch-notification') + push already notify the blocked user.
    // No Notification DB row is created — the model is purpose-built for letter interactions.
    // Deliberately does NOT name who blocked them. A named notification confirms
    // both that a block happened and that the blocker is still active on the
    // platform. A generic message keeps the block indistinguishable from an
    // ordinary unmatch.
    addToQueue(() => sendPushNotification(blockedId, {
      title: 'Matchalize',
      body: 'This conversation is no longer available.',
    }));

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
