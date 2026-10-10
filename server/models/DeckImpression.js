import mongoose from 'mongoose';

/**
 * 📊 DECK IMPRESSION — one row per card actually shown to a viewer.
 *
 * WHY THIS EXISTS, and why it lands FIRST rather than alongside the ranking
 * change:
 *
 * A deck is re-ranked by distance, intent and quality. The only way to know
 * whether that helped is to compare impressions, pass rates and letter rates
 * per rank position — before and after. Ship the re-rank without this and the
 * comparison is impossible to make after the fact: you cannot reconstruct what
 * order would have applied last Tuesday.
 *
 * The specific trap this avoids is EXPOSURE BIAS. Every metric derived from
 * likes and passes alone is contaminated, because a card is only ever liked or
 * passed if it was SHOWN. Without an impression row, "passed" and "never
 * appeared" are indistinguishable, and any ranking change looks like an
 * improvement simply because it shifted which cards got seen. Position bias
 * compounds it — a card in slot 1 gets more engagement than slot 10 for reasons
 * that have nothing to do with the person.
 *
 * Writes are fire-and-forget. Nothing in the request path awaits this, and a
 * logging failure must never fail a deck request.
 *
 * ⚠️ VOLUME NOTE: this grows by (cards shown × viewers). At 10k daily actives
 * × 30 cards each that is 300k rows/day. There is a 30-day TTL below, and the
 * aggregate metrics are computable from it. If retention ever needs to outlive
 * the window, roll this into a daily rollup rather than extending the TTL.
 */
const deckImpressionSchema = new mongoose.Schema(
  {
    viewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Session identity, so one continuous deck can be analysed as a sequence
    // rather than as unrelated requests.
    sessionId: {
      type: String,
      default: null,
    },

    // Position within the returned page (0-indexed), and the absolute position
    // the viewer has swiped through in this session. Position bias correction
    // needs the first; "how deep did they get" needs the second.
    rankInPage: {
      type: Number,
      required: true,
    },
    deckPosition: {
      type: Number,
      required: true,
    },

    // Which score produced this ordering. Bumped whenever the ranking logic
    // changes, so results are attributable to a specific version rather than
    // to "some time in March".
    rankingVersion: {
      type: String,
      default: 'legacy-hybrid-v1',
    },

    /* The score components, stored so you can answer "which signal moved this
       card up?" after the fact. Only `recency` exists today; the others are
       added as the ranking is built out (distance band, intent overlap,
       profile quality). Absent fields are normal, not an error. */
    recency: {
      type: Number,
      default: null,
    },
    distanceKm: {
      type: Number,
      default: null,
    },
    intentOverlap: {
      type: Number,
      default: null,
    },
    sharedInterests: {
      type: Number,
      default: null,
    },
    quality: {
      type: Number,
      default: null,
    },
    hybridScore: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

/* The dashboard query: "every card shown to this viewer in this session, in
   order". Session-scoped, so it leads with viewerId then sessionId. */
deckImpressionSchema.index({ viewerId: 1, sessionId: 1, deckPosition: 1 });

/* Per-candidate exposure totals — the fairness metric. A profile absorbing a
   disproportionate share of impressions is the rich-get-richer failure the
   ranking work is specifically trying to avoid. */
deckImpressionSchema.index({ candidateId: 1, createdAt: -1 });

/* Per-viewer volume, for spotting runaway clients and measuring deck
   consumption. */
deckImpressionSchema.index({ viewerId: 1, createdAt: -1 });

/* 30-day retention. Matches the Notification TTL so the whole events layer
   expires on one schedule. */
deckImpressionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30, name: 'deck_impression_ttl_30d' }
);

const DeckImpression = mongoose.model('DeckImpression', deckImpressionSchema);
export default DeckImpression;