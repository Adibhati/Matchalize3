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
      /* 'new_letter' and 'priority_telegram' are RETIRED as writers — the deck
         now emits 'new_align' for every expression of interest. They stay in the
         enum because unread rows carrying them remain in users' drawers and must
         still validate. Anything missing from this list is REJECTED by Mongoose,
         which is a 500 on the Align route — the single most important entry
         here is 'new_align'. */
      enum: ['new_letter', 'priority_telegram', 'new_align'],
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

    /* ═══════════════════════════════════════════════════════════════════════
     * 🎰 REQUEST PROVENANCE & DEADLINE  (Roulette, Stage 1)
     *
     * A pending request must know two things the deck never needed: which
     * flow produced it, and when it stops being valid.
     * ═══════════════════════════════════════════════════════════════════════ */
    source: {
      type: String,
      enum: ['deck', 'roulette'],
      default: 'deck',
      /* Which flow created this request. Drives two things at accept time:
       * the origin label shown in the Requests list, and whether an opening
       * letter may be generated — routes/notifications.js:195-235 copies the
       * sender's photo and prompt text into the chat, which is exactly what a
       * hidden-profile connection must never do.
       *
       * Defaults to 'deck' so every pre-Roulette row is automatically correct
       * rather than requiring a backfill to make it correct. */
    },

    callSessionId: {
      type: String,
      default: null,
      /* The Roulette call this request belongs to, if any. Null for deck.
       *
       * Also the key to expiry: when a call ends, the server sweeps every
       * request carrying this id and clears it. Without this column a pending
       * live request would have no way to find its call, and the call's end
       * would leave an orphaned request unlockable forever. */
    },

    expiresAt: {
      type: Date,
      default: null,
      /* NULL = never expires. Deck requests outlive their call and stay valid
       * until accepted or declined, which is their existing behaviour.
       *
       * Roulette requests MUST carry a deadline, because spec §7.3 says a
       * still-pending request expires when the call closes. Accept checks this
       * field and rejects a late accept as expired — see R2 in the Stage 1
       * acceptance tests.
       *
       * ⚠️ This is deliberately NOT a Mongo TTL index. A TTL deletes the
       * document; the spec requires the row to SURVIVE so the Requests list
       * can show it as expired rather than silently vanishing. TTL belongs on
       * `createdAt` (below), which already exists. */
    },
  },
  {
    timestamps: true,
  }
);

// Extremely fast lookup for the active Instagram-style tray
notificationSchema.index({ recipientId: 1, isCleared: 1, createdAt: -1 });

// Serves the call-end expiry sweep: "clear every pending request belonging to
// call X". Sparse because only roulette rows carry a callSessionId — without
// `sparse` every deck row would be indexed under null and the index would grow
// to the size of the whole collection for no query benefit.
notificationSchema.index(
  { callSessionId: 1 },
  { sparse: true, name: 'roulette_call_expiry_sweep' }
);

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
