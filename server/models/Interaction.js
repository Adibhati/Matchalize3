import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema(
  {
    actorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    targetId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    actionType: { 
      type: String, 
      /* 'letter' and 'telegram' are RETIRED as UI actions — the deck now has a
         single 'align' action. They stay in the enum because rows already exist
         that carry them, and the accept route (routes/notifications.js) reads
         them to decide whether an inbound request was already answered.
         Removing either value would make those documents fail validation on the
         next save, and would break mutual detection for historical matches.
         Nothing NEW writes them. */
      enum: ['archive', 'letter', 'telegram', 'accept_letter', 'align'], 
      required: true 
    },
    origin: {
      type: String,
      enum: ['block', 'unmatch', 'pass'],
      default: null,
      /* ⚠️ THIS IS NOT THE CONNECTION SOURCE. `origin` here means "why did this
       * action leave a permanent mark" — it is only ever written by the block,
       * unmatch and pass routes.
       *
       * The connection/request source is the separate `source` field below.
       * Do not unify them: `origin` answers a historical question about one
       * action, `source` answers "which flow produced this", and reusing one
       * name for both would make every read site ambiguous. */
    },

    source: {
      type: String,
      enum: ['deck', 'roulette'],
      default: 'deck',
      /* Which flow emitted this action. Set alongside an `align` so the
       * accept path can tell a deck align from a Roulette one and branch
       * before generating an opening letter — a deck align may copy the
       * sender's photo and prompt into the chat, a hidden-profile Roulette
       * align must not.
       *
       * Separate from `origin` above, and see the note there. Defaults to
       * 'deck' so every historical row is correct without a backfill. */
    },
    targetArtifact: { 
      type: String, 
      default: null 
      // e.g., 'photo_1', 'whisper_0' - stores exactly what they tapped
    },
    letterContent: { 
      type: String, 
      maxlength: 140, 
      default: null 
    },
    cooldownExpiresAt: { 
      type: Date, 
      default: null 
      // Powered by our 7-day re-queue logic for passed profiles (Interaction History)
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for building the Discover deck instantly
interactionSchema.index({ actorId: 1, targetId: 1 });

/* UNIQUE on the pair + action. The pass route and the letter route both use
   findOneAndUpdate({actorId, targetId, actionType}, …, {upsert: true}), which
   is only safe if that combination can never appear twice. Without this index
   two concurrent passes on the same person can both fail to match, both insert,
   and leave duplicate archive rows — after which the deck's exclusion query
   reads them as two separate ledger entries and the escalating-cooldown pass
   count double-increments.

   Verified against the live collection before this index was added: zero
   duplicate {actorId, targetId, actionType} keys existed, so the index built
   without a migration. */
interactionSchema.index(
  { actorId: 1, targetId: 1, actionType: 1 },
  { unique: true, name: 'unique_interaction_per_pair_action' }
);

interactionSchema.index({ actorId: 1, cooldownExpiresAt: 1 });
interactionSchema.index(
  { actorId: 1, actionType: 1, createdAt: -1 },
  { name: 'daily_limit_query_index' }
);
interactionSchema.index({ targetId: 1, actionType: 1 });

const Interaction = mongoose.model('Interaction', interactionSchema);
export default Interaction;
