import express from 'express';
import mongoose from 'mongoose';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { messageLimiter } from '../middleware/rateLimiters.js';
import { areBlocked } from '../middleware/blockFilter.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';

const router = express.Router();

// @route   GET /api/messages/:matchId
// @desc    Get messages using ObjectId-Based Cursor Pagination
router.get('/:matchId', protect, async (req, res) => {
  const { matchId } = req.params;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
  const cursor = req.query.cursor;

  try {
    const match = await Match.findOne({
      _id: matchId,
      users: req.user._id,
      isActive: true,
    });

    if (!match) {
      return res.status(403).json({ message: 'Unauthorized or match inactive' });
    }

    const query = { matchId };
    
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
      .populate('replyTo', 'text senderId type image deleted');

    Message.updateMany(
      { matchId, senderId: { $ne: req.user._id }, readAt: null },
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

// @route   POST /api/messages/:matchId
router.post('/:matchId', protect, messageLimiter, async (req, res) => {
  const { matchId } = req.params;
  const { text, type, image, replyTo, mediaUrl, caption, clientMsgId } = req.body;

  const hasMedia = (type === 'image' || type === 'audio') && mediaUrl;
  if (!hasMedia && (!text || text.trim() === '')) {
    return res.status(400).json({ message: 'Message cannot be empty' });
  }

  if (text && text.length > 5000) {
    return res.status(400).json({ message: 'Message too long (max 5000 characters)' });
  }

  try {
    const match = await Match.findOne({
      _id: matchId,
      users: req.user._id,
      isActive: true,
    });

    if (!match) return res.status(403).json({ message: 'Unauthorized or match inactive' });

    const otherUserId = match.users.find(u => u.toString() !== req.user._id.toString());
    if (otherUserId && await areBlocked(req.user._id, otherUserId)) {
      return res.status(403).json({ message: 'Cannot send messages to this user' });
    }
    
    // 🛡️ BLOCK UNMATCHED USERS: Double-check match is still active
    if (!match.isActive) {
      return res.status(403).json({ 
        message: 'This connection has ended.',
        code: 'MATCH_INACTIVE'
      });
    }

    // IDEMPOTENCY CHECK: Prevent duplicate messages from network retries
    if (clientMsgId) {
      const existingMsg = await Message.findOne({ clientMsgId });
      if (existingMsg) {
        return res.status(200).json(existingMsg);
      }
    }

    if (replyTo) {
      const replyMsg = await Message.findOne({ _id: replyTo, matchId });
      if (!replyMsg) return res.status(400).json({ message: 'Reply target not found' });
    }

    const messageData = {
      matchId,
      senderId: req.user._id,
      type: type || 'text',
    };

    if (text && text.trim()) messageData.text = text.trim();
    if (mediaUrl) messageData.mediaUrl = mediaUrl;
    if (mediaUrl && type === 'image') messageData.image = mediaUrl; 
    if (caption) messageData.caption = caption;
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
    const populated = await Message.findById(message._id).populate('replyTo', 'text senderId type image deleted');

    match.updatedAt = new Date();
    await match.save();

    const io = req.app.get('io');
    
    // 🌐 MULTI-DEVICE BROADCAST: Send to the match room so ALL devices of sender & receiver update instantly
    if (io) {
      io.to(matchId.toString()).emit('new-message', populated);
    }

    if (otherUserId) {
      const sender = await User.findById(req.user._id).select('name');
      addToQueue(() => sendPushNotification(otherUserId, {
        title: sender?.name || 'New Message',
        body: type === 'audio' ? '🎙️ Sent a voice memo' : type === 'image' ? '📷 Sent a photograph' : (text || '').slice(0, 100),
        data: { type: 'message', matchId: matchId.toString() },
      }));
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

router.post('/:matchId/reaction', protect, async (req, res) => {
  const { matchId } = req.params;
  const { msgId, emoji } = req.body;

  try {
    const match = await Match.findOne({ _id: matchId, users: req.user._id, isActive: true });
    if (!match) return res.status(403).json({ message: 'Unauthorized' });

    const message = await Message.findOne({ _id: msgId, matchId });
    if (!message) return res.status(404).json({ message: 'Message not found' });

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
      io.to(matchId.toString()).emit('reaction-update', { msgId: message._id, reactions: message.reactions });
    }

    res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error reacting' });
  }
});

router.delete('/:matchId/:msgId', protect, async (req, res) => {
  const { matchId, msgId } = req.params;
  try {
    const match = await Match.findOne({ _id: matchId, users: req.user._id, isActive: true });
    if (!match) return res.status(403).json({ message: 'Unauthorized' });

    const message = await Message.findOne({ _id: msgId, matchId });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Can only delete your own messages' });

    // 🧹 CLOUDINARY WIPE: If the message contained a photo or voice note, vaporize it from cloud storage!
    if (message.mediaUrl || message.image) {
      deleteCloudinaryFile(message.mediaUrl || message.image);
    }

    message.deleted = true;
    message.text = '';
    message.image = '';
    message.mediaUrl = '';
    await message.save();

    const io = req.app.get('io');
    if (io) io.to(matchId.toString()).emit('message-deleted', { msgId: message._id });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting message' });
  }
});

export default router;
