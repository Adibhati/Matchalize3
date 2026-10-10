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

// Onboarding analytics are write-only — nothing in this codebase reads them
// back, they're only inspected by hand in Atlas. So exactly one index, matching
// the one query that actually runs: the deleteMany({ user }) in
// routes/users.js that fires on every account deletion. Without it that is a
// full collection scan on each account removal.
//
// Deliberately NOT added:
//   - { event, createdAt } — for funnel reporting that does not exist.
//   - a TTL on createdAt  — this would permanently delete onboarding history
//     with no undo and no way to recover it. Retention is a product decision,
//     not a performance one; make it deliberately, not as a side effect of
//     adding indexes.
//
// Note: this schema carries two timestamps — the explicit `timestamp` field
// above and the automatic `createdAt`/`updatedAt` from `timestamps: true`. They
// differ by milliseconds. Left as-is because nothing reads either one today;
// if funnel reporting ever gets built, pick one before trusting the numbers.

analyticsSchema.index({ user: 1 });

export default mongoose.model('Analytics', analyticsSchema);