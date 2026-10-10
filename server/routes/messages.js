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
