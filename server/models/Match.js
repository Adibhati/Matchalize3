import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    pairKey: {
      type: String,
      required: true,
      unique: true,
      // Always formatted as 'LowerObjectId__HigherObjectId'
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    unlockedByInteractionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interaction',
      required: true,
      // Points back to the exact letter that sparked the match
    },
  },
  {
    timestamps: true,
  }
);

matchSchema.index({ users: 1, isActive: 1 });

const Match = mongoose.model('Match', matchSchema);
export default Match;
