import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    alignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alignment',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'opening_letter', 'audio'],
      default: 'text',
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },
    clientMsgId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // ⚠️ DEPRECATED — `image` is a legacy duplicate of `mediaUrl`. Every writer used
    // to set both to the identical value, so ~half of each message's media bytes
// were stored twice and nothing read the copy. Writers no longer set it
    // (routes/messages.js, routes/discover.js, routes/notifications.js).
    //
    // It is KEPT in the schema on purpose: existing documents still carry a value
    // here, and the delete route reads `message.mediaUrl || message.image` so
    // old messages still get their Cloudinary asset destroyed. Dropping the
    // field is a separate change, to be done only after confirming no legacy
    // document has an empty mediaUrl.
    image: {
      type: String,
      default: '',
    },
    // The single source of truth for message media. Photos and voice notes both
    // live here; the client's type field decides which player to use.
    mediaUrl: {
      type: String,
      default: '',
    },
    // ⚠️ DEPRECATED — `caption` is a dead field. No route ever wrote a value here
    // and the client never read it; the caption under a photo is always rendered
    // from `text`. Retained so existing documents still load. The search route's
    // `caption` branch was removed too, since it could never match.
    caption: {
      type: String,
      default: '',
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'read'],
      default: 'sent',
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ alignmentId: 1, createdAt: 1 });
// 🚀 COLLISION-PROOF PAGINATION: Instant ObjectId-based cursor queries
messageSchema.index({ alignmentId: 1, _id: -1 });

// Speeds up moderation queries and global user cleanup operations
messageSchema.index({ senderId: 1, createdAt: -1 });
// 🔒 ONE opening letter per alignment, enforced at the DB level.
// Partial filter → normal text/image/audio messages are NOT affected
// (an alignment can still have thousands of those). This index is what makes
// the upserts in discover.js + notifications.js truly race-safe.
messageSchema.index(
  { alignmentId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'opening_letter' } }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
