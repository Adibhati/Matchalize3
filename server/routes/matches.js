import express from 'express';
import mongoose from 'mongoose';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Interaction from '../models/Interaction.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { protect } from '../middleware/auth.js';
import { areBlocked } from '../middleware/blockFilter.js';

const router = express.Router();

// @route   GET /api/matches
// @desc    Get all active matches for the current user with details (paginated) using Aggregation
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const total = await Match.countDocuments({ users: userId, isActive: true });

    // SINGLE AGGREGATION PIPELINE (Replaces the N+1 Promise.all loop)
    const matches = await Match.aggregate([
      { $match: { users: userId, isActive: true } },
      { $sort: { updatedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        // 1. Join the matched user's profile
        $lookup: {
          from: 'users',
          let: { userIds: '$users' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$userIds'] } } },
            { $match: { _id: { $ne: userId } } },
            { $project: { name: 1, photos: 1, branch: 1, year: 1, lastActive: 1, gender: 1, hostel: 1, bio: 1, prompts: 1, intent: 1, interests: 1 } }
          ],
          as: 'otherUserArr'
        }
      },
      { $unwind: '$otherUserArr' },
      {
        // 2. Join the most recent message for this match
        $lookup: {
          from: 'messages',
          let: { matchId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$matchId', '$$matchId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { text: 1, senderId: 1, createdAt: 1, readAt: 1 } }
          ],
          as: 'lastMessageArr'
        }
      },
      {
        $unwind: {
          path: '$lastMessageArr',
          preserveNullAndEmptyArrays: true // Keep match even if no messages exist
        }
      },
      {
        // 3. Join the original interaction that created this match
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
      {
        // 4. Shape the final output to match frontend expectations
        $project: {
          _id: 1,
          user: '$otherUserArr',
          lastMessage: '$lastMessageArr',
          originInteraction: 1,
          updatedAt: 1,
          sortDate: { $ifNull: ['$lastMessageArr.createdAt', '$updatedAt'] }
        }
      },
      { $sort: { sortDate: -1 } } // Sort by last message date, or match creation date
    ]);

    res.status(200).json({
      matches,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching matches' });
  }
});

// @route   DELETE /api/matches/:id
// @desc    Unmatch/deactivate a match
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.id,
      users: req.user._id,
    });

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    match.isActive = false;
    await match.save();

    // Create permanent exclusion so they never appear in each other's Discover deck
    const otherUserId = match.users.find(u => u.toString() !== req.user._id.toString());
    await Interaction.create({
      actorId: req.user._id,
      targetId: otherUserId,
      actionType: 'archive',
      cooldownExpiresAt: null, // Permanent — no cooldown expiry
    });

    // Notify the other user
    const io = req.app.get('io');
    if (otherUserId && io) {
      io.to(otherUserId.toString()).emit('unmatch-notification', { matchId: match._id });
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

// @route   GET /api/matches/:id/icebreakers
// @desc    Get personalized ice-breaker suggestions for a match
// @access  Private
router.get('/:id/icebreakers', protect, async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.id,
      users: req.user._id,
      isActive: true,
    });

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const otherUserId = match.users.find(u => u.toString() !== req.user._id.toString());
    const otherUser = await User.findById(otherUserId).select('name interests branch year hostel compatAnswers prompts');
    const currentUser = req.user;

    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const icebreakers = [];

    // Shared interests
    const sharedInterests = (currentUser.interests || []).filter(i =>
      (otherUser.interests || []).includes(i)
    );
    if (sharedInterests.length > 0) {
      const interest = sharedInterests[0];
      icebreakers.push(`I see you're into ${interest}! What got you into it?`);
      if (sharedInterests.length > 1) {
        icebreakers.push(`We both like ${sharedInterests.join(' and ')} — what's your favorite thing about them?`);
      }
    }

    // Same hostel
    if (currentUser.hostel && otherUser.hostel && currentUser.hostel === otherUser.hostel) {
      icebreakers.push(`Fellow ${currentUser.hostel} resident! What's the best thing about living there?`);
    }

    // Same branch
    if (currentUser.branch && otherUser.branch && currentUser.branch === otherUser.branch) {
      icebreakers.push(`We're both in ${currentUser.branch}! How are you finding it so far?`);
    }

    // Prompts-based
    if (otherUser.prompts && otherUser.prompts.length > 0) {
      const prompt = otherUser.prompts[0];
      icebreakers.push(`I loved your answer about "${prompt.question}" — tell me more!`);
    }

    // Compat answers
    if (currentUser.compatAnswers?.length && otherUser.compatAnswers?.length) {
      const shared = currentUser.compatAnswers.filter(a =>
        otherUser.compatAnswers.some(b => b.question === a.question && b.answer === a.answer)
      );
      if (shared.length > 0) {
        icebreakers.push(`We matched on "${shared[0].question}" — great minds think alike!`);
      }
    }

    // Fallbacks
    const fallbacks = [
      `Hey ${otherUser.name?.split(' ')[0]}! What's the best thing that happened to you today?`,
      `If you could have any superpower for a day, what would it be?`,
      `What's your go-to comfort food after a long day?`,
      `Best chai spot on campus? I need recommendations!`,
      `What's the most interesting thing you've learned this semester?`,
    ];

    while (icebreakers.length < 3) {
      const fb = fallbacks[icebreakers.length % fallbacks.length];
      if (!icebreakers.includes(fb)) icebreakers.push(fb);
    }

    res.status(200).json({ icebreakers: icebreakers.slice(0, 5) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching icebreakers' });
  }
});

export default router;
