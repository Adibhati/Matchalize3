import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
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
    image: {
      type: String,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
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

messageSchema.index({ matchId: 1, createdAt: 1 });
// 🚀 COLLISION-PROOF PAGINATION: Instant ObjectId-based cursor queries
messageSchema.index({ matchId: 1, _id: -1 });

// Speeds up moderation queries and global user cleanup operations
messageSchema.index({ senderId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
