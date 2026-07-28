import express from 'express';
import Report from '../models/Report.js';
import Block from '../models/Block.js';
import Match from '../models/Match.js';
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
    const reported = await User.findById(reportedId);
    if (!reported) return res.status(404).json({ message: 'User not found' });

    const report = await Report.create({
      reporter: req.user._id,
      reported: reportedId,
      reason,
      details: details || '',
    });

    // Escalation: 3-4 reports = shadowban, 5+ = full suspension
    const reportCount = await Report.countDocuments({ reported: reportedId });
    if (reportCount >= 3 && reportCount < 5) {
      reported.isGhost = true; // Hidden from Discover, existing matches remain active
      await reported.save();
    } else if (reportCount >= 5) {
      reported.suspended = true;
      reported.suspendedAt = new Date();
      reported.suspendedReason = 'Multiple community reports';
      reported.isGhost = true;
      await reported.save();
    }

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

    // Deactivate any existing match
    const match = await Match.findOne({
      users: { $all: [req.user._id, blockedId] },
      isActive: true,
    });
    if (match) {
      match.isActive = false;
      await match.save();
    }

    // Create permanent exclusion so they never appear in each other's Discover deck
    await Interaction.create([
      { actorId: req.user._id, targetId: blockedId, actionType: 'archive', cooldownExpiresAt: null },
      { actorId: blockedId, targetId: req.user._id, actionType: 'archive', cooldownExpiresAt: null },
    ]);

    const io = req.app.get('io');
    if (io) {
      io.to(blockedId).emit('unmatch-notification', { matchId: match?._id });
    }

    // In-app (socket 'unmatch-notification') + push already notify the blocked user.
    // No Notification DB row is created — the model is purpose-built for letter interactions.
    addToQueue(() => sendPushNotification(blockedId, {
      title: 'Unmatched',
      body: `You were unmatched by ${req.user.name}`,
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

    // Remove permanent exclusion so they can re-encounter in Discover
    await Interaction.deleteMany({
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
      .populate('blocked', 'name photos branch year hostel pronouns')
      .sort({ createdAt: -1 });

    res.status(200).json({
      blocked: blocks.map((b) => ({
        _id: b.blocked._id,
        name: b.blocked.name,
        photo: b.blocked.photos?.[0],
        branch: b.blocked.branch,
        year: b.blocked.year,
        hostel: b.blocked.hostel,
        pronouns: b.blocked.pronouns,
        blockedAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching blocked users' });
  }
});

// @route   GET /api/block/status/:userId
// @desc    Check block status with a user
// @access  Private
router.get('/status/:userId', protect, async (req, res) => {
  try {
    const block = await Block.findOne({
      $or: [
        { blocker: req.user._id, blocked: req.params.userId },
        { blocker: req.params.userId, blocked: req.user._id },
      ],
    });

    res.status(200).json({
      isBlocked: !!block,
      iBlockedThem: block?.blocker?.toString() === req.user._id.toString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error checking block status' });
  }
});

export default router;
