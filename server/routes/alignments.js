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