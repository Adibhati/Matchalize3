import mongoose from 'mongoose';

const alignmentSchema = new mongoose.Schema(
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
      // Points back to the exact letter that sparked the alignment
    },
  },
  {
    timestamps: true,
  }
);

alignmentSchema.index({ users: 1, isActive: 1 });

/**
 * 🛡️ ALIGNMENT INTEGRITY
 *
 * An alignment is by definition two people, and `pairKey` must describe exactly
 * those two. Nothing enforced either: `users` was an unbounded array, so a stray
 * `$push` could add a third person and the chat would silently become a
 * three-way conversation while `pairKey` still said two — no error anywhere,
 * just a silently wrong document.
 *
 * Sorting note: both construction sites build pairKey with a bare
 * `[a, b].sort().join('__')` (routes/discover.js, routes/notifications.js) —
 * default lexicographic sort on 24-char hex ObjectId strings. This hook must use
 * the identical expression or it will reject valid alignments. If either site
 * ever switches to an explicit comparator, change it here too.
 *
 * `pre('validate')` covers both `save()` and an explicit `.validate()`.
 */
alignmentSchema.pre('validate', function (next) {
  const users = Array.isArray(this.users) ? this.users : [];
  if (users.length !== 2) {
    return next(new Error(`Alignment must have exactly 2 users, got ${users.length}`));
  }
  const expected = users.map(String).sort().join('__');
  if (this.pairKey !== expected) {
    return next(new Error(`pairKey does not match users: expected "${expected}", got "${this.pairKey}"`));
  }
  next();
});

const Alignment = mongoose.model('Alignment', alignmentSchema);
export default Alignment;