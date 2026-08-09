import express from 'express';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Interaction from '../models/Interaction.js';
import { protect } from '../middleware/auth.js';
import { computeCompatibility } from '../config/compatQuestions.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { discoverLimiter } from '../middleware/rateLimiters.js';
import { getBlockExclusionQuery } from '../middleware/blockFilter.js';
import { body } from '../middleware/validate.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
const DAY_MS = 24 * 60 * 60 * 1000;

// Shared helper for Letters and Telegrams (Superlikes)
const handleLike = async (req, res, { isSuperlike = false } = {}) => {
  const targetId = req.params.id;
  const currentUser = req.user;
  const actionType = isSuperlike ? 'seal_stamp' : 'letter';

  try {
    // 🛡️ BLOCK SELF-INTERACTION
    if (targetId === currentUser._id.toString()) {
      return res.status(400).json({ message: 'Cannot interact with yourself' });
    }

    // 1. INDEPENDENT DAILY LIMITS (7 letters/day, 1 Telegram/day)
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const dailyCount = await Interaction.countDocuments({
      actorId: currentUser._id,
      actionType,
      createdAt: { $gte: startOfDay },
    });
    const dailyLimit = isSuperlike ? 1 : 7;
    if (dailyCount >= dailyLimit) {
      return res.status(403).json({
        message: isSuperlike ? 'Out of Telegrams. Come back tomorrow.' : 'Out of letters. Come back tomorrow.',
      });
    }

    const { note, target } = req.body; 
    
    // 🛡️ BLOCK UNMATCHED USERS: Check if there's a permanent archive between us
    const permanentArchive = await Interaction.findOne({
      $or: [
        { actorId: currentUser._id, targetId, actionType: 'archive', cooldownExpiresAt: null },
        { actorId: targetId, targetId: currentUser._id, actionType: 'archive', cooldownExpiresAt: null }
      ]
    });
    if (permanentArchive) {
      return res.status(403).json({ 
        message: 'This connection has been permanently closed.',
        code: 'USER_UNMATCHED'
      });
    }
    
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. CREATE THE LEDGER ENTRY
    const letterInteraction = await Interaction.create({
      actorId: currentUser._id,
      targetId,
      actionType,
      targetArtifact: target || null,
      letterContent: note || null,
      cooldownExpiresAt: null,
    });

    // 3. CREATE INBOX NOTIFICATION
    const notification = await Notification.create({
      recipientId: targetId,
      senderId: currentUser._id,
      type: isSuperlike ? 'priority_seal' : 'new_letter',
      interactionRef: letterInteraction._id,
    });

    // 4. REAL-TIME SOCKET PING
    const io = req.app.get('io');
    if (io) {
      io.to(targetId.toString()).emit('new-letter', {
        type: isSuperlike ? 'priority_seal' : 'new_letter',
      });
    }

    // 5. BACKGROUND PUSH
    addToQueue(() => sendPushNotification(targetId, {
      title: isSuperlike ? 'Priority Telegram!' : 'New Letter!',
      body: `${currentUser.name} sent you a${isSuperlike ? ' Telegram' : ' letter'}!`,
      data: {
        type: 'notification',
        notificationId: notification._id.toString(),
        interactionId: letterInteraction._id.toString(),
      },
    }));

    // 6. CHECK FOR MUTUAL MATCH
    const isMutual = await Interaction.findOne({
      actorId: targetId,
      targetId: currentUser._id,
      actionType: { $in: ['letter', 'seal_stamp', 'accept_letter', 'accept_seal'] },
    });

    if (isMutual) {
      const pairKey = [currentUser._id.toString(), targetId.toString()].sort().join('__');

      // Atomic Upsert to prevent race conditions
      const match = await Match.findOneAndUpdate(
        { pairKey },
        {
          $setOnInsert: {
            pairKey,
            users: [currentUser._id, targetId],
          },
          $set: {
            isActive: true,
            unlockedByInteractionId: letterInteraction._id,
          },
        },
        { upsert: true, new: true }
      );

      // AUTO-GENERATE THE OPENING ICEBREAKER MESSAGE
      const senderProfile = await User.findById(currentUser._id).select('photos prompts');
      let msgData = {
        matchId: match._id,
        senderId: currentUser._id,
        type: 'opening_letter',
        text: note || '',
        deliveryStatus: 'sent',
      };

      const target = req.body.target;
      if (target?.startsWith('photo_')) {
        const idx = parseInt(target.split('_')[1], 10);
        const url = senderProfile.photos?.[idx] || senderProfile.photos?.[0];
        if (url) {
          msgData.image = url;
          msgData.mediaUrl = url;
          msgData.text = note || '';
        }
      } else if (target?.startsWith('prompt_')) {
        const idx = parseInt(target.split('_')[1], 10);
        const q = senderProfile.prompts?.[idx]?.question;
        if (q) {
          msgData.text = note ? `"${q}"\n\n${note}` : `"${q}"`;
        }
      }

      await Message.findOneAndUpdate(
        { matchId: match._id, type: 'opening_letter' },
        { $setOnInsert: msgData },
        { upsert: true }
      );

      const targetProfile = {
        _id: targetUser._id,
        name: targetUser.name,
        photos: targetUser.photos,
        bio: targetUser.bio,
        branch: targetUser.branch,
        year: targetUser.year,
        hostel: targetUser.hostel,
        pronouns: targetUser.pronouns,
        interests: targetUser.interests,
        prompts: targetUser.prompts,
        intent: targetUser.intent,
        compatScore: computeCompatibility(currentUser.compatAnswers || [], targetUser.compatAnswers || []),
      };

      if (io) {
        io.to(targetId.toString()).emit('match-notification', {
          _id: match._id,
          matchId: match._id,
          interactionRef: letterInteraction._id,
          targetArtifact: target || null,
          letterContent: note || null,
          user: targetProfile,
        });
      }

      return res.status(200).json({
        matched: true,
        ...(isSuperlike && { super: true }),
        matchId: match._id,
        user: targetProfile,
      });
    }

    res.status(200).json({ matched: false, ...(isSuperlike && { super: true }) });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: `Server error processing ${isSuperlike ? 'Telegram' : 'letter'}` });
  }
};

