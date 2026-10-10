# Chunk 22 — Server Routes

> Matchalize · `server-routes` · files 22 of 25 chunks · 6 file(s) · 93 KB · ~27,336 tokens
> Generated 2026-10-09 14:03.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./server/routes/messages.js`
> - `./server/routes/notifications.js`
> - `./server/routes/report.js`
> - `./server/routes/upload.js`
> - `./server/routes/users.js`
> - `./server/routes/waitlist.js`

---
### ./server/routes/messages.js

```
import express from 'express';
import mongoose from 'mongoose';
import Alignment from '../models/Alignment.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { messageLimiter } from '../middleware/rateLimiters.js';
import { getBlockDirection } from '../middleware/blockFilter.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';

const router = express.Router();

// Validate that a media URL belongs to OUR OWN upload pipeline AND to the user
// sending it. The host/folder check alone is not enough: a user can copy another
// user's media URL out of a conversation and attach it to their own message —
// then deleting that message would destroy the other person's file. Ownership is
// proven by the per-user upload folder. See utils/media.js.
const isValidMediaUrl = (url, userId) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname;
    if (!isProd && (host === 'localhost' || host === '127.0.0.1' ||
        host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('172.'))) {
      return parsed.pathname.startsWith('/uploads/') && isOwnedMediaUrl(url, userId);
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName || host !== 'res.cloudinary.com') return false;
    if (!parsed.pathname.startsWith(`/${cloudName}/`)) return false;
    if (!parsed.pathname.includes('/matchalize/photos/') ||
        !parsed.pathname.includes('/matchalize/audio/')) {
      return isOwnedMediaUrl(url, userId);
    }
    return isOwnedMediaUrl(url, userId);
  } catch {
    return false;
  }
};

// @route   GET /api/messages/:alignmentId/search
// @desc    Search full message history (must be registered before /:alignmentId)
router.get('/:alignmentId/search', protect, async (req, res) => {
  const { alignmentId } = req.params;
  const q = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);

  try {
    const match = await Alignment.findOne({ _id: alignmentId, users: req.user._id, isActive: true });
    if (!match) return res.status(403).json({ message: 'This conversation is no longer available.', code: 'CONVERSATION_GONE' });
    if (!q) return res.status(200).json({ results: [] });

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Searching `text` alone: a photo's caption has always been rendered from
    // `text`, and the separate `caption` field was never written by any route,
    // so the old `caption` branch could never match anything.
    const results = await Message.find({
      alignmentId,
      deleted: false,
      type: { $ne: 'opening_letter' },
      text: { $regex: escaped, $options: 'i' },
    }).sort({ createdAt: -1 }).limit(limit);

    res.status(200).json({ results });
  } catch (e) {
    console.error('Search messages error:', e);
    res.status(500).json({ message: 'Server error searching messages' });
  }
});

