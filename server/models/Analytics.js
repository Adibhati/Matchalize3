import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    event: {
      type: String,
      required: true,
      enum: ['ONBOARDING_STEP', 'ONBOARDING_COMPLETE', 'ONBOARDING_ABANDONED'],
    },
    step: {
      type: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

analyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
analyticsSchema.index({ user: 1, event: 1 });

export default mongoose.model('Analytics', analyticsSchema);