import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['new_letter', 'priority_seal'],
      required: true,
    },
    interactionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interaction',
      required: true,
      // Links to the exact letter and photo they liked
    },
    isCleared: {
      type: Boolean,
      default: false,
      // Flips to true the moment they hit [Accept] or [Archive]
    },
  },
  {
    timestamps: true,
  }
);

// Extremely fast lookup for the active Instagram-style tray
notificationSchema.index({ recipientId: 1, isCleared: 1, createdAt: -1 });

// Auto-delete cleared notifications after 30 days to prevent database bloat
notificationSchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { isCleared: true } 
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