// @route   GET /api/discover
router.get('/', protect, async (req, res) => {
  try {
    const currentUser = req.user;
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);

    // Build exclusion set from the Interaction ledger
    const acted = await Interaction.find({
      $or: [
        { actorId: currentUser._id, actionType: { $in: ['letter', 'seal_stamp', 'accept_letter', 'accept_seal', 'archive'] } },
        { targetId: currentUser._id, actionType: 'archive' },
      ],
    }).select('actorId targetId actionType cooldownExpiresAt').lean();

    const excludedIds = new Set();
    const now = new Date();
    for (const it of acted) {
      const otherId = it.actorId.toString() === currentUser._id.toString()
        ? it.targetId.toString()
        : it.actorId.toString();
      if (it.actionType === 'archive') {
        // Permanent archive (cooldownExpiresAt === null) always excludes
        // Temporary archive only excludes while cooldown is active
        if (!it.cooldownExpiresAt || new Date(it.cooldownExpiresAt) > now) {
          excludedIds.add(otherId);
        }
      } else {
        excludedIds.add(otherId);
      }
    }

    const blockExclusion = await getBlockExclusionQuery(currentUser._id);
    const blockedIds = blockExclusion._id?.$nin || [];
    blockedIds.forEach(id => excludedIds.add(id.toString()));
    excludedIds.add(currentUser._id.toString());

    // Base filter — heavy $nin moved to Node.js memory filtering
    const baseFilter = {
      collegeCode: currentUser.collegeCode,
      isOnboarded: true,
      isVerified: true,
      suspended: { $ne: true },
      isGhost: { $ne: true },
      isDeleted: { $ne: true },
    };

    if (currentUser.interestedIn?.length > 0) {
      baseFilter.gender = { $in: currentUser.interestedIn };
    }

    // 🚀 INDEXED RANGE QUERY: Fetch candidates faster than $sample
    const randomPoint = Math.random();
    let candidates = await User.find({ ...baseFilter, randomSeed: { $gte: randomPoint } })
      .select('name photos bio branch year hostel pronouns interests prompts intent compatAnswers lastActive')
      .limit(80)
      .lean();

    // If we hit the end of the index, wrap around to 0
    if (candidates.length < limit * 2) {
      const moreCandidates = await User.find({ ...baseFilter, randomSeed: { $lt: randomPoint } })
        .select('name photos bio branch year hostel pronouns interests prompts intent compatAnswers lastActive')
        .limit(80)
        .lean();
      candidates = candidates.concat(moreCandidates);
    }

    // Filter exclusions in high-speed Node.js memory
    const eligibleBatch = candidates.filter(u => !excludedIds.has(u._id.toString()));

    // Calculate Hybrid Score
    const currentUserAnswers = currentUser.compatAnswers || [];
    const scoredUsers = eligibleBatch.map((u) => {
      const compatRaw = computeCompatibility(currentUserAnswers, u.compatAnswers || []);
      const compatScore = (compatRaw || 0) / 100;
      const hoursSinceActive = (Date.now() - new Date(u.lastActive).getTime()) / (1000 * 60 * 60);
      let recencyScore = hoursSinceActive <= 1 ? 1.0 : hoursSinceActive <= 24 ? 0.5 : 0.0;
      const hasPhotos = (u.photos || []).length >= 4;
      const hasPrompts = (u.prompts || []).length >= 3;
      const hasBio = u.bio && u.bio.length > 10;
      const completenessScore = (hasPhotos && hasPrompts && hasBio) ? 1.0 : 0.5;

      const hybridScore = (compatScore * 0.5) + (recencyScore * 0.3) + (completenessScore * 0.2);
      return { ...u, hybridScore, compatScore: Math.round(compatRaw || 0) };
    });

    scoredUsers.sort((a, b) => b.hybridScore - a.hybridScore);
    const finalDeck = scoredUsers.slice(0, limit);

    res.status(200).json({
      users: finalDeck,
      total: eligibleBatch.length,
      hasMore: eligibleBatch.length > limit,
    });
  } catch (error) {
    console.error('Discover deck error:', error);
    res.status(500).json({ message: 'Server error fetching discovery deck' });
  }
});