// @route   GET /api/messages/:alignmentId
// @desc    Get messages using ObjectId-Based Cursor Pagination
router.get('/:alignmentId', protect, async (req, res) => {
  const { alignmentId } = req.params;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
  const cursor = req.query.cursor;

  try {
    const match = await Alignment.findOne({
      _id: alignmentId,
      users: req.user._id,
      isActive: true,
    });

    if (!match) {
      return res.status(403).json({ message: 'This conversation is no longer available.', code: 'CONVERSATION_GONE' });
    }

    const query = { alignmentId };
    
    // 🚀 COLLISION-PROOF CURSOR: Use ObjectId sequencing instead of timestamps
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    } else if (cursor) {
      // Graceful fallback just in case an older timestamp cursor was passed
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('replyTo', 'text senderId type mediaUrl deleted');

    await Message.updateMany(
      { alignmentId, senderId: { $ne: req.user._id }, readAt: null },
      { $set: { readAt: new Date(), deliveryStatus: 'read' } }
    ).exec();

    const nextCursor = messages.length === limit ? messages[messages.length - 1]._id : null;

    res.status(200).json({
      messages: messages.reverse(), 
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// @route   POST /api/messages/:alignmentId
router.post('/:alignmentId', protect, messageLimiter, async (req, res) => {
  const { alignmentId } = req.params;
  const { text, type, image, replyTo, mediaUrl, caption, clientMsgId } = req.body;

  const hasMedia = (type === 'image' || type === 'audio') && mediaUrl;
  if (!hasMedia && (!text || text.trim() === '')) {
    return res.status(400).json({ message: 'Message cannot be empty' });
  }

  if (mediaUrl && !isValidMediaUrl(mediaUrl)) {
    return res.status(400).json({ message: 'Invalid media URL' });
  }

  if (text && text.length > 5000) {
    return res.status(400).json({ message: 'Message too long (max 5000 characters)' });
  }

  try {
    const match = await Alignment.findOne({
      _id: alignmentId,
      users: req.user._id,
      isActive: true,
    });

    if (!match) return res.status(403).json({ message: 'This conversation is no longer available.', code: 'CONVERSATION_GONE' });

    const otherUserId = match.users.find(u => u.toString() !== req.user._id.toString());
    if (otherUserId) {
      const direction = await getBlockDirection(req.user._id, otherUserId);
      if (direction === 'you_blocked_them') {
        // G2c — state the rule, no blame, and hand the client the id so its
        // "Unblock" action can act. (Old copy: "Cannot send messages to this user".)
        return res.status(403).json({
          message: "You can't message someone you've blocked.",
          code: 'YOU_BLOCKED',
          blockedUserId: otherUserId.toString(),
        });
      }
      if (direction === 'they_blocked_you') {
        // G2d — never reveal a block to the person who was blocked.
        return res.status(403).json({
          message: 'This conversation is no longer available.',
          code: 'CONVERSATION_GONE',
        });
      }
    }

    // IDEMPOTENCY CHECK: Prevent duplicate messages from network retries
    if (clientMsgId) {
      const existingMsg = await Message.findOne({ clientMsgId });
      if (existingMsg) {
        return res.status(200).json(existingMsg);
      }
    }

    if (replyTo) {
      const replyMsg = await Message.findOne({ _id: replyTo, alignmentId });
      if (!replyMsg) return res.status(400).json({ message: 'Reply target not found' });
    }

    const ALLOWED_TYPES = ['text', 'image', 'audio'];
    const safeType = ALLOWED_TYPES.includes(type) ? type : 'text';

    const messageData = {
      alignmentId,
      senderId: req.user._id,
      type: safeType,
    };

    if (text && text.trim()) messageData.text = text.trim();
    if (mediaUrl) messageData.mediaUrl = mediaUrl;
    // `image` is no longer written here — it was a byte-for-byte duplicate of
    // mediaUrl that nothing read. Readers still accept either field
    // (`mediaUrl || image`) so existing messages keep rendering.
    // `caption` is no longer written — it was a dead field. The client never
    // sent it and never read it; the caption under a photo has always been
    // rendered from `text` (see MessageBubble.jsx → PolaroidCard). Kept in the
    // schema as deprecated so existing documents still load cleanly.
    if (replyTo) messageData.replyTo = replyTo;
    if (clientMsgId) messageData.clientMsgId = clientMsgId;

    let message;
    try {
      message = await Message.create(messageData);
    } catch (err) {
      if (err.code === 11000 && clientMsgId) {
        const existing = await Message.findOne({ clientMsgId });
        if (existing) return res.status(200).json(existing);
      }
      throw err;
    }
    const populated = await Message.findById(message._id).populate('replyTo', 'text senderId type mediaUrl deleted');

    match.updatedAt = new Date();
    await match.save();

    const io = req.app.get('io');
    
    // 🌐 MULTI-DEVICE BROADCAST: Send to the alignment room so ALL devices of sender & receiver update instantly
    if (io) {
      io.to(alignmentId.toString()).emit('new-message', populated);
      // Also emit to recipient's personal room for live badge on any tab
      if (otherUserId) {
        io.to(otherUserId.toString()).emit('new-message', {
          alignmentId: alignmentId.toString(),
        });
      }
    }

    if (otherUserId) {
      const sender = await User.findById(req.user._id).select('name');
      addToQueue(() => sendPushNotification(otherUserId, {
        title: sender?.name || 'New Message',
        body: type === 'audio' ? '🎙️ Sent a voice memo' : type === 'image' ? '📷 Sent a photograph' : (text || '').slice(0, 100),
        data: { type: 'message', alignmentId: alignmentId.toString() },
      }));
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

const ALLOWED_REACTION_EMOJIS = new Set(['❤️', '😂', '🔥', '👍', '😲', '😢']);

router.post('/:alignmentId/reaction', protect, messageLimiter, async (req, res) => {
  // messageLimiter (30/10min) was missing here while its sibling POST
  // /:alignmentId already had it. Reactions are one emoji per tap, so an
  // unbounded endpoint just invites tap-spam against someone's messages.
  const { alignmentId } = req.params;
  const { msgId, emoji } = req.body;

  if (!ALLOWED_REACTION_EMOJIS.has(emoji)) {
    return res.status(400).json({ message: 'Invalid reaction emoji' });
  }

  try {
    const match = await Alignment.findOne({ _id: alignmentId, users: req.user._id, isActive: true });
    if (!match) return res.status(403).json({ message: 'Unauthorized' });

    const message = await Message.findOne({ _id: msgId, alignmentId });
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // A deleted message is a tombstone: body, media and reactions are all
    // scrubbed, so there is nothing left to react to. This route used to accept
    // reactions here, which meant anyone could re-populate a removed message's
    // reactions after the fact — and they'd render under "This artifact was
    // removed." Reported as 404 to match the not-found case above rather than
    // leaking that the tombstone exists.
    if (message.deleted) return res.status(404).json({ message: 'Message not found' });

    const existingIdx = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingIdx > -1) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions = message.reactions.filter((r) => r.user.toString() !== req.user._id.toString());
      message.reactions.push({ emoji, user: req.user._id });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(alignmentId.toString()).emit('reaction-update', { msgId: message._id, reactions: message.reactions });
    }

    res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error reacting' });
  }
});

router.delete('/:alignmentId/:msgId', protect, async (req, res) => {
  const { alignmentId, msgId } = req.params;
  try {
    const match = await Alignment.findOne({ _id: alignmentId, users: req.user._id, isActive: true });
    if (!match) return res.status(403).json({ message: 'Unauthorized' });

    const message = await Message.findOne({ _id: msgId, alignmentId });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Can only delete your own messages' });

    // 🧹 CLOUDINARY WIPE: If the message contained a photo or voice note, vaporize it from cloud storage!
    if (message.mediaUrl || message.image) {
      deleteCloudinaryFile(message.mediaUrl || message.image, req.user._id);
    }

    message.deleted = true;
    message.text = '';
    message.image = '';
    message.mediaUrl = '';
    // Reactions are scrubbed too. They used to survive deletion, which left
    // someone else's emoji permanently attached to a message that now reads
    // "This artifact was removed." Clearing them here is only meaningful
    // alongside the `deleted` guard on the reaction route, which stops new ones
    // arriving afterwards.
    message.reactions = [];
    // `replyTo` and `clientMsgId` are intentionally left alone: replyTo is
    // structural (other messages point at this one, and wiping it would break
    // their reply previews), and clientMsgId is the idempotency key that stops a
    // retried send creating a duplicate.
    await message.save();

    const io = req.app.get('io');
    if (io) io.to(alignmentId.toString()).emit('message-deleted', { msgId: message._id });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting message' });
  }
});

export default router;

```

### ./server/routes/notifications.js

```
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
      .populate('senderId', 'name photos year gender pronouns interests age bio prompts suspended isDeleted')
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

```

### ./server/routes/report.js

```
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

```

### ./server/routes/upload.js

```
import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

const ALLOWED_MIME = /^image\/(jpeg|png|webp)$|^audio\/(mpeg|mp4|webm|ogg|x-m4a)$/;
const ALLOWED_EXT = /\.(jpe?g|png|webp|mp3|m4a|mp4|webm|ogg)$/i;
const fileFilter = (req, file, cb) => {
  if (ALLOWED_EXT.test(file.originalname) && ALLOWED_MIME.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only jpg/png/webp images and mp3/m4a/webm/ogg audio are allowed.'), false);
  }
};

let upload;

if (isCloudinaryConfigured) {
  const { v2: cloudinary } = await import('cloudinary');
  const { CloudinaryStorage } = await import('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isAudio = file.mimetype.startsWith('audio/');
      // Per-user folder: the URL is the only durable proof of who owns a file
      // (one Cloudinary account holds everyone's media), so the uploader's id
      // must be part of the path. See utils/media.js.
      return {
        folder: isAudio
          ? `matchalize/audio/${req.user._id}`
          : `matchalize/photos/${req.user._id}`,
        allowed_formats: isAudio
          ? ['mp3', 'mp4', 'm4a', 'webm', 'ogg']
          : ['jpg', 'jpeg', 'png', 'webp'],
        ...(isAudio ? {} : {
          transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
        }),
      };
    },
  });

  upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
} else {
  const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.user._id}-${Date.now()}${ext}`);
    },
  });

  upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
}

const router = express.Router();

router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const url = isCloudinaryConfigured
      ? req.file.path
      : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

/**
 * 🔐 CLOUDINARY MODERATION WEBHOOK
 *
 * Cloudinary POSTs here whenever an uploaded asset's moderation status is
 * decided. If it was REJECTED, the asset is destroyed immediately — the whole
 * point is that flagged content never sits in your bucket.
 *
 * AUTHENTICATION: Cloudinary signs each request with
 *   SHA1(rawBody + x-cld-timestamp + CLOUDINARY_API_SECRET)
 * so an attacker cannot forge one without your API secret, which makes the
 * `{ force: true }` destroy below safe. (Force exists because there is no user
 * to check folder ownership against — the URL came from Cloudinary, not a
 * client.)
 *
 * ⚠️ The signature covers the RAW bytes, so this route needs an unparsed body.
 * The `express.raw()` registration lives in index.js, ABOVE the global
 * express.json(), because body-parser refuses to re-parse a request it has
 * already consumed. See the note there — getting that order wrong made this
 * endpoint return 401 for every request and the cleanup never ran once.
 *
 * Rejection is always answered 200 (never 4xx): a non-2xx makes Cloudinary
 * retry, and a retry re-runs the destroy. Only a malformed request gets 400.
 */
router.post('/moderation-status', async (req, res) => {
  const timestamp = req.headers['x-cld-timestamp'];
  const signature = req.headers['x-cld-signature'];
  if (!timestamp || !signature) return res.status(401).json({ message: 'Missing signature' });

  // Defensive: if the raw parser above were ever removed or reordered, req.body
  // would be a parsed object and the digest below would silently never match.
  // Fail loudly instead of quietly 401-ing forever.
  if (!Buffer.isBuffer(req.body)) {
    console.error(
      '[moderation-status] req.body is not a Buffer — the express.raw() registration in index.js must come BEFORE express.json()'
    );
    return res.status(500).json({ message: 'Webhook body was not received raw' });
  }
  const body = req.body.toString();

  // Replay guard: the signature is valid forever without this, so an observed
  // request could be replayed indefinitely. Cloudinary's own docs recommend
  // rejecting stale timestamps. Retries are seconds apart, so a 1h window is
  // generous while still bounding exposure.
  const ts = Number(timestamp);
  const ageMs = Date.now() - ts * 1000;
  if (!Number.isFinite(ts) || ageMs > 3600_000) {
    return res.status(401).json({ message: 'Stale signature' });
  }

  const expected = crypto
    .createHash('sha1')
    .update(body + timestamp + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  // Constant-time compare: a plain !== leaks how many leading characters matched
  // through response timing. Cheap to do correctly, so do it.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  try {
    const payload = JSON.parse(body);
    const status = payload?.moderation?.[0]?.status;
    const url = payload?.secure_url || payload?.url;

    if (status === 'rejected' && url) {
      deleteCloudinaryFile(url, null, { force: true })
        .then(() => res.status(200).json({ received: true }))
        .catch((err) => {
          console.error('Moderation cleanup failed:', err);
          res.status(200).json({ received: true });
        });
      return;
    }
    res.status(200).json({ received: true });
  } catch {
    res.status(400).json({ message: 'Bad payload' });
  }
});

export default router;

```

### ./server/routes/users.js

```
import express from 'express';
import { body } from '../middleware/validate.js';
import User from '../models/User.js';
import DiscoverSession from '../models/DiscoverSession.js';
import Alignment from '../models/Alignment.js';
import Block from '../models/Block.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import Analytics from '../models/Analytics.js';
import { protect, clearAuthCookie } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';
import { isOwnedMediaUrl, isAcceptableMediaUrl } from '../utils/media.js';
import { computeAgeFromDob } from '../utils/age.js';
import { sanitizeLatLng, isFreshLocation, haversineKm, LOCATION_DRIFT_KM } from '../utils/geo.js';
import { computeScore, MAX_PHOTOS, MAX_PROMPTS } from '../utils/ladder.js';
import OTP from '../models/OTP.js';
import { resolveCollege } from './auth.js';
import College from '../models/College.js';
import { verifyOtp, normalizeEmail } from '../utils/otpHash.js';
import { toPublicCard } from '../utils/publicCard.js';
import { GENDERS, INTENTS, DEPRECATED_INTENTS, INTEREST_TAGS, APP_CONSTANTS } from '../config/appData.js';

const router = express.Router();

// Prompt answer/question length bounds. Mirrored by `maxLength` on the two client
// textareas (Onboarding.jsx, Profile.jsx) and enforced in the schema as a
// backstop. Keep all three in sync.
const PROMPT_LIMITS = { question: 200, answer: 300 };

/**
 * Normalise a submitted `interests` array.
 *
 * Caps to MAX_INTERESTS and drops anything that is not actually in
 * INTEREST_TAGS. Both halves matter: the cap is enforced HERE rather than
 * trusted from the client (a client-side cap is a UI affordance, not a
 * constraint), and the tag check stops a crafted request from stuffing
 * arbitrary strings into a field that renders on other people's cards.
 *
 * Order is preserved and duplicates removed — the client renders them in the
 * order chosen, which is part of what the selection means.
 */
const normaliseInterests = (raw) => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const value of raw) {
    if (typeof value !== 'string') continue;
    const tag = INTEREST_TAGS.includes(value) ? value : null;
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= APP_CONSTANTS.MAX_INTERESTS) break;
  }
  return out;
};

/**
 * Normalise a submitted `intent` array, mapping any retired value forward.
 *
 * The mapping is the important part. Without it, a profile saved before the
 * "Study Buddy" → "Activity Partner" rename keeps the old string forever, which
 * is still a valid-looking value, so validation passes and the profile silently
 * stops matching anyone who picked the new name. Mapping on write means even an
 * untouched profile heals the next time its owner saves.
 *
 * ⚠️ NO LENGTH CAP. This used to stop at APP_CONSTANTS.MAX_INTENTS (2), on the
 * argument that a profile claiming everything stops discriminating. That
 * argument does not survive having only three options — holding all three is
 * nearly the same as saying "no preference", which is honest — and the cap had a
 * cost of its own: a genuinely open person had to lie about one, and a user who
 * tapped a third chip and watched it not stick had no way to tell that from a
 * bug. All three may now be held. Ranking still benefits from naming one, so the
 * signal is preserved where it is actually useful.
 *
 * Duplicates are still collapsed: mapping "Study Buddy" and "Activity Partner"
 * onto the same value would otherwise store the same intent twice. */
const normaliseIntent = (raw) => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const value of raw) {
    if (typeof value !== 'string') continue;
    const mapped = DEPRECATED_INTENTS[value] || value;
    if (!INTENTS.includes(mapped) || seen.has(mapped)) continue;
    seen.add(mapped);
    out.push(mapped);
  }
  return out;
};

/**
 * The limits the USER SCHEMA enforces, mirrored here so over-length input
 * produces a legible 400 instead of a 500.
 *
 * Why this must exist: Mongoose throws a ValidationError on `.save()`, and these
 * routes' generic `catch` turns ANY thrown error into "Server error updating
 * profile". So a user who typed a 70-character name was told the server broke,
 * then had no idea why shortening it worked. Six fields had this problem.
 *
 * ⚠️ Keep in sync with the maxlength values in models/User.js. If you change one
 * there, change it here — a mismatch means the schema is the only thing enforcing
 * the field, which reintroduces the 500.
 */
const FIELD_LIMITS = {
  name: 60,
  pronouns: 30,
  year: 40,
  bio: 160,
};

/** Human-readable field labels for the error message. */
const FIELD_LABELS = {
  name: 'Name',
  pronouns: 'Pronouns',
  year: 'Year',
  bio: 'Bio',
};

/**
 * @returns {string|null} an error message, or null when everything is in bounds
 */
const validateFieldLengths = (body) => {
  for (const [field, max] of Object.entries(FIELD_LIMITS)) {
    const value = body?.[field];
    // Only string values are checked; absent/optional fields are skipped, and a
    // non-string is left to the schema to reject.
    if (typeof value !== 'string') continue;
    if (value.length > max) {
      return `${FIELD_LABELS[field]} must be ${max} characters or fewer.`;
    }
  }
  return null;
};

// The complete set of accepted `interestedIn` values. GENDERS is the canonical
// list served to the client (routes/config.js:37); 'Everyone' is the opt-out
// that discover.js filters out at :272, and is what Onboarding.jsx offers.
const INTERESTED_IN_VALUES = [...GENDERS, 'Everyone'];

/**
 * Validate the "show me" preference list.
 *
 * Why this must exist: the field had NO validation at all — not a whitelist, not
 * a type check, not a length cap — and the schema is a bare [String]. The failure
 * mode is silent and permanent: discover.js:272 builds `{ gender: { $in: myGenders } }`
 * from whatever is stored. A single unrecognised value ('everyone' with the wrong
 * case, 'Other ' with a trailing space) matches zero profiles, so the user's deck
 * is permanently empty with no error, no explanation, and no way to diagnose it
 * from the UI. Worse, `interestedIn: {}` is a Mongoose CastError → 500.
 *
 * @returns {string|null} error message, or null when valid
 */
const validateInterestedIn = (value) => {
  if (value === undefined) return null;
  if (!Array.isArray(value)) {
    return 'Gender preference must be a list.';
  }
  if (value.length === 0) return null;
  for (const pref of value) {
    if (typeof pref !== 'string') {
      return 'Gender preference must be a list of text values.';
    }
    if (!INTERESTED_IN_VALUES.includes(pref)) {
      return `"${pref}" is not a valid gender preference. Choose from: ${INTERESTED_IN_VALUES.join(', ')}.`;
    }
  }
  return null;
};

const validatePromptLengths = (prompts) => {
  for (const p of prompts) {
    const answer = typeof p?.answer === 'string' ? p.answer : '';
    if (answer.length > PROMPT_LIMITS.answer) {
      return `Prompt answers must be ${PROMPT_LIMITS.answer} characters or fewer.`;
    }
    const question = typeof p?.question === 'string' ? p.question : '';
    if (question.length > PROMPT_LIMITS.question) {
      return `Prompt questions must be ${PROMPT_LIMITS.question} characters or fewer.`;
    }
  }
  return null;
};

// Helper to collect all photo URLs (profile photos, bio photo, prompt attachments) from a user document
const collectUserPhotos = (u) => {
  const urls = new Set();
  if (u.photos && Array.isArray(u.photos)) u.photos.forEach(url => url && urls.add(url));
  if (u.bioPhoto) urls.add(u.bioPhoto);
  if (u.prompts && Array.isArray(u.prompts)) {
    u.prompts.forEach(p => p.photoUrl && urls.add(p.photoUrl));
  }
  return urls;
};

// Validate a profile image URL.
// Beyond shape/host checks, the file must be one THIS user uploaded (or a
// read-only Unsplash placeholder). A bare host check is not enough: photos are
// public in Discover, so any user can copy someone else's URL into their own
// profile — and saving/swapping/deleting it would then destroy their file.
const isValidImageUrl = (url, userId) => {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);

    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && parsed.protocol !== 'https:') return false;

    const hostname = parsed.hostname;

    if (!isProd && (
      hostname === 'localhost' || 
      hostname === '127.0.0.1' ||
      hostname.startsWith('10.') || 
      hostname.startsWith('192.168.') || 
      hostname.startsWith('172.')
    )) {
      // Dev disk fallback: filenames are <userId>-<timestamp>.<ext>
      return /\.(jpg|jpeg|png|webp)$/i.test(parsed.pathname) && isOwnedMediaUrl(url, userId);
    }

    const trustedHosts = [
      'res.cloudinary.com',
      'images.unsplash.com',
    ];

    const isTrusted = trustedHosts.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );

    if (!isTrusted) return false;
    if (!/\.(jpg|jpeg|png|webp)$/i.test(parsed.pathname)) return false;

    // OWNERSHIP: your own upload, or an Unsplash placeholder we can never delete.
    return isAcceptableMediaUrl(url, userId);
  } catch {
    return false;
  }
};

// @route   POST /api/users/setup
// @desc    Complete onboarding registration
router.post(
  '/setup',
  protect,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('age').isInt({ min: 18, max: 40 }).withMessage('Must be between 18 and 40'),
    body('dob').isISO8601().withMessage('Date of birth is required and must be a valid date'),
    body('gender').notEmpty().withMessage('Gender is required'),
    body('year').notEmpty().withMessage('Year is required'),
    body('graduatingYear')
      .optional({ nullable: true })
      .isInt({ min: new Date().getFullYear(), max: new Date().getFullYear() + 10 })
      .withMessage('Enter a graduation year between now and the next 10 years'),
    body('intent').custom((val) => {
      if (Array.isArray(val)) return val.length > 0;
      return typeof val === 'string' && val.trim() !== '';
    }).withMessage('At least one connection intent is required'),
  ],
  validate,
  async (req, res) => {
    const {
      name, gender, pronouns, year, bio, bioPhoto,
      prompts, photos, intent, interestedIn, interests, dob,
      graduatingYear, currentLatLng,
    } = req.body;

    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (user.contentFrozen) {
        return res.status(403).json({
          message: 'Edits are paused while your account is under review.',
          code: 'CONTENT_FROZEN',
        });
      }

      // VALIDATION: Check image URLs
      const photosToSave = (Array.isArray(photos) ? photos : []).filter(Boolean).slice(0, MAX_PHOTOS);
      if (!photosToSave.every(p => isValidImageUrl(p, req.user._id))) {
        return res.status(400).json({ message: 'One or more photo URLs are invalid.' });
      }

      // bioPhoto used to be assigned with NO validation at all, so it was the
      // easiest way to plant someone else's photo URL on a profile.
      if (bioPhoto && !isValidImageUrl(bioPhoto, req.user._id)) {
        return res.status(400).json({ message: 'Bio photo URL is invalid.' });
      }

      const promptsToSave = Array.isArray(prompts) ? prompts.slice(0, MAX_PROMPTS) : [];
      if (promptsToSave.some(p => p.photoUrl && !isValidImageUrl(p.photoUrl, req.user._id))) {
        return res.status(400).json({ message: 'One or more prompt photo URLs are invalid.' });
      }
      const promptLengthError = validatePromptLengths(promptsToSave);
      if (promptLengthError) return res.status(400).json({ message: promptLengthError });

      const setupLengthError = validateFieldLengths(req.body);
      if (setupLengthError) return res.status(400).json({ message: setupLengthError });

      const setupInterestedInError = validateInterestedIn(interestedIn);
      if (setupInterestedInError) return res.status(400).json({ message: setupInterestedInError });

      const oldPhotos = collectUserPhotos(user);

      user.name = name;
      // Server-side age computation — never trust client-supplied age
      const dobDate = new Date(dob);
      const computedAge = computeAgeFromDob(dobDate);
      if (!Number.isFinite(computedAge) || computedAge < 18 || computedAge > 40) {
        return res.status(400).json({ message: 'Must be between 18 and 40' });
      }
      user.age = computedAge;
      user.dob = dobDate;
      user.gender = gender;
      user.pronouns = pronouns || '';
      user.year = year;
      user.graduatingYear = Number.isFinite(graduatingYear) ? graduatingYear : user.graduatingYear;
      user.bio = bio || '';
      user.bioPhoto = bioPhoto || '';
      user.prompts = promptsToSave;
      user.photos = photosToSave;
      user.intent = normaliseIntent(intent);
      user.interestedIn = interestedIn || [];
      user.interests = normaliseInterests(interests);
      user.isOnboarded = true;

      /* 📍 Location from the onboarding step, which now REQUIRES an answer:
         either a granted reading or an explicit pick of the campus fallback.

         A reading is rounded here, on the server, so the precise value never
         reaches the database — see the full note on PUT /api/users/location. */
      if (currentLatLng !== undefined && currentLatLng !== null) {
        const clean = sanitizeLatLng(currentLatLng);
        /* Still not an error on a MALFORMED pair — onboarding must not fail
           over a bad coordinate, and a broken client should not strand someone
           mid-signup. The fallback below is what keeps the ranking basis
           defined either way. */
        if (clean) {
          user.currentLatLng = clean;
          user.locationSource = 'gps';
          user.locationUpdatedAt = new Date();
        } else {
          user.locationSource = 'campus';
        }
      } else {
        /* No reading offered, or the user declined. Record the deliberate
           campus choice explicitly rather than leaving `locationSource` null,
           because null previously meant three different things — "declined",
           "never asked", and "onboarding predates the question" — and the feed's
           fallback notice can only be honest if it can tell them apart.

           Nothing is stored positionally here: a campus-backed user has NO
           coordinates, and the discover pipeline resolves their college's
           coordinates at query time (see the candidate-position block in
           routes/discover.js). Storing a copy would freeze them at signup and
           make a later college change look like a stale location. */
        user.locationSource = 'campus';
      }

      // Ladder: last write before save, so one document never carries a score
      // that disagrees with its own fields.
      user.profileScore = computeScore(user);

await user.save();

    broadcastProfileUpdate(req, user);


      // 🧹 VAPORIZE ORPHANED PHOTOS: Delete any old photo that isn't in the new profile
      const newPhotos = collectUserPhotos(user);
      oldPhotos.forEach(url => {
        if (!newPhotos.has(url)) deleteCloudinaryFile(url, req.user._id);
      });

      // ANALYTICS: Track completion
      await Analytics.create({ user: req.user._id, event: 'ONBOARDING_COMPLETE', step: 8 });

      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during onboarding setup' });
    }
  }
);

// @route   GET /api/users/profile
// @desc    Get user's own profile
// @access  Private
/* ── LIVE DECK UPDATE ──────────────────────────────────────────────────────
   Broadcast so any deck currently showing this person's card repaints without
   waiting for a refetch.

   Without it an edit is only visible the next time a viewer happens to fetch
   that profile — and the deck serves a localStorage snapshot on return, so
   "next time" can be never. Two people editing and reviewing each other is the
   normal loop here, so a stale card reads as "my save didn't work".

   Broadcast rather than per-user: the payload is exactly the public card
   projection (utils/publicCard.js — the SAME helper routes/discover.js uses, so
   the campus badge cannot leak down a path the deck already closes), and every
   client ignores ids it isn't showing. Tracking who might hold you in their
   deck would need a reverse index that isn't worth it for a payload this small.

   `profileScore` rides along so a card's own score refreshes. The viewer's own
   gate is unaffected: it reads /auth/me, not this. */
function broadcastProfileUpdate(req, user) {
  try {
    const io = req.app.get('io');
    if (io) io.emit('profile-updated', { ...toPublicCard(user), _id: user._id.toString() });
  } catch (err) {
    // Never fail a save because the realtime path is unhappy — a 500 here would
    // lose the user's actual edits. The next refetch still converges.
    console.error('profile-updated broadcast failed:', err.message);
  }
}

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile details
// @access  Private
router.put('/profile', protect, async (req, res) => {
    const {
    name,
    gender,
    pronouns,
    year,
    bio,
    bioPhoto,
    prompts,
    photos,
    intent,
    interestedIn,
    interests,
    graduatingYear,
    showCollege,
    gapYear,
  } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.contentFrozen) {
      return res.status(403).json({
        message: 'This feature is temporarily unavailable. Contact support@matchalize.com',
        code: 'CONTENT_FROZEN',
      });
    }

    const lengthError = validateFieldLengths(req.body);
    if (lengthError) return res.status(400).json({ message: lengthError });

    const interestedInError = validateInterestedIn(interestedIn);
    if (interestedInError) return res.status(400).json({ message: interestedInError });

    const oldPhotos = collectUserPhotos(user);

    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (pronouns !== undefined) user.pronouns = pronouns;
    if (year) user.year = year;
    if (graduatingYear !== undefined && graduatingYear !== null && graduatingYear !== '') {
      const y = Number(graduatingYear);
      // Clamped to the same window the signup validator uses: a graduating year
      // is a user-asserted signal about enrolment, so it must at least be
      // plausible. Never trusted to be proof — the annual re-check is.
      const currentYear = new Date().getFullYear();
      if (!Number.isFinite(y) || y < currentYear || y > currentYear + 10) {
        return res.status(400).json({
          message: `Enter a graduation year between ${currentYear} and ${currentYear + 10}.`,
        });
      }
      user.graduatingYear = y;
    }
    if (bio !== undefined) user.bio = bio;
    if (prompts) {
      const promptsToSave = Array.isArray(prompts) ? prompts.slice(0, MAX_PROMPTS) : [];
      if (promptsToSave.some(p => p.photoUrl && !isValidImageUrl(p.photoUrl, req.user._id))) {
        return res.status(400).json({ message: 'One or more prompt photo URLs are invalid.' });
      }
      const promptLengthError = validatePromptLengths(promptsToSave);
      if (promptLengthError) return res.status(400).json({ message: promptLengthError });
      user.prompts = promptsToSave;
    }
    if (photos) {
      const photosToSave = (Array.isArray(photos) ? photos : []).filter(Boolean).slice(0, MAX_PHOTOS);
      if (!photosToSave.every(p => isValidImageUrl(p, req.user._id))) {
        return res.status(400).json({ message: 'One or more photo URLs are invalid.' });
      }
      user.photos = photosToSave;
    }
    if (bioPhoto !== undefined) {
      if (bioPhoto && !isValidImageUrl(bioPhoto, req.user._id)) {
        return res.status(400).json({ message: 'Bio photo URL is invalid.' });
      }
      user.bioPhoto = bioPhoto || '';
    }
    if (intent) user.intent = normaliseIntent(intent);
    /* ⚠️ ALSO normalise the STORED value when this request did not include
       intent at all. `PUT /profile` is a partial update, so a save that touches
       only the bio would otherwise leave a retired "Study Buddy" sitting in the
       document forever — and because intent is a RANKING SIGNAL, that stale
       string silently stops matching anyone who picked "Activity Partner".
       Nothing is lost by normalising: mapping only rewrites retired values and
       de-duplicates, it never invents or drops a currently-valid intent. */
    else if (user.intent?.length) user.intent = normaliseIntent(user.intent);
    if (interestedIn) user.interestedIn = interestedIn;
    // ageRange validation + write removed: the setting it fed was never read by
    // any query or UI, so accepting it only wrote dead data into the document.
    // `age` and `dob` are deliberately NOT editable here — onboarding is the
    // only place they are set, and the client states they're permanent.
    if (interests) user.interests = normaliseInterests(interests);
    // Campus badge opt-out. `!== undefined` rather than truthy, because `false`
    // is the value that actually matters here and a truthy guard would make it
    // impossible to turn OFF once on.
    if (showCollege !== undefined) user.showCollege = Boolean(showCollege);
    if (gapYear !== undefined) user.gapYear = Boolean(gapYear);

    // Ladder: recomputed on EVERY profile write, not just onboarding. This is
    // what makes the score drop when a user blanks a scored field — a real
    // edit, e.g. clearing their bio, costs its points and can push them back
    // under LADDER.interact.
    user.profileScore = computeScore(user);

    await user.save();

    // The edit path. Same broadcast as onboarding — a deck showing this card has
    // to see the edit, not just see it on the owner's next visit.
    broadcastProfileUpdate(req, user);

    // 🧹 VAPORIZE ORPHANED PHOTOS: Clean up removed/replaced images
    const newPhotos = collectUserPhotos(user);
    oldPhotos.forEach(url => {
      if (!newPhotos.has(url)) deleteCloudinaryFile(url, req.user._id);
    });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

/* @route   GET /api/users/location
 * @desc    Report whether the viewer currently has location, WITHOUT echoing it.
 * @access  Private
 *
 * Settings' toggle has to be truthful about what is stored, so it needs to read
 * the state. It does NOT need the coordinates: returning them would put a
 * position into a response that is fetched on every Settings visit and logged
 * in transit, for a UI that only renders "On" or "Off".
 *
 * Returns only the source marker and the age of the reading, and reports
 * `active: false` for a reading too old to affect ranking (geo.js TTL) so the
 * UI can say "expired" instead of implying a stale fix is still in use. */
router.get('/location', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('+currentLatLng +locationSource +locationUpdatedAt')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    const hasCoords = Array.isArray(user.currentLatLng) && user.currentLatLng.length === 2;
    const active = hasCoords && isFreshLocation(user);

    res.status(200).json({
      /* ⚠️ NOT `hasCoords ? user.locationSource : null`. That collapsed the
         'campus' marker to null, because the campus choice stores NO
         coordinates — so a client could set it but never read it back, and
         would show "campus" as "off" on every reload. The state is reported
         from `locationSource` alone, which is exactly the field that holds the
         user's choice. */
      locationSource: user.locationSource || null,
      active,
      /* Age in whole days, so the UI can distinguish "set today" from "set a
         year ago" without ever handling a coordinate. */
      storedDaysAgo: user.locationUpdatedAt
        ? Math.floor((Date.now() - new Date(user.locationUpdatedAt).getTime()) / 86_400_000)
        : null,
    });
  } catch (error) {
    console.error('Error reading location:', error);
    res.status(500).json({ message: 'Server error reading location' });
  }
});

/* The viewer's campus position, independent of any personal reading. */
const campusPointFor = async (user) => {
  if (!user?.collegeCode) return null;
  const college = await College.findOne({ code: user.collegeCode }).select('latLng').lean();
  return sanitizeLatLng(college?.latLng);
};

/* The position the deck is actually ordered around: a fresh personal reading if
 * there is one, otherwise the viewer's campus. Mirrors the `viewerPoint`
 * resolution in routes/discover.js — these two must stay in step or a saved deck
 * gets kept or discarded on a basis the ranking never used.
 *
 * ⚠️ Read this from a freshly loaded user, never from the auth middleware's
 * `req.user`. That document is the PRE-write state: deriving the post-write
 * anchor from it returns the position that was just removed, so a comparison
 * always measures a point against itself and never fires. */
const effectiveAnchorFor = async (user) => sanitizeLatLng(user?.currentLatLng)
  || campusPointFor(user);

/* Drop the viewer's frozen deck when the anchor it was built around no longer
 * applies. Returns true when the deck was discarded, so callers can report it.
 *
 * ⚠️ An undefined previous anchor means there was nothing to lose, so it is NOT
 * treated as a move. A viewer with no stored position has no saved ordering that
 * could be wrong; deleting on every first write would just throw away a healthy
 * campus deck each time the app opens. */
const dropDeckIfAnchorMoved = async (viewerId, previousAnchor, nextAnchor) => {
  if (!previousAnchor || !nextAnchor) return false;
  if (haversineKm(previousAnchor, nextAnchor) <= LOCATION_DRIFT_KM) return false;
  await DiscoverSession.deleteOne({ viewerId });
  return true;
};

/* @route   PUT /api/users/location
 * @desc    Set or clear the viewer's coarse location.
 * @access  Private
 *
 * 📍 WHY THIS IS ITS OWN ENDPOINT RATHER THAN A FIELD ON PUT /profile
 * Three reasons, all of them about not storing precise coordinates by accident:
 *
 *   1. `sanitizeLatLng()` is applied HERE, in the one place coordinates are
 *      persisted. Rounding in the client would leave the exact value in the
 *      request body and every log that captures it; rounding here means the
 *      database only ever holds the ~1.1km rounded pair.
 *   2. It is writable independently of a profile edit. Location changes
 *      constantly (a term-break trip home) while profile edits are rare, and
 *      coupling them means every location refresh also risks a ladder score
 *      recalculation.
 *   3. `null` clears it. That has to be expressible without touching the rest
 *      of a profile, because turning the feature OFF must actually delete what
 *      was stored rather than merely stop reading it.
 *
 * The client sends raw coordinates exactly once, immediately after an explicit
 * permission grant. There is no background refresh and no `watchPosition`
 * anywhere in the codebase. */
router.put('/location', protect, async (req, res) => {
  try {
const { latLng, source } = req.body || {};

    /* The one-time nudge on the caught-up screen is dismissed by setting this
       flag rather than by touching the location fields. */
    if (req.body?.dismissNudge === true) {
      await User.updateOne({ _id: req.user._id }, { $set: { locationNudgeDismissed: true } });
      return res.status(200).json({ locationNudgeDismissed: true });
    }

    /* ── "I declined GPS" ──
       Recorded as a marker with NO coordinates at all, so the app can tell
       "declined" apart from "never asked" without ever holding a position. */
    if (latLng === undefined && source === 'campus') {
      /* Declining GPS does not make the anchor "nothing" — it makes it the
         campus. Coming back from a trip far away therefore has to discard a
         deck that was ordered around the old position. */
      const previousAnchor = await effectiveAnchorFor(req.user);
      await User.updateOne(
        { _id: req.user._id },
        {
          $set: { locationSource: 'campus', locationUpdatedAt: new Date() },
          $unset: { currentLatLng: 1 },
        },
      );
      /* Next anchor is the campus itself: the personal reading is gone. */
      const moved = await dropDeckIfAnchorMoved(
        req.user._id,
        previousAnchor,
        await campusPointFor(req.user),
      );
      return res.status(200).json({ locationSource: 'campus', moved });
    }

    /* An explicit null/absent `latLng` clears the reading. This is the
       "turn location off" path and must genuinely delete the stored value.

       ⚠️ `$unset`, NOT `$set: { field: undefined }`. Mongoose drops undefined
       values from an update by default, so the "clear" silently did nothing and
       the coordinates stayed in the database — a privacy control that reports
       success while the data it claims to have removed is still there. */
    if (latLng === null || latLng === undefined) {
      /* 📍 A LAPSED ONE-TIME GRANT IS NOT THE SAME AS A REFUSAL.
       *
       * The client sends `ephemeral: true` when the position it held was covered
       * by Chrome's "Allow this time" and that window has closed on the next
       * launch. The user never said no — they said yes, briefly — so the stored
       * basis becomes 'campus' rather than null.
       *
       * `null` would mean "location is switched off", and Settings reads it that
       * way. It also reads as a deliberate user decision, which is the one thing
       * this is not. 'campus' keeps every downstream surface truthful: the notice
       * mounts, the label reads "college location", and the deck is ordered from
       * the campus without claiming the user opted into anything.
       *
       * Both paths discard the deck on a real anchor move, so a student who went
       * home under a temporary grant does not keep the campus-ordered deck. */
      const previousAnchor = await effectiveAnchorFor(req.user);
      const releasedBasis = req.body?.ephemeral === true ? 'campus' : null;
      await User.updateOne(
        { _id: req.user._id },
        {
          $set: { locationSource: releasedBasis, locationUpdatedAt: null },
          $unset: { currentLatLng: 1 },
        },
      );
      /* Either way the anchor hands back to the campus, so that is the next one.
         Without a campus there is no next anchor and nothing is lost. */
      const moved = await dropDeckIfAnchorMoved(
        req.user._id,
        previousAnchor,
        await campusPointFor(req.user),
      );
      /* Echo the basis actually stored, not the one the old branch hardcoded —
         `campus` and `null` mean different things to Settings and to the notice,
         and returning the wrong one would let the two disagree. */
      return res.status(200).json({ locationSource: releasedBasis, cleared: true, moved });
    }

    /* Reject rather than silently drop. A malformed pair here means the client
       sent something the picker never should have produced, and quietly storing
       nothing would leave the user believing location is on when it is not. */
    const clean = sanitizeLatLng(latLng);
    if (!clean) {
      return res.status(400).json({ message: 'Invalid location' });
    }

    /* Only the two known sources are accepted. 'campus' means the user declined
       GPS and we fall back to their college's position, which stores NO
       coordinates at all — just a marker. */
    const locationSource = source === 'campus' ? 'campus' : 'gps';

    /* 📍 HAS THE VIEWER ACTUALLY MOVED?
     *
     * Read BEFORE the write, because after it the old value is gone. `req.user`
     * carries `+currentLatLng` (added in middleware/auth.js for the deck's own
     * distance ranking), which is what makes this comparison possible at all
     * without a second query.
     *
     * ⚠️ COMPARE ANCHORS, NOT STORED READINGS.
     *
     * This used to compare only against the previously stored GPS position, on
     * the reasoning that someone who has always declined GPS has not "travelled"
     * just because they switched it on. That reasoning holds only when they
     * switched it on while standing on their own campus.
     *
     * A viewer who has never granted GPS is ALREADY served a deck ordered around
     * their campus. Tapping "turn on location" while away from it — summer break,
     * a trip home, a semester at another campus — leaves those 500 frozen ids
     * chosen around the campus position. Comparing against the absent old reading
     * returned "not moved", so the session survived, and the feed kept serving
     * the home-city deck for the full 30-minute lifetime while the UI reported
     * the location was saved. The write succeeded, the storage succeeded, and the
     * only thing that mattered — which people get served — did not change.
     *
     * So the comparison is now between the anchor the old deck was built around
     * (`effectiveAnchorFor`, i.e. old personal reading else campus) and the new
     * one. Enabling GPS on campus is still ~0km and keeps the deck, so there is
     * no churn for the ordinary case. */
    const previousAnchor = await effectiveAnchorFor(req.user);
    const moved = await dropDeckIfAnchorMoved(req.user._id, previousAnchor, clean);

    await User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          currentLatLng: clean,
          locationSource,
          locationUpdatedAt: new Date(),
        },
      },
    );

    /* `moved` already deleted the session via `dropDeckIfAnchorMoved`. This
       second delete used to sit here and was harmless, but with the comparison
       moved into the helper it reads as though the deletion depends on
       something this block computes — it does not. */

    /* Echo the ROUNDED value, not the input, so the client can never hold or
       display a more precise position than we kept.

       `moved` lets the client tell "saved, nothing changed" from "saved, and your
       deck was rebuilt" — it can show a brief notice in the second case instead of
       silently rearranging the deck under someone mid-swipe. */
    res.status(200).json({ currentLatLng: clean, locationSource, moved });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error updating location' });
  }
});

/* Voluntary Ghost Mode was retired, and the legacy `isGhost` field has since
   been removed entirely: shadowbans now live only on `shadowbannedAt` and
   deletion on `isDeleted`, which is what the deck filter reads. */

/* @route   POST /api/users/change-college
 * @desc    Move an account to a new college. Requires a fresh OTP issued to the
 *          NEW college email, so the swap is proof the student controls that
 *          inbox. One active campus at a time — the new one overwrites.
 * @access  Private */
router.post('/change-college', protect, async (req, res) => {
  try {
    const email = normalizeEmail(String(req.body?.email || ''));
    const collegeCode = String(req.body?.collegeCode || '').trim().toLowerCase();
    const otp = String(req.body?.otp || '').trim();

    if (!email || !collegeCode || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Email, college and a 6-digit code are required.' });
    }

    const resolved = await resolveCollege(collegeCode, email);
    if (!resolved.ok) {
      return res.status(400).json({ message: resolved.reason });
    }

    // The newest outstanding OTP for this email is authoritative.
    const record = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Code expired. Request a new one.' });
    }
    if (record.collegeCode && record.collegeCode !== collegeCode) {
      return res.status(400).json({ message: 'That code was sent for a different college.' });
    }
    if (!verifyOtp(email, otp, record.otpHash)) {
      await OTP.findOneAndUpdate({ _id: record._id }, { $inc: { attempts: 1 } });
      return res.status(400).json({ message: 'Incorrect code.' });
    }

    // The new email must not already belong to another account.
    const taken = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (taken) {
      return res.status(409).json({ message: 'That email is already attached to another account.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.email = email;
    user.college = resolved.college.name;
    user.collegeCode = resolved.college.code;
    user.lastVerifiedAt = new Date();
    // One year from the fresh verification, same rule as signup.
    user.reverifyDue = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    user.status = 'active';
    await user.save();

    // The old deck was ordered for the old campus — drop it so the next request
    // rebuilds around the new college. Also drop the campus-derived location
    // marker if the user never enabled GPS: a "My campus" deck must move with
    // them, and a stale campus marker would rank strangers near the old school.
    await DiscoverSession.deleteOne({ viewerId: req.user._id });
    if (user.locationSource === 'campus') {
      await User.updateOne({ _id: user._id }, { $set: { locationSource: null, locationUpdatedAt: null } });
      user.locationSource = null;
    }

    await OTP.deleteMany({ email });

    res.status(200).json({
      message: 'College updated',
      user: { email: user.email, college: user.college, collegeCode: user.collegeCode, reverifyDue: user.reverifyDue },
    });
  } catch (error) {
    console.error('change-college error:', error);
    res.status(500).json({ message: 'Server error, could not change college' });
  }
});

// @route   DELETE /api/users/account
// @desc    Soft-delete user account with 30-day safety retention
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 🧹 IMMEDIATE WIPE: Public profile media from Cloudinary
    // (Profile photos, bio photo, prompt attachments — serve no purpose after deletion)
    collectUserPhotos(user).forEach(url => deleteCloudinaryFile(url, req.user._id));

    // ⚠️ SAFETY RETENTION: Chat media is NOT wiped here.
    // Messages (including photos/voice notes) are retained for 30-day safety window
    // to allow Trust & Safety investigations if the user is reported after deletion.
    // A background cleanup job handles final Cloudinary purge after retention expires.

// 🏴 SOFT DELETE: Wipe PII, flag as deleted.
      //
      // ⚠️ `email` is deliberately NOT cleared here.
      //
      // It looks like an oversight because every other identifying field is
      // blanked, and a college email is the single most identifying thing we
      // hold (see the roll-number exposure in the privacy policy). But this row
      // is retained for 30 days as moderation evidence, and the email is the
      // only field tying it to a person — blanking it would make the retained
      // report evidence useless while the account still exists.
      //
      // It's also load-bearing for abuse: the address can't be re-registered
      // until this window elapses (see RETENTION_MS in routes/auth.js), and
      // that check queries by email.
      //
      // It is cleared when the retention window expires and the row is
      // hard-deleted. Before then, this account is invisible in the product.
      user.name = 'Deleted User';
      user.photos = [];
      user.bio = '';
      user.bioPhoto = '';
      user.prompts = [];
      user.interests = [];
      user.intent = [];
      user.graduatingYear = null;
      user.isDeleted = true;
    user.deletedAt = new Date();
    user.suspended = false;
    user.pushSubscription = null;
    user.interestedIn = [];
    user.interests = [];
    await user.save();

    // 💔 DEACTIVATE all alignments (chats vanish from inboxes instantly)
    await Alignment.updateMany({ users: userId }, { $set: { isActive: false } });

    // 🧹 CLEANUP: Records with no safety retention value
    await Block.deleteMany({ $or: [{ blocker: userId }, { blocked: userId }] });
    // ⚠️ Reports are INTENTIONALLY RETAINED — moderation evidence must survive
    // account deletion so abuse can still be investigated. Final purge happens
    // in the 30-day background cleanup job.
    await Notification.deleteMany({ $or: [{ recipientId: userId }, { senderId: userId }] });
    await Analytics.deleteMany({ user: userId });

    // 📦 RETAIN for 30-day safety window: Messages, Alignments, Interactions
    // (Final hard deletion handled by background cleanup job)

    // 🔒 CLEAR SESSION
    clearAuthCookie(res);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
});

// @route   GET /api/users/onboarding/resume
// @desc    Get saved onboarding progress
// @access  Private
router.get('/onboarding/resume', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('onboardingStep onboardingData');
    res.json({ step: user.onboardingStep, data: user.onboardingData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/onboarding/save
// @desc    Save onboarding progress
router.put('/onboarding/save', protect, async (req, res) => {
  try {
    const { step, data } = req.body;

    if (typeof step !== 'number' || !Number.isInteger(step) || step < 1 || step > 8) {
      return res.status(400).json({ message: 'Invalid onboarding step' });
    }
    if (data != null && JSON.stringify(data).length > 100 * 1024) { // 100KB cap
      return res.status(400).json({ message: 'Onboarding draft too large' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      onboardingStep: step,
      onboardingData: data || {},
    });
    
    // ANALYTICS: Track user progression
    await Analytics.create({ user: req.user._id, event: 'ONBOARDING_STEP', step });

    res.json({ saved: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/onboarding/clear
// @desc    Clear saved onboarding progress
// @access  Private
router.delete('/onboarding/clear', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { onboardingStep: 1, onboardingData: {} });
    res.json({ cleared: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/logout-all
// @desc    Invalidate all active sessions for the current user
// @access  Private
router.post('/logout-all', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { lastLogoutAt: new Date() });
    res.status(200).json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

```

### ./server/routes/waitlist.js

```
import express from 'express';
import { body } from '../middleware/validate.js';
import { validate } from '../middleware/validate.js';
import Waitlist from '../models/Waitlist.js';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// FIXED: Hardcoded launch date — no more drift
const LAUNCH_DATE = new Date('2026-10-02T00:00:00Z');

// Rate limit: 5 joins per 15 min per email (not IP — campuses share one NAT IP)
const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.WAITLIST_JOIN_MAX) || 5,
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toString().toLowerCase().trim();
    return email || `no-email-${req.ip}`;
  },
  message: { message: 'Too many join attempts. Please wait a bit.' },
  // Matches every other limiter in the app (see middleware/rateLimiters.js).
  // Without these the client gets a 429 with no RateLimit headers, so it can't
  // tell when the window resets and has no way to back off politely.
  standardHeaders: true,
  legacyHeaders: false,
});

// Extract college details from email (matches pattern in auth.js)
const extractCollege = (email) => {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const parts = domain.split('.');
  // College code is ALWAYS the part immediately before ".ac.in"
  const code = domain.endsWith('.ac.in') ? (parts[Math.max(0, parts.length - 3)] || parts[0]) : parts[0];
  const map = {
    iitb: 'IIT Bombay', iitd: 'IIT Delhi', iitk: 'IIT Kanpur',
    iitkgp: 'IIT Kharagpur', iitm: 'IIT Madras', iitr: 'IIT Roorkee',
    iitg: 'IIT Guwahati', iith: 'IIT Hyderabad', iitbhu: 'IIT BHU',
  };
  return { collegeCode: code, college: map[code] || domain };
};

// Variable-ratio reward engine. The slot machine.
// Weighted toward small bonuses with rare jackpots.
const computeReferralBonus = (referrerCurrentCount) => {
  const roll = Math.random();
  let bonus;
  if (roll < 0.50) bonus = 2 + Math.floor(Math.random() * 2);       // 50%: 2-3 spots
  else if (roll < 0.80) bonus = 4 + Math.floor(Math.random() * 3);  // 30%: 4-6 spots
  else if (roll < 0.95) bonus = 7 + Math.floor(Math.random() * 4);  // 15%: 7-10 spots
  else bonus = 11 + Math.floor(Math.random() * 5);                  // 5%: 11-15 spots (JACKPOT)

  // Early evangelist bonus: first 10 referrals get +5 extra
  if (referrerCurrentCount < 10) bonus += 5;
  return bonus;
};

// Proper block-shift: moves everyone in [newPosition, oldPosition) up by 1,
// then recomputes tiers for the affected block + the referrer.
const shiftPositionsUp = async (referrerId, oldPosition, newPosition) => {
  if (newPosition >= oldPosition) return; // No shift needed

  // 1. Shift everyone in the gap up by 1
  await Waitlist.updateMany(
    {
      _id: { $ne: referrerId },
      position: { $gte: newPosition, $lt: oldPosition },
    },
    { $inc: { position: 1 } }
  );

  // 2. Recompute tiers for the shifted block + the referrer
  const T = Waitlist.TIER_THRESHOLDS;
  const affected = await Waitlist.find({
    position: { $gte: newPosition, $lte: oldPosition },
  }).lean();

  const ops = affected.map((entry) => {
    const tier = entry.position <= T.charter ? 'charter'
               : entry.position <= T.founding ? 'founding'
               : 'original';
    return {
      updateOne: {
        filter: { _id: entry._id },
        update: { $set: { tier } },
      },
    };
  });
  if (ops.length > 0) await Waitlist.bulkWrite(ops);
};

// ─── JOIN THE WAITLIST ───
router.post(
  '/join',
  joinLimiter,
  [
    body('email')
      .isEmail().withMessage('Valid email required')
      .custom((value) => {
        const normalized = value.trim().toLowerCase();
        if (!normalized.endsWith('.ac.in')) {
          throw new Error('Only academic (.ac.in) emails are accepted');
        }
        return true;
      }),
    body('name').optional().isString().trim().isLength({ max: 60 }),
    body('referralCode').optional().isString().trim().isLength({ min: 6, max: 6 }),
  ],
  validate,
  async (req, res) => {
    try {
      const email = req.body.email.trim().toLowerCase();
      const { name, referralCode } = req.body;

      // Duplicate check
      const existing = await Waitlist.findOne({ email });
      if (existing) {
        return res.status(409).json({
          message: 'You are already in the cohort.',
          position: existing.position,
          referralCode: existing.referralCode,
        });
      }

      // Process referral if provided
      let referrer = null;
      let bonusSpots = 0;
      let oldPosition = null;

      if (referralCode) {
        referrer = await Waitlist.findOne({ referralCode: referralCode.toUpperCase() });
        if (referrer) {
          // Self-referral guard
          if (referrer.email === email) {
            return res.status(400).json({ message: 'Nice try. You cannot refer yourself.' });
          }

          // THE SLOT MACHINE MOMENT
          bonusSpots = computeReferralBonus(referrer.referralCount);
          oldPosition = referrer.position;
          const newPosition = Math.max(1, referrer.position - bonusSpots);

          referrer.position = newPosition;
          referrer.referralCount += 1;
          referrer.spotsJumped += bonusSpots;
          referrer.tier = referrer.computeTier();
          await referrer.save();

          // Proper block-shift
          await shiftPositionsUp(referrer._id, oldPosition, newPosition);
        }
      }

      // Assign position (end of queue)
      const totalBefore = await Waitlist.countDocuments();
      const position = totalBefore + 1;
      const newReferralCode = await Waitlist.generateReferralCode();
      const { college, collegeCode } = extractCollege(email);

      const T = Waitlist.TIER_THRESHOLDS;
      const entry = await Waitlist.create({
        email,
        name: name || '',
        college, collegeCode,
        referralCode: newReferralCode,
        referredBy: referrer?._id || null,
        position,
        tier: position <= T.charter ? 'charter' : position <= T.founding ? 'founding' : 'original',
      });

      res.status(201).json({
        success: true,
        position: entry.position,
        referralCode: entry.referralCode,
        tier: entry.tier,
        totalWaiting: position,
        referralBonus: referrer ? {
          referrerName: referrer.name || 'A fellow IITian',
          spotsJumped: bonusSpots,
          newPosition: referrer.position,
        } : null,
      });
    } catch (error) {
      console.error('Waitlist join error:', error);
      res.status(500).json({ message: 'The archives encountered an error. Please try again.' });
    }
  }
);

// ─── CHECK STATUS (by referral code — no auth needed) ───
router.get('/status/:code', async (req, res) => {
  try {
    const entry = await Waitlist.findOne({ referralCode: req.params.code.toUpperCase() }).lean();
    if (!entry) return res.status(404).json({ message: 'Code not found' });
    const total = await Waitlist.countDocuments();
    res.json({
      position: entry.position,
      tier: entry.tier,
      totalWaiting: total,
      ahead: entry.position - 1,
      referralCount: entry.referralCount,
      spotsJumped: entry.spotsJumped,
      spotsToTop100: entry.position > 100 ? entry.position - 100 : 0,
      spotsToTop50: entry.position > 50 ? entry.position - 50 : 0,
      status: entry.status,
      joinedAt: entry.joinedAt,
      checkInStreak: entry.checkInStreak,
      name: entry.name,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch status' });
  }
});

// ─── PUBLIC STATS (for social proof counter) ───
router.get('/stats', async (req, res) => {
  try {
    const [total, charter, founding, last24h, recentJoins] = await Promise.all([
      Waitlist.countDocuments(),
      Waitlist.countDocuments({ position: { $lte: 50 } }),
      Waitlist.countDocuments({ position: { $gt: 50, $lte: 250 } }),
      Waitlist.countDocuments({ joinedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Waitlist.find().sort({ joinedAt: -1 }).limit(12).select('name branch year joinedAt').lean(),
    ]);
    res.json({
      total, charter, founding, last24h,
      // Real joins for transparent social proof
      recentJoins: recentJoins.map(j => ({
        name: j.name || 'An IITian',
        branch: j.branch || '',
        year: j.year || '',
        joinedAt: j.joinedAt,
      })),
      // Fixed launch date (move to Setting model later)
      launchDate: LAUNCH_DATE.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// ─── DAILY CHECK-IN (engagement loop) ───
router.post('/checkin/:code', async (req, res) => {
  try {
    const entry = await Waitlist.findOne({ referralCode: req.params.code.toUpperCase() });
    if (!entry) return res.status(404).json({ message: 'Code not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Already checked in today
    if (entry.lastCheckIn && new Date(entry.lastCheckIn).setHours(0,0,0,0) >= today.getTime()) {
      return res.json({ streak: entry.checkInStreak, alreadyCheckedIn: true });
    }

    // Maintain or reset streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastCheckInDay = entry.lastCheckIn ? new Date(entry.lastCheckIn).setHours(0,0,0,0) : null;
    entry.checkInStreak = (lastCheckInDay === yesterday.getTime()) ? entry.checkInStreak + 1 : 1;
    entry.lastCheckIn = now;

    // Reward: every 3-day streak = jump 2 spots
    let reward = null;
    if (entry.checkInStreak > 0 && entry.checkInStreak % 3 === 0) {
      const jump = 2;
      const oldPosition = entry.position;
      const newPosition = Math.max(1, entry.position - jump);
      entry.position = newPosition;
      entry.spotsJumped += jump;
      entry.tier = entry.computeTier();
      await entry.save();
      await shiftPositionsUp(entry._id, oldPosition, newPosition);
      reward = { spotsJumped: jump, newPosition };
    } else {
      await entry.save();
    }

    res.json({ streak: entry.checkInStreak, position: entry.position, reward });
  } catch (error) {
    res.status(500).json({ message: 'Check-in failed' });
  }
});

export default router;
```

