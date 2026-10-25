import express from 'express';
import Notification from '../models/Notification.js';
import Interaction from '../models/Interaction.js';
import Alignment from '../models/Alignment.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { areBlocked } from '../middleware/blockFilter.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { CARD_FIELDS_SELECT, toPublicCard } from '../utils/publicCard.js';

const router = express.Router();

// @route   GET /api/notifications/vapid-key
// @desc    Get VAPID public key for push subscription
// @access  Private
router.get('/vapid-key', protect, (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({ message: 'Push notifications not configured' });
  }
  res.status(200).json({ publicKey: key });
});

// @route   POST /api/notifications/subscribe
// @desc    Save push subscription
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: subscription });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving subscription' });
  }
});

// @route   DELETE /api/notifications/subscribe
// @desc    Remove push subscription
// @access  Private
router.delete('/subscribe', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: null });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error removing subscription' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread (uncleared) notification count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user._id,
      isCleared: false,
    });
    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching unread count' });
  }
});

// @route   GET /api/notifications
// @desc    Get all notifications for the current user (paginated)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Clamped. `parseInt('-1') || 1` yields -1 (truthy), so a negative page
    // reached `$skip: -40`, which MongoDB rejects — a 500 plus a log-spam
    // vector. The limit was previously uncapped, so ?limit=1e9 went straight
    // to Mongo. admin.js already used this form.
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const filter = { recipientId: req.user._id, isCleared: false };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('senderId', `${CARD_FIELDS_SELECT} suspended isDeleted`)
      .populate('interactionRef');

    res.status(200).json({
      notifications: notifications.map((notification) => {
        const result = notification.toObject();
        const sender = result.senderId;
        if (sender) {
          result.senderId = {
            ...toPublicCard(sender),
            _id: sender._id,
            suspended: sender.suspended,
            isDeleted: sender.isDeleted,
          };
        }
        return result;
      }),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// @route   POST /api/notifications/:id/accept
// @desc    Accept an incoming letter/telegram: create the Alignment + opening letter, clear the notification
// @access  Private
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user._id,
      isCleared: false,
    }).populate('interactionRef');
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const incoming = notification.interactionRef; // actorId = original sender, targetId = me
    if (!incoming) {
      return res.status(400).json({ message: 'Notification has no linked interaction' });
    }

    const originalSender = incoming.actorId;
    const me = req.user._id;

    // 🚫 BLOCK CHECK — must come before anything mutates state.
    //
    // This route used to run no Block lookup at all. The attack: A sends B a
    // letter (creates a Notification that survives the block), B blocks A (which
    // deactivates the alignment), B later opens their inbox and taps Accept on
    // A's stale letter — and the `isActive: true` write below silently undid the
    // block. The chat reappeared in B's Matches list for both sides. Sending was
    // still refused by messages.js, so no content leaked, but the relationship
    // un-blocked itself.
    //
    // The message is deliberately indistinguishable from an unknown id, so the
    // sender cannot probe whether a specific person blocked them.
    if (await areBlocked(me, originalSender)) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if the original sender is suspended or deleted
    const senderUser = await User.findById(originalSender).select('suspended isDeleted').lean();
    if (!senderUser || senderUser.isDeleted || senderUser.suspended) {
      return res.status(410).json({ message: 'This profile is no longer available', code: 'USER_UNAVAILABLE' });
    }

    // Record my response (bypasses the daily like limit) so they're excluded from the deck
    const alreadyResponded = await Interaction.findOne({
      actorId: me,
      targetId: originalSender,
      /* 'align' added: this was the single most important line in the accept
         flow after Align shipped. Without it, someone who had ALREADY aligned
         back was treated as if they had never responded, so the accept wrote a
         second, duplicate response row every time. The match still built — the
         bug was invisible in the UI and visible only as ledger growth. */
      actionType: { $in: ['align', 'letter', 'telegram'] },
    });
    
    if (!alreadyResponded) {
      await Interaction.create({
        actorId: me,
        targetId: originalSender,
        actionType: 'accept_letter',
        letterContent: null,
        targetArtifact: null,
        cooldownExpiresAt: null,
      });
    }

    const pairKey = [me.toString(), originalSender.toString()].sort().join('__');

    // 1. ATOMIC UPSERT: Prevents duplicate key crashes if both users accept simultaneously
    const match = await Alignment.findOneAndUpdate(
      { pairKey },
      {
        $setOnInsert: {
          pairKey,
          users: [me, originalSender],
        },
        $set: {
          isActive: true,
          unlockedByInteractionId: incoming._id,
        },
      },
      { upsert: true, new: true }
    );

    // AUTO-GENERATE THE OPENING LETTER (atomic upsert — no duplicate race).
    // The partial unique index on { alignmentId, type } in Message.js enforces
    // at most ONE opening_letter per alignment at the DB level.
    const senderProfile = await User.findById(originalSender).select('photos prompts');
    let msgData = {
      alignmentId: match._id,
      senderId: originalSender,
      type: 'opening_letter',
      deliveryStatus: 'sent',
      text: incoming.letterContent || '',
    };

    const target = incoming.targetArtifact;
    if (target?.startsWith('photo_')) {
      const idx = parseInt(target.split('_')[1], 10);
      const url = senderProfile.photos?.[idx] || senderProfile.photos?.[0];
      if (url) {
        // `image` no longer written — it duplicated mediaUrl and nothing read it.
        // Readers still accept either field, so existing messages keep working.
        msgData.mediaUrl = url;
        msgData.text = incoming.letterContent || '';
      }
    } else if (target?.startsWith('prompt_')) {
      const idx = parseInt(target.split('_')[1], 10);
      const q = senderProfile.prompts?.[idx]?.question;
      if (q) {
        msgData.text = incoming.letterContent ? `"${q}"\n\n${incoming.letterContent}` : `"${q}"`;
      }
    }

    try {
      await Message.findOneAndUpdate(
        { alignmentId: match._id, type: 'opening_letter' },
        { $setOnInsert: msgData },
        { upsert: true }
      );
    } catch (err) {
      // E11000 = a concurrent request already created the opening letter.
      // That's the desired end-state, so swallow it. Anything else rethrow.
      if (err.code !== 11000) throw err;
    }

    notification.isCleared = true;
    await notification.save();

    const meUser = await User.findById(me).select(
      'name photos bio year pronouns interests prompts intent'
    );
    
    const io = req.app.get('io');
    if (io) {
      // Real-time socket ping for immediate UI update if User A has the app open
      io.to(originalSender.toString()).emit('match-notification', {
        _id: match._id,
        alignmentId: match._id,
        interactionRef: incoming._id,
        targetArtifact: incoming.targetArtifact,
        letterContent: incoming.letterContent,
        user: meUser,
      });
    }

    // 2. DOPAMINE PUSH: Fire background notification to User A's lock screen
    addToQueue(() => sendPushNotification(originalSender, {
      title: 'You have a new conversation!',
      body: `${req.user.name} accepted your letter!`,
      data: { 
        type: 'alignment', 
        alignmentId: match._id.toString() 
      },
    }));

    res.status(200).json({ success: true, alignmentId: match._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error accepting notification' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a single notification as cleared
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isCleared: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as cleared
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isCleared: false },
      { isCleared: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error marking all as read' });
  }
});

// @route   PUT /api/notifications/:id/dismiss
// @desc    Dismiss (clear) a notification
// @access  Private
router.put('/:id/dismiss', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isCleared: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error dismissing notification' });
  }
});

export default router;