// Validation middleware for target artifact to prevent injection/NaN crashes
const validateTarget = [
  body('target')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^(photo|prompt)_\d+$/)
    .withMessage('Invalid target artifact format. Must be like "photo_0" or "prompt_1".'),
  validate,
];

router.post('/like/:id', protect, discoverLimiter, validateTarget, (req, res) => handleLike(req, res));
router.post('/superlike/:id', protect, discoverLimiter, validateTarget, (req, res) => handleLike(req, res, { isSuperlike: true }));

router.post('/pass/:id', protect, discoverLimiter, async (req, res) => {
  const targetId = req.params.id;
  const currentUser = req.user;

  try {
    // 🧹 ATOMIC UPSERT: Overwrites existing pass cooldowns instead of stacking duplicate rows
    await Interaction.findOneAndUpdate(
      { actorId: currentUser._id, targetId, actionType: 'archive' },
      { $set: { cooldownExpiresAt: new Date(Date.now() + 7 * DAY_MS) } },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Pass error:', error);
    res.status(500).json({ message: 'Server error processing pass' });
  }
});

router.get('/likes-you', protect, async (req, res) => {
  try {
    const currentUser = req.user;

    const incoming = await Interaction.find({
      targetId: currentUser._id,
      actionType: { $in: ['letter', 'seal_stamp', 'accept_letter', 'accept_seal'] },
    }).lean();

    const actorIds = incoming.map((i) => i.actorId);
    const myResponses = await Interaction.find({
      actorId: currentUser._id,
      targetId: { $in: actorIds },
    }).lean();
    const responded = new Set(myResponses.map((i) => i.targetId.toString()));

    const blockExclusion = await getBlockExclusionQuery(currentUser._id);
    const blockedSet = new Set((blockExclusion._id?.$nin || []).map((id) => id.toString()));

    // 1. Filter out responded/blocked IDs first to avoid fetching unnecessary users
    const validActorIds = incoming
      .filter(it => !responded.has(it.actorId.toString()) && !blockedSet.has(it.actorId.toString()))
      .map(it => it.actorId);

    // 2. SINGLE BATCHED QUERY (Fixes N+1)
    const users = validActorIds.length > 0 
      ? await User.find({ _id: { $in: validActorIds } })
          .select('name photos bio branch year hostel pronouns interests prompts intent compatAnswers gender age')
          .lean()
      : [];

    // 3. Map users to a dictionary for O(1) lookup
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // 4. Reconstruct the likesYou array with enriched data
    const likesYou = incoming
      .filter(it => userMap.has(it.actorId.toString()))
      .map(it => {
        const u = userMap.get(it.actorId.toString());
        u.compatScore = computeCompatibility(currentUser.compatAnswers || [], u.compatAnswers || []);
        u.interactionRef = it._id;
        u.targetArtifact = it.targetArtifact;
        u.letterContent = it.letterContent;
        u.interactionCreatedAt = it.createdAt;
        u.isTelegram = it.actionType === 'seal_stamp';
        return u;
      });

    // Sort Telegrams to the absolute top, then by date
    likesYou.sort((a, b) => {
      if (a.isTelegram && !b.isTelegram) return -1;
      if (!a.isTelegram && b.isTelegram) return 1;
      return new Date(b.interactionCreatedAt) - new Date(a.interactionCreatedAt);
    });

    res.status(200).json({
      users: likesYou,
      total: likesYou.length,
    });
  } catch (error) {
    console.error('Likes-you error:', error);
    res.status(500).json({ message: 'Server error fetching likes you' });
  }
});

export default router;
