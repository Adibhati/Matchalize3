import mongoose from 'mongoose';

/**
 * 🃏 DISCOVER SESSION — the order of one viewer's deck, decided once.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * The deck used to roll `Math.random()` on EVERY request. Page 1 and page 2 were
 * therefore two independent shuffles of the same pool: people you'd already
 * seen came back around, and other people were skipped entirely. The symptom is
 * invisible at the mechanism level and obvious at the product level — the app
 * just "keeps showing me the same people".
 *
 * Storing the RESOLVED ORDER here is the fix. The order is decided once, written
 * down, and read back for every subsequent page. It cannot reshuffle because it
 * is no longer re-decided — the failure mode is designed out, not reduced.
 *
 * ── WHY THIS IS NOT "REUSE A RANDOM NUMBER" ────────────────────────────────
 * Reusing a random point is the cheaper fix and it is NOT sufficient. A point
 * only defines a start offset; the rows around it can still shift between
 * requests as profiles are created, updated, hidden or suspended. A stored
 * ranking of concrete ids cannot shift, because it is a list of decisions
 * already made rather than a recipe for making them again.
 *
 * ── WHAT IS STORED, AND WHY IT IS NOT A PRIVACY PROBLEM ────────────────────
 * ONLY `_id`s. Never names, never emails, never coordinates. Two users both
 * named "Adi Bhati" have distinct ObjectIds, so duplicate names cannot collide
 * or corrupt the ordering. A 500-id window is roughly 12KB, which is why the
 * window is safe to hold whole at any realistic pool size.
 *
 * ── CURSOR SEMANTICS ───────────────────────────────────────────────────────
 * `cursor` is an INDEX INTO `userIds`, not a count of cards served. That
 * distinction matters: a page scan can consume ids that turn out to be excluded
 * (passed, liked, blocked) and produce fewer cards than requested. The cursor
 * advances past everything CONSUMED, never past only what was returned, so
 * those skipped ids are never re-scanned.
 */
const discoverSessionSchema = new mongoose.Schema(
  {
    viewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /* Retired. Was 'all' | 'campus' — one session per scope, so the header chip
       could swap between two frozen orders without rebuilding. The chip is
       gone, so there is one feed and one session per viewer, and the field is
       kept only so existing documents keep validating. The compound
       `{viewerId, scope}` unique index below is now `{viewerId}` alone; the
       stale campus-scoped sessions were deleted in the same migration. */
    scope: {
      type: String,
      enum: ['all', 'campus'],
      default: 'all',
    },

    /* The resolved deck order for this session. ObjectIds, not names. */
    userIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },

    /* Index into `userIds` of the next id to scan. */
    cursor: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* Every id served this session across ALL windows, not just the current one.
       Needed because a rebuild must skip people the user has already been
       SHOWN — being shown is not itself an Interaction, so the Interaction
       ledger cannot tell us about them. Without this, a user who swipes fast
       and burns through three windows gets the first window's un-swiped
       remainder served back to them on the fourth.
       Bounded in practice: the session expires after SESSION_IDLE_MINUTES. */
    servedIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },

    /* ── CARDS SERVED — server-owned, and the source of truth for impressions.
     *
     * This is a COUNT of cards actually returned to this viewer, which is NOT
     * the same as `cursor`: the cursor is an index into `userIds` and advances
     * past ids that were consumed but then EXCLUDED (passed, liked, blocked).
     * Two viewers can sit at the same cursor having seen different numbers of
     * cards.
     *
     * It exists because `deckPosition` on an impression used to come from the
     * client's own `?served=` parameter. The client keeps a running total, and
     * when a deck is discarded and rebuilt — the app-open location check does
     * exactly this when you have travelled — the client discarded its deck but
     * never reset its total. The fresh deck's first page was therefore logged as
     * cards 41–50 instead of 1–10.
     *
     * The cards themselves were always correct, because slicing is driven by
     * `cursor`, which the rebuild resets to 0. Only the recorded positions were
     * wrong — which quietly corrupts the one number the log exists to produce:
     * "how deep did people actually get".
     *
     * Counted here, server-side, so no client bug can mislabel it again. */
    cardsServed: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* Bumped whenever the ranking formula changes, so an open session built by
       an older build cannot serve an order that no longer matches the code that
       is asking for it. Without this, deploy mid-session leaves users on a
       stale ordering with no obvious cause. */
    rankingVersion: {
      type: String,
      default: 'hybrid-v1',
    },

    /* Session freshness. Rolling this on every request is what makes the
       session "live" — a deck survives an open app but not a closed one.
       Indexed by the TTL index below, not here. */
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

/* One live session per viewer. This is what makes the lookup a single indexed
   hit and, more importantly, what prevents two concurrent requests from each
   building their own window and racing to define the order. */
/* One session per viewer. Was `{viewerId, scope}` — one per scope, so the
   campus chip could keep two frozen orders alive. With one feed there is
   nothing to scope, and keying on `scope` would let a returning user
   accumulate a second dead session. */
discoverSessionSchema.index({ viewerId: 1 }, { unique: true });

/* Housekeeping: sessions expire after a day whether or not anyone reads them
   again, so the collection cannot grow unbounded. The 30-minute idle rule is
   enforced in code on read; this is only a backstop for abandoned rows. */
discoverSessionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

const DiscoverSession = mongoose.model('DiscoverSession', discoverSessionSchema);

export default DiscoverSession;
