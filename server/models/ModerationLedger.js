import mongoose from 'mongoose';

const moderationLedgerSchema = new mongoose.Schema(
  {
    // Keyed HMAC only; the deleted user's email is never stored in this ledger.
    emailFingerprint: {
      type: String,
      required: true,
      unique: true,
    },
    shadowbannedAt: {
      type: Date,
      required: true,
    },
    shadowbanScore: {
      type: Number,
      default: 0,
    },
    contentFrozen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ModerationLedger = mongoose.model('ModerationLedger', moderationLedgerSchema);
export default ModerationLedger;
