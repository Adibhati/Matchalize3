import express from 'express';
import Notification from '../models/Notification.js';
import Interaction from '../models/Interaction.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = { recipientId: req.user._id, isCleared: false };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('senderId', 'name photos branch year gender hostel pronouns interests age bio prompts suspended isDeleted')
      .populate('interactionRef');

    res.status(200).json({
      notifications,
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
// @desc    Accept an incoming letter/seal: create the Match + opening letter, clear the notification
// @access  Private
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user._id,
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

    // Check if the original sender is suspended or deleted
    const senderUser = await User.findById(originalSender).select('suspended isDeleted').lean();
    if (!senderUser || senderUser.isDeleted || senderUser.suspended) {
      return res.status(410).json({ message: 'This profile is no longer available', code: 'USER_UNAVAILABLE' });
    }

    // Record my response (bypasses the daily like limit) so they're excluded from deck/likes-you
    const alreadyResponded = await Interaction.findOne({
      actorId: me,
      targetId: originalSender,
      actionType: { $in: ['letter', 'seal_stamp'] },
    });
    
    if (!alreadyResponded) {
      await Interaction.create({
        actorId: me,
        targetId: originalSender,
        actionType: incoming.actionType === 'seal_stamp' ? 'accept_seal' : 'accept_letter',
        letterContent: null,
        targetArtifact: null,
        cooldownExpiresAt: null,
      });
    }

    const pairKey = [me.toString(), originalSender.toString()].sort().join('__');

    // 1. ATOMIC UPSERT: Prevents duplicate key crashes if both users accept simultaneously
    const match = await Match.findOneAndUpdate(
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

    // AUTO-GENERATE THE OPENING LETTER (only once)
    const existingOpening = await Message.findOne({ matchId: match._id, type: 'opening_letter' });
    if (!existingOpening) {
      const senderProfile = await User.findById(originalSender).select('photos prompts');
      let msgData = {
        matchId: match._id,
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
          msgData.image = url;
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

      await Message.create(msgData);
    }

    notification.isCleared = true;
    await notification.save();

    const meUser = await User.findById(me).select(
      'name photos bio branch year hostel pronouns interests prompts intent'
    );
    
    const io = req.app.get('io');
    if (io) {
      // Real-time socket ping for immediate UI update if User A has the app open
      io.to(originalSender.toString()).emit('match-notification', {
        _id: match._id,
        matchId: match._id,
        interactionRef: incoming._id,
        targetArtifact: incoming.targetArtifact,
        letterContent: incoming.letterContent,
        user: meUser,
      });
    }

    // 2. DOPAMINE PUSH: Fire background notification to User A's lock screen
    addToQueue(() => sendPushNotification(originalSender, {
      title: 'You have a new match!',
      body: `${req.user.name} accepted your letter!`,
      data: { 
        type: 'match', 
        matchId: match._id.toString() 
      },
    }));

    res.status(200).json({ success: true, matchId: match._id });
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
