# Matchalize Deck — Full source bundle

This file is a copy of the deck-related source. Each path follows the project structure.

## server/routes/discover.js
```
import express from 'express';
import User from '../models/User.js';
import Alignment from '../models/Alignment.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Interaction from '../models/Interaction.js';
import DeckImpression from '../models/DeckImpression.js';
import DiscoverSession from '../models/DiscoverSession.js';
import { protect } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { CARD_FIELDS_SELECT, toPublicCard } from '../utils/publicCard.js';
import { isFreshLocation, bandFromIndex, sanitizeLatLng, haversineKm } from '../utils/geo.js';
import College from '../models/College.js';
import { LADDER } from '../utils/ladder.js';
import { discoverLimiter } from '../middleware/rateLimiters.js';
import { getBlockExclusionQuery } from '../middleware/blockFilter.js';
import { body } from '../middleware/validate.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
const DAY_MS = 24 * 60 * 60 * 1000;

/* How fast the deck forgets an inactive profile.
   Exponential decay on this half-life. 72h means a profile untouched for three
   days scores 0.5 — slow enough that a student who opens the app every few
   days stays near the top of their own band, fast enough that someone who
   churned in July sinks below someone who logged in last week. */
const RECENCY_HALF_LIFE_HOURS = 72;

/* Score for a profile whose lastActive we cannot read.
   Deliberately mid-scale, not 0 — see the recency block in GET /discover. */
const UNKNOWN_ACTIVITY_SCORE = 0.5;

/* How long a deck order stays valid.
   A session survives while the user keeps browsing, so a normal 10–15 minute
   session never reshuffles under them mid-swipe. Coming back after longer than
   this rebuilds the order, which is what surfaces people who signed up since.

   Deliberately much shorter than Hinge's 24-hour Most Compatible cycle: their
   pool is tens of millions, this one is a campus. Holding one order for a day
   here would just re-serve an exhausted list. */
const SESSION_IDLE_MINUTES = 30;

/* Bumped whenever the ranking formula or the ordering rules change. An open
   session carrying an older version is rebuilt instead of read, so a deploy can
   never leave a user walking a stale ordering with no visible cause. */
const RANKING_VERSION = 'hybrid-v1';

/* Ceiling on how many ids a single session's extension query will scan past.
   `servedIds` grows for as long as the session lives, so without a cap the
   over-fetch in rankWindow() becomes proportional to everything the user has
   been shown and the query cost drifts upward as they browse. */
const MAX_SESSION_SERVED = 1000;



/**
 * Step `reserved` evenly through `main` instead of stacking them at either end.
 *
 * ── WHY NOT JUST APPEND OR PREPEND ─────────────────────────────────────────
 * A reservation exists to stop a group being invisible. Appending them keeps
 * them invisible whenever the list is longer than the reservation; prepending
 * them makes the deck's first impression the group it was meant to rescue. With
 * 50 newcomers in a 500 deck, prepending meant the first FIVE SCREENS were empty
 * profiles before anyone real appeared.
 *
 * ── WHY DETERMINISTIC ─────────────────────────────────────────────────────
 * No randomness. P2's entire guarantee is that a session's order never moves
 * between requests, so this function must return the same arrangement for the
 * same input every time — otherwise calling it twice in one request would
 * silently reorder the deck.
 *
 * ── NO ITEM IS EVER DROPPED ───────────────────────────────────────────────
 * The naive `for` loop that pushes a reserved item when the loop index hits a
 * computed boundary breaks when two boundaries collide — the second item's
 * boundary has already passed, it never matches, and it is lost. This walks the
 * reserved items and drains `main` up to each boundary instead, so the output is
 * always exactly `main.length + reserved.length` long.
 *
 * @param {Array} main ordered items that keep their ranking
 * @param {Array} reserved items to step in, already in their own ranked order
 * @returns {Array}
 */
const spreadReserved = (main, reserved) => {
  if (!reserved || reserved.length === 0) return [...main];
  if (!main || main.length === 0) return [...reserved];

  const total = main.length + reserved.length;
  /* Space between reserved items. One extra slot because the first one sits
     after some of `main`, not at position zero. */
  const gap = total / (reserved.length + 1);

  const out = [];
  let mi = 0;
  for (let ri = 0; ri < reserved.length; ri++) {
    /* `total - 1` is a floor on the boundary: two boundaries can round to the
       same index when the reserved list is dense, and without this the last few
       items would all pile onto the final position. */
    const at = Math.min(total - 1, Math.floor((ri + 1) * gap));
    while (mi < at && mi < main.length) out.push(main[mi++]);
    out.push(reserved[ri]);
  }
  while (mi < main.length) out.push(main[mi++]);
  return out;
};

/**
 * Write one impression row per card returned, without ever letting the logging
 * affect the response.
 *
 * Deliberately NOT awaited. A deck request is the hottest path in the app, and
 * an analytics write that can slow it down or throw into it would trade real
 * user-facing latency for data we can reconstruct later. Failures are logged and
 * dropped — a missing impression row is a gap in the analytics, never a broken
 * deck.
 *
 * `insertMany` is used over N saves so this is one round trip regardless of page
 * size, and `ordered: false` so one malformed document can't abort the rest.
 */
const recordImpressions = ({ viewerId, sessionId, cards, startPosition }) => {
  try {
    if (!Array.isArray(cards) || cards.length === 0) return;
    const docs = [];
    for (let index = 0; index < cards.length; index++) {
      const card = cards[index];
      /* `_id` is added by the code below, NOT by toPublicCard() — that helper is
         a deliberate allowlist of publicly shareable profile fields, and _id is
         not one of them. So a card arriving here legitimately has no _id, and
         writing it straight through produced documents with candidateId
         undefined. Mongoose does NOT reject those: `insertMany` treats a missing
         path as "not provided", so it silently inserts a row with candidateId
         omitted and the write reports success. The result was an empty-looking
         collection and no error anywhere.

         `_id` is attached after toPublicCard() precisely because it is the row
         identity the client needs and the impression log needs, and it is not
         sensitive. */
      const candidateId = card._id;
      if (!candidateId) continue;
      docs.push({
        viewerId,
        candidateId,
        sessionId: sessionId || null,
        rankInPage: index,
        deckPosition: startPosition + index,
        rankingVersion: 'legacy-hybrid-v1',
        recency: card._recency ?? null,
        hybridScore: card.hybridScore ?? null,
      });
    }
    if (docs.length === 0) return;
    DeckImpression.insertMany(docs, { ordered: false })
      .catch((err) => console.error('Deck impression write failed:', err.message));
  } catch (err) {
    console.error('Deck impression build failed:', err.message);
  }
};

// Shared helper for Letters and Telegrams
const handleLike = async (req, res, { isTelegram = false } = {}) => {
  const targetId = req.params.id;
  const currentUser = req.user;
  const actionType = isTelegram ? 'telegram' : 'letter';

  try {
    // 🛡️ BLOCK SELF-INTERACTION
    if (targetId === currentUser._id.toString()) {
      return res.status(400).json({ message: 'Cannot interact with yourself' });
    }

    /* 🛡️ THE GATE — server-side enforcement.
     *
     * The client shows the unlock sheet, but that is presentation. Without this
     * check the gate is a speed bump: anyone can call POST /discover/like/:id
     * directly, and devtools makes that trivial. The client gate exists to
     * EXPLAIN the rule; this is what actually enforces it.
     *
     * Deliberately the same threshold as the client (LADDER.interact), read
     * from the same module, so the two can never drift.
     *
     * 403 with `code: 'GATED'` is a distinct status so the client can tell
     * "your profile is locked" apart from "that person no longer exists" and
     * open the right sheet. */
    const actor = await User.findById(currentUser._id).select('profileScore');
    const score = Number.isFinite(actor?.profileScore) ? actor.profileScore : 0;
    if (score < LADDER.interact) {
      return res.status(403).json({
        message: 'Finish your profile to start interacting.',
        code: 'GATED',
        profileScore: score,
        required: LADDER.interact,
      });
    }

    // 🛡️ TARGET MUST EXIST AND BE ACTIVE
    const targetUser = await User.findById(targetId);
    if (!targetUser || targetUser.isDeleted || targetUser.suspended) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 🛡️ BLOCK UNMATCHED USERS: Permanent archive takes precedence over the daily quota
    const permanentArchive = await Interaction.findOne({
      $or: [
        { actorId: currentUser._id, targetId, actionType: 'archive', cooldownExpiresAt: null },
        { actorId: targetId, targetId: currentUser._id, actionType: 'archive', cooldownExpiresAt: null }
      ]
    });
    if (permanentArchive) {
      return res.status(403).json({ 
        message: 'This connection has been permanently closed.',
        code: 'USER_UNMATCHED'
      });
    }

    // 1. INDEPENDENT DAILY LIMITS (7 letters/day, 1 Telegram/day)
    // Use IST midnight (UTC+5:30) as the day boundary for Indian campus users
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(Date.now() + IST_OFFSET_MS);
    istNow.setUTCHours(0, 0, 0, 0); // Midnight IST
    const startOfDay = new Date(istNow.getTime() - IST_OFFSET_MS); // Back to UTC timestamp
    const dailyCount = await Interaction.countDocuments({
      actorId: currentUser._id,
      actionType,
      createdAt: { $gte: startOfDay },
    });
    const dailyLimit = isTelegram ? 1 : 7;
    if (dailyCount >= dailyLimit) {
      return res.status(403).json({
        message: isTelegram ? 'Out of Telegrams. Come back tomorrow.' : 'Out of letters. Come back tomorrow.',
      });
    }

    const { note, target } = req.body; 
    
    const safeNote = typeof note === 'string' ? note.trim() : '';

    if (safeNote.length > 140) {
      return res.status(400).json({
        message: 'Letter must be 140 characters or fewer.',
        code: 'LETTER_TOO_LONG',
      });
    }

    // 2. CREATE THE LEDGER ENTRY
    const letterInteraction = await Interaction.create({
      actorId: currentUser._id,
      targetId,
      actionType,
      targetArtifact: target || null,
      letterContent: safeNote || null,
      cooldownExpiresAt: null,
    });

    // 3. CREATE INBOX NOTIFICATION
    const notification = await Notification.create({
      recipientId: targetId,
      senderId: currentUser._id,
      type: isTelegram ? 'priority_telegram' : 'new_letter',
      interactionRef: letterInteraction._id,
    });

    // 4. REAL-TIME SOCKET PING
    const io = req.app.get('io');
    if (io) {
      io.to(targetId.toString()).emit('new-letter', {
        type: isTelegram ? 'priority_telegram' : 'new_letter',
        senderName: currentUser.name,
      });
    }

    // 5. BACKGROUND PUSH
    addToQueue(() => sendPushNotification(targetId, {
      title: isTelegram ? 'Priority Telegram!' : 'New Letter!',
      body: `${currentUser.name} sent you a${isTelegram ? ' Telegram' : ' letter'}!`,
      data: {
        type: 'notification',
        notificationId: notification._id.toString(),
        interactionId: letterInteraction._id.toString(),
      },
    }));

    // 6. CHECK FOR MUTUAL MATCH
    const isMutual = await Interaction.findOne({
      actorId: targetId,
      targetId: currentUser._id,
      actionType: { $in: ['letter', 'telegram', 'accept_letter'] },
    });

    if (isMutual) {
      const pairKey = [currentUser._id.toString(), targetId.toString()].sort().join('__');

      // Atomic Upsert to prevent race conditions
      const match = await Alignment.findOneAndUpdate(
        { pairKey },
        {
          $setOnInsert: {
            pairKey,
            users: [currentUser._id, targetId],
          },
          $set: {
            isActive: true,
            unlockedByInteractionId: letterInteraction._id,
          },
        },
        { upsert: true, new: true }
      );

      // AUTO-GENERATE THE OPENING ICEBREAKER MESSAGE
      const senderProfile = await User.findById(currentUser._id).select('photos prompts');
      let msgData = {
        alignmentId: match._id,
        senderId: currentUser._id,
        type: 'opening_letter',
        text: safeNote || '',
        deliveryStatus: 'sent',
      };

      const target = req.body.target;
      if (target?.startsWith('photo_')) {
        const idx = parseInt(target.split('_')[1], 10);
        const url = senderProfile.photos?.[idx] || senderProfile.photos?.[0];
        if (url) {
          // `image` no longer written — it duplicated mediaUrl and nothing read it.
          // Readers still accept either field, so existing messages keep working.
          msgData.mediaUrl = url;
          msgData.text = safeNote || '';
        }
      } else if (target?.startsWith('prompt_')) {
        const idx = parseInt(target.split('_')[1], 10);
        const q = senderProfile.prompts?.[idx]?.question;
        if (q) {
          msgData.text = safeNote ? `"${q}"\n\n${safeNote}` : `"${q}"`;
        }
      }

      try {
        await Message.findOneAndUpdate(
          { alignmentId: match._id, type: 'opening_letter' },
          { $setOnInsert: msgData },
          { upsert: true }
        );
      } catch (err) {
        // E11000 = a concurrent request already created the opening letter.
        // That's the desired end-state, so swallow it. Anything else rethrow.
        if (err.code !== 11000) throw err;
      }

      const targetProfile = {
        _id: targetUser._id,
        name: targetUser.name,
        photos: targetUser.photos,
        bio: targetUser.bio,
        year: targetUser.year,
        // Same opt-out as the deck rows: someone who hides their campus does
        // not get it re-exposed through the match payload that follows a like.
        ...(targetUser.showCollege !== false && targetUser.college
          ? { college: targetUser.college, collegeCode: targetUser.collegeCode }
          : {}),
        pronouns: targetUser.pronouns,
        interests: targetUser.interests,
        prompts: targetUser.prompts,
        intent: targetUser.intent,
      };

      if (io) {
        io.to(targetId.toString()).emit('match-notification', {
          _id: match._id,
          alignmentId: match._id,
          interactionRef: letterInteraction._id,
          targetArtifact: target || null,
          letterContent: safeNote || null,
          user: targetProfile,
        });
      }

      return res.status(200).json({
        matched: true,
        ...(isTelegram && { super: true }),
        alignmentId: match._id,
        user: targetProfile,
      });
    }

    res.status(200).json({ matched: false, ...(isTelegram && { super: true }) });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: `Server error processing ${isTelegram ? 'Telegram' : 'letter'}` });
  }
};

/**
 * True when an error means "a concurrent request got there first".
 *
 * There are THREE distinct shapes of the same race, and fixing only the first one
 * leaves the 500 in place — which is exactly what happened when this was first
 * written to handle `VersionError` alone.
 *
 *  1. `VersionError` — "No matching document found for id … version N". The
 *     session EXISTED when we read it, and somebody else saved it before we did.
 *     This is the one the original report was about: two overlapping deck
 *     requests, only the second save rejected.
 *
 *  2. `MongoServerError` code 112 / "write conflict" — the write-conflict
 *     variant, where two saves interleave instead of arriving strictly in order.
 *
 *  3. `E11000` duplicate key on `viewerId_1` — the session did NOT exist when we
 *     read it, and by the time we tried to CREATE it, a concurrent request had
 *     created it first. The unique index (one live session per viewer, which is
 *     what stops two windows racing to define the order) rejects the second
 *     insert. This one is a correctness constraint working exactly as designed;
 *     the loser simply needs to re-read and use the winner's session.
 *
 * All three mean the same thing for the caller: the request that lost should
 * re-read current state and serve the page that follows it.
 */
const isConcurrentDeckRace = (err) => {
  if (!err) return false;
  if (err.name === 'VersionError') return true;
  if (err.name === 'MongoServerError' && (err.code === 112 || /write conflict/i.test(err.message || ''))) {
    return true;
  }
  /* E11000, but ONLY on the viewerId unique index. A duplicate key on some other
     collection is a genuine bug and must not be retried into obscurity. */
  if (err.code === 11000 || err.name === 'MongoServerError' && err.code === 11000) {
    return /discoversessions/i.test(err.message || '') && /viewerId/i.test(err.message || '');
  }
  return false;
};

/**
 * 📇 THE DECK HANDLER — one page of the viewer's ordered deck.
 *
 * Named rather than anonymous so the retry below can re-invoke it. It is NOT
 * mounted directly: see `serveDeck`.
 */
const buildDeckPage = async (req, res) => {
  try {
    const currentUser = req.user;
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);

    // Build exclusion set from the Interaction ledger
    const acted = await Interaction.find({
      $or: [
        { actorId: currentUser._id, actionType: { $in: ['letter', 'telegram', 'accept_letter', 'archive'] } },
        { targetId: currentUser._id, actionType: 'archive' },
      ],
    }).select('actorId targetId actionType cooldownExpiresAt').lean();

    const excludedIds = new Set();
    const now = new Date();
    for (const it of acted) {
      const otherId = it.actorId.toString() === currentUser._id.toString()
        ? it.targetId.toString()
        : it.actorId.toString();
      if (it.actionType === 'archive') {
        // Permanent archive (cooldownExpiresAt === null) always excludes
        // Temporary archive only excludes while cooldown is active
        if (!it.cooldownExpiresAt || new Date(it.cooldownExpiresAt) > now) {
          excludedIds.add(otherId);
        }
      } else {
        excludedIds.add(otherId);
      }
    }

    const blockExclusion = await getBlockExclusionQuery(currentUser._id);
    const blockedIds = blockExclusion._id?.$nin || [];
    blockedIds.forEach(id => excludedIds.add(id.toString()));
    excludedIds.add(currentUser._id.toString());

    /* 1 session per (viewer, scope) — toggling the chip swaps between them,
       never rebuilds. Both share one seen-list via their servedIds union so a
       card seen in Everyone can never come back in My campus or vice versa. */
    const campusOnly = String(req.query.campusOnly || '') === 'true';
    const sessionScope = campusOnly ? 'campus' : 'all';

    // Base filter — heavy $nin moved to Node.js memory filtering
    //
    // ⚠️ NOT filtered by college. This deck is PLATFORM-WIDE: an IIT Bombay
    // student should see IIT Delhi, NIT Trichy and everyone else, because the
    // product is an inter-college network, not one campus. A single IIT-sized
    // pool is thin once mutual gender filtering is applied on top.
    //
    // `?campusOnly=true` opts into the old narrow behaviour for users who want
    // it. It is a boolean rather than a college picker on purpose — allowing
    // "show me IIT Delhi only" would compound with gender and mutual filters
    // and is a reliable way to hand someone an empty deck with no explanation.
    const baseFilter = {
      isOnboarded: true,
      isVerified: true,
      suspended: { $ne: true },
      shadowbannedAt: null,
      isDeleted: { $ne: true },
    };

    if (campusOnly && currentUser.collegeCode) {
      baseFilter.collegeCode = currentUser.collegeCode;
    }


    const myGenders = (currentUser.interestedIn || []).filter((g) => g !== 'Everyone');
    if (myGenders.length > 0) {
      baseFilter.gender = { $in: myGenders };
    }

    // MUTUAL: only show candidates interested in my gender (or 'Everyone').
    // Candidates who never set a preference stay visible (treated as open).
    if (currentUser.gender) {
      baseFilter.$or = [
        { interestedIn: { $in: [currentUser.gender, 'Everyone'] } },
        { interestedIn: { $size: 0 } },
        { interestedIn: { $exists: false } },
      ];
    }

    /* 🎯 FULL-POOL RANKING — the whole candidate set, ranked by MongoDB.
     *
     * This used to be: roll a random point, fetch a hardcoded `.limit(80)`,
     * then RANK THOSE 80 IN JAVASCRIPT and take the best 10. That had a ceiling
     * nobody could see: with 50,000 eligible users only 80 were ever scored, so
     * anyone ranked 81st was unreachable no matter how many times you swiped.
     * The app could not see them, because it never looked.
     *
     * Ranking now happens inside MongoDB over every eligible document, so the
     * ceiling is gone at any pool size — 1k users or 1M, same query.
     *
     * `allowDiskUse` is required, not defensive: the sort key is COMPUTED
     * (see `$addFields` below), so no index can serve it and MongoDB must sort
     * the matched set in memory. Without this flag that sort fails with
     * Sort exceeded memory limit at large pool sizes, which would silently
     * reintroduce a cap somewhere much harder to detect.
     *
     * See models/User.js for why the deck's score sort deliberately has no
     * index behind it, and what the denormalized-field fix looks like. */

    /* Hours since lastActive, or null when the field is missing/unparseable.
       Mirrors the JS `Number.isFinite(lastSeenAt)` guard exactly — a profile
       with no usable timestamp must NOT silently become hoursSince = now, which
       would score it as ancient instead of unknown.

       `$lastActive` is a DATE and `now.getTime()` is a NUMBER, and MongoDB's
       `$subtract` refuses to mix the two (TypeMismatch: "can't $subtract date
       from double"). `$toLong` coerces the stored Date to epoch millis first.
       It returns null for a null input rather than erroring, so the missing-
       timestamp case still falls through to UNKNOWN_ACTIVITY_SCORE below. */
    const lastActiveMs = { $toLong: { $ifNull: ['$lastActive', null] } };
    const hoursSinceRaw = {
      $divide: [
        { $subtract: [now.getTime(), lastActiveMs] },
        60 * 60 * 1000,
      ],
    };

    /* The two live signals, re-weighted to fill the range. Compatibility used
       to be 50% of this and is gone: it was computed from a per-user answer
       array no client could ever fill, so `compatRaw` was always null and the
       term silently contributed 0 to every candidate. */
    const recencyExpr = {
      $cond: [
        { $ne: [{ $ifNull: ['$lastActive', null] }, null] },
        {
          $exp: {
            $multiply: [
              -Math.LN2 / RECENCY_HALF_LIFE_HOURS,
              /* Clamp at 0: a `lastActive` in the future (clock skew, a bad
                 write) would otherwise produce a NEGATIVE exponent and score
                 above 1.0, putting the profile permanently on top. */
              { $max: [0, { $ifNull: [hoursSinceRaw, 0] }] },
            ],
          },
        },
        UNKNOWN_ACTIVITY_SCORE,
      ],
    };

    const completenessExpr = {
      $cond: [
        {
          $and: [
            { $gte: [{ $size: { $ifNull: ['$photos', []] } }, 4] },
            { $gte: [{ $size: { $ifNull: ['$prompts', []] } }, 3] },
            { $gt: [{ $strLenCP: { $ifNull: ['$bio', ''] } }, 10] },
          ],
        },
        1.0,
        0.5,
      ],
    };

    const hybridExpr = {
      $add: [
        { $multiply: [recencyExpr, 0.6] },
        { $multiply: [completenessExpr, 0.4] },
      ],
    };

    /* The ranked WINDOW, not just the visible page.
       Ranking returns the top slice, but this deliberately keeps a headroom
       buffer above `limit` because exclusions (passed/liked/blocked) are
       applied in Node memory right after — see the comment there. Ranking
       straight to `limit` would mean a heavy swiper gets 6 cards back because
       4 of the top 10 were people they'd already passed. */
    /* `DECK_FIELDS` is the public allowlist (utils/publicCard.js). It is
       projected in the pipeline for the same reason the old `.select()` did: an
       aggregation with no `$project` ships the WHOLE user document over the wire
       from MongoDB, including `email`, `shadowbanScore` and `adminNotes`.
       Those never reached the client before and still don't (toPublicCard
       allowlists the response), but pulling them into route memory for 60
       candidates per request is waste and widens the blast radius if this route
       ever throws one of them into a log. */
    const DECK_PROJECTION = Object.fromEntries([
      ...CARD_FIELDS_SELECT.split(/\s+/).filter(Boolean).map((f) => [f, 1]),
      ['_recency', 1],
      ['hybridScore', 1],
      /* Viewer-relative, so it is added here rather than listed in
         CARD_FIELDS — that list is STORED fields, and this number does not exist
         on the document. Carried through so the card can be labelled.

         ⚠️ This is an INDEX into DISTANCE_BANDS, not a distance and not
         coordinates. It reveals "which of four buckets these two people are
         in", which is the intended coarse signal, and nothing finer. */
      ['_bandIndex', 1],
    ]);

    /* 🃏 WINDOW SIZE — how many ranked ids a session stores.

   500, not 60. An earlier version of this file kept P1's `limit * 6` headroom
   buffer (60 at a 10-card page), which was correct for the single-page
   over-fetch it was written for but wrong once P2 made the window a per-session
   supply: at 60 a user exhausted it in six pages and the deck rebuilt every
   couple of minutes, which is the reshuffle churn P2 exists to remove.

   500 ids is ~12KB per session and covers 50 pages — roughly 25 minutes of
   swiping at a normal pace, which is the 30-minute session lifetime. Two
   consequences worth keeping in mind:

     - Duplicates are now impossible by CONSTRUCTION regardless of this number,
       because the order is decided once. This is purely how long a session
       lasts before rebuilding.
     - A bigger window means a bigger Mongo read per session build. 500 docs is
       nothing; do not raise it much past this without reconsidering. */
const RANK_WINDOW = 500;

    /* ── SESSION HANDLING ──────────────────────────────────────────────────
     *
     * Everything below is about answering one question: has this viewer's deck
     * order already been decided?
     *
     *  - No session, or the session is older than SESSION_IDLE_MINUTES
     *      → RANK a fresh window and write it down.
     *  - Live session with cards left
     *      → read the next ids from the order that was already decided.
     *  - Live session, window exhausted
     *      → rank a NEW window that skips everything already served, if anyone
     *        eligible is left at all. If nobody is, the deck is genuinely over
     *        and we say so instead of re-serving the same exhausted ids.
     */
    const isLive = (session) =>
      !!session &&
      session.rankingVersion === RANKING_VERSION &&
      Date.now() - session.lastSeenAt.getTime() < SESSION_IDLE_MINUTES * 60 * 1000;

    /* Rank a window of ids, skipping anyone already excluded or already served
       this session. Shared by the first build and every extension so the
       ordering rules cannot drift between the two paths.

       `skipSet` holds STRINGS. It originally held ObjectIds, which made every
       `skip.includes(u._id.toString())` check compare an ObjectId against a
       string and return false — so nothing was ever skipped, and a window
       extension re-ranked the pool and handed back the SAME people it had
       already served. The deck looped forever on 60 cards instead of advancing.
       Both sides of every id comparison in this file are `.toString()` for the
       same reason. */
    /* 📍 DISTANCE RANKING — degrades safely to "off".
     *
     * The viewer's own location counts only if it is present AND fresh (geo.js
     * enforces the 30-day window). When it is not — permission declined, never
     * granted, or a reading older than the TTL — `viewerPoint` stays null and
     * the distance stages are OMITTED from the pipeline entirely rather than
     * being computed as zero.
     *
     * That branch matters more than it looks: a viewer with no location falls
     * back to the pure quality ranking, and is never shown everyone as "0km
     * away". */
    const myCollege = currentUser.collegeCode
      ? await College.findOne({ code: currentUser.collegeCode }).select('latLng').lean()
      : null;
    const myCollegePoint = sanitizeLatLng(myCollege?.latLng);

    /* 📍 CAMPUS IS THE BASE; A PERSONAL POSITION IS A REFINEMENT.
     *
     * This used to be `viewerPoint = personal || null`, and the whole distance
     * layer was skipped when that was null. That made distance ranking a
     * GPS-only feature: a student who tapped "Not now" — which is a first-class
     * answer we offer and never penalise — silently got NO distance ordering at
     * all, even though their campus has a position sitting in the database
     * ready to use.
     *
     * Campus positions are public information about a building, so using one
     * requires no consent and discloses nothing about the person. A personal
     * position is sensitive even rounded to a kilometre, so it is only ever an
     * improvement on top of a signal that already works without it.
     *
     *   personal, fresh  → measure from it (knows they're at home for a break)
     *   otherwise        → measure from their campus (assumes they're there)
     *   neither          → no distance ranking, intent and quality only
     *
     * A personal reading that has gone stale past the TTL also falls back to the
     * campus, rather than dropping the viewer out of distance ranking entirely. */
    const personalPoint = isFreshLocation(currentUser, now)
      ? sanitizeLatLng(currentUser.currentLatLng)
      : null;
    const viewerPoint = personalPoint || myCollegePoint;

    /* Within this distance the viewer counts as being AT their campus, so their
       own college is what the reserved slots come from. Beyond it — on a
       summer break at home, say — the viewer is simply somewhere else, and the
       cap drops so nearest-people fills the page instead. Without this the
       reserved slots would be served from a campus 1,400km away, which is how a
       "campus" deck becomes useless in July.
     *
     * 30km is the same threshold as the "Near you" band, so it reads as "I am at
     * my campus" rather than as an unexplained constant. */
    const OWN_CAMPUS_KM = 30;
    const atOwnCampus = !!viewerPoint && !!myCollegePoint
      && haversineKm(viewerPoint, myCollegePoint) <= OWN_CAMPUS_KM;

    /* Hard ceiling on the share of a window that may come from the viewer's own
       college, so one campus cannot monopolise a deck that is meant to be
       inter-college. A SHARE rather than a literal "2 per page" because the
       session stores one flat ordered list, not discrete pages — a hard per-page
       guarantee would mean interleaving the list, and a share delivers the same
       outcome (roughly two cards in every ten) without that machinery. */
    const OWN_COLLEGE_SHARE = 0.2;

    /* The ranking stages, shared by BOTH consumers.
       ⚠️ They MUST stay shared. `hybridScore` and `_bandIndex` are computed by
       these stages and are NOT stored on the User document, so any path that
       reads candidates with a plain `User.find().select()` silently gets
       `undefined` for them — every card then renders with score 0 and no
       distance label, and nothing errors. That is exactly what happened when
       pages were served from a stored session while ranking still happened in
       the aggregation: the ordering was correct but every value shown on the
       card was blank. */

      /* Degrees→radians factor for the aggregation-side haversine below. Mongo's
       $sin/$cos take radians, so every angle in that expression is scaled by
       this. Declared here rather than inline so the two `$multiply` sites stay
       visibly identical — a mismatch between them is a silent wrong answer, not
       an error. */
    const rad = Math.PI / 180;

    const distanceStages = viewerPoint
        ? (() => {
            /* ⚠️ MONGO EVALUATES `$cond` BRANCHES EAGERLY. A branch that guards
               "only compute the distance when coordinates exist" still has its
               arithmetic executed, so a college with no latLng makes
               `$subtract: ['$_c.latLng.0', 19.07]` fail the WHOLE aggregation
               with "can't $subtract double from array" — taking down the deck
               for every viewer.

               So the coordinates are normalised to plain numbers FIRST, with an
               in-range placeholder used when they are genuinely absent. For a
               campus with no position the distance that comes out is therefore
               meaningless — (0,0) is in the Gulf of Guinea, so it always exceeds
               300km and lands in band 3, which is exactly where an unpositioned
               campus is meant to go. That is a happy accident, not the design:
               the design is that it must never THROW, and normalising first is
               what guarantees that. */
            const dLat = { $multiply: [{ $subtract: ['$_lat1', viewerPoint[0]] }, rad] };
            const dLng = { $multiply: [{ $subtract: ['$_lng1', viewerPoint[1]] }, rad] };
            const lat1 = { $multiply: [viewerPoint[0], rad] };
            const lat2 = { $multiply: ['$_lat1', rad] };
            const hav = {
              $add: [
                { $pow: [{ $sin: { $divide: [dLat, 2] } }, 2] },
                {
                  $multiply: [
                    { $cos: lat1 },
                    { $cos: lat2 },
                    { $pow: [{ $sin: { $divide: [dLng, 2] } }, 2] },
                  ],
                },
              ],
            };
            const km = {
              $multiply: [6371, { $multiply: [2, { $asin: { $sqrt: { $min: [1, hav] } } }] }],
            };
            /* A card's band comes from its COLLEGE's position, not the person's
               own coordinates. Every student at one campus would otherwise get a
               different band for standing in a different building, and the campus
               is the meaningful unit for a campus product. A candidate's own GPS
               is used for nothing on anyone else's card.

               ⚠️ A CAMPUS WITH NO POSITION MAPS TO BAND 3 — THE UNLABELLED
               CATCH-ALL — NOT TO A SEPARATE BUCKET BEHIND EVERYTHING.
               This is deliberately different from a missing VIEWER location, and
               the distinction matters:

                 - No VIEWER location  → we do not know where this person is.
                   Distance ranking switches off entirely (see `viewerPoint`).
                 - No CAMPUS position → we do not know where this BUILDING is.
                   That is an incomplete dataset, not a fact about the person, and
                   most colleges will have no coordinates at all: the
                   CollegeRequest → admin flow never asks for them.

               Sorting the second case last put every student of every
               un-coordinated campus behind every located user, for EVERY viewer,
               with no way to recover — a whole campus made invisible by a missing
               field. Band 3 renders NO LABEL, so no false "Further away" is ever
               claimed; these cards simply compete on intent and quality alongside
               genuinely distant people, which is what they should do. */
            const bandIndex = {
              $cond: [
                { $lte: [km, 30] }, 0,
                { $cond: [{ $lte: [km, 100] }, 1, { $cond: [{ $lte: [km, 300] }, 2, 3] }] },
              ],
            };
            return { bandIndex, km };
          })()
        : null;

      /* Intent as a RANKING SIGNAL ONLY — never a filter.
       * Filtering on it was explicitly rejected: on a small campus it would
       * empty the deck entirely, and an empty deck with no explanation is the
       * failure mode this whole ranking rewrite exists to remove. Matching intent
       * moves you up; it never removes anyone. */
      const myIntent = Array.isArray(currentUser.intent) ? currentUser.intent : [];
      const intentMatchExpr = myIntent.length
        ? {
            $cond: [
              {
                $gt: [
                  { $size: { $setIntersection: [{ $ifNull: ['$intent', []] }, myIntent] } },
                  0,
                ],
              },
              1,
              0,
            ],
          }
        : 0;

      /* 🆕 COLD-START EXPOSURE — A BOUNDED RESERVATION, NOT A SCORE BOOST.
     *
     * A profile below LADDER.publish scores 0.5 on completeness instead of 1.0,
     * which puts it below every finished profile in its band. At pool sizes past
     * the 500-id window that means a new user with three photos never enters the
     * window at all — never seen, never told why, never fixes the profile. The
     * deck would enforce a standard it gives the person no way to meet.
     *
     * The ladder exists to gate INTERACTION, not visibility. That gate reads the
     * VIEWER's own score, so a qualified viewer can still like a promoted
     * profile — promoting one costs nothing and wastes no action.
     *
     * ⚠️ WHY THIS IS A QUOTA AND NOT A BONUS ADDED TO THE SCORE. Two attempts at
     * an additive bonus were tried and both were wrong:
     *   +0.15 was silently inert — completeness is a STEP worth a flat 0.2 at
     *   recency 1.0, so a bonus smaller than 0.2 can never move a profile across
     *   the very boundary it exists to cross.
     *   +0.25 worked but then outranked a score-80 profile with a full profile,
     *   because 0.8 + 0.25 > 1.0. Promoting an empty profile above a strong one
     *   is worse than the invisibility it was meant to fix.
     * There is no additive value that is both big enough to help and small
     * enough to be safe. So the reservation is applied to POPULATION instead:
     * a fixed slice of the window is filled with below-publish profiles, ranked
     * among themselves by score. Bounded, so it cannot invert anyone's ranking
     * beyond that slice, and it keeps `hybridScore` the honest formula so the
     * impression log stays a clean baseline for the next ranking change. */
    const COLD_START_SHARE = 0.1;

    const rankStages = () => {
        const stages = [];

        /* Campus position, for distance and for the own-college share. Only
           joined when there is actually a viewer location to measure from — an
           unnecessary $lookup on every request would be pure cost. */
        if (viewerPoint) {
          stages.push(
            {
              $lookup: {
                from: 'colleges',
                localField: 'collegeCode',
                foreignField: 'code',
                as: '_c',
                pipeline: [{ $project: { code: 1, latLng: 1 } }],
              },
            },
            { $unwind: { path: '$_c', preserveNullAndEmptyArrays: true } },
          );
        }

        /* Normalise the campus position to plain numbers before any arithmetic
           touches it — see the eager-$cond note in distanceStages. */
        if (distanceStages) {
          stages.push({
            $addFields: {
              /* `$arrayElemAt`, NOT the dotted path '$_c.latLng.0'.
                 Inside a `$cond` the dotted form silently evaluates to an EMPTY
                 ARRAY rather than the first element, so `$subtract` then failed
                 with "can't $subtract double from array" and took the whole
                 aggregation — and therefore the entire deck — down.
                 `$arrayElemAt` is explicit about indexing and cannot be
                 reinterpreted. */
              _lat1: { $arrayElemAt: [{ $ifNull: ['$_c.latLng', []] }, 0] },
              _lng1: { $arrayElemAt: [{ $ifNull: ['$_c.latLng', []] }, 1] },
            },
          });
        }

        stages.push({
          $addFields: {
            _recency: recencyExpr,
            _completeness: completenessExpr,
            hybridScore: hybridExpr,
            /* ⚠️ `_intentMatch` IS NOT CONDITIONAL. It used to sit inside the
               `...(distanceStages ? …)` spread alongside `_bandIndex`, which
               coupled intent ranking to having GPS enabled: a viewer who declined
               the permission prompt silently got NO intent ranking at all, even
               though intent is a profile field they filled in themselves and has
               nothing to do with location.

               Two of these bugs were stacked — the viewer's intent was also not
               selected in middleware/auth.js — so intent ranking had never once
               actually run for anyone. It only appeared to work in tests that
               happened to have location switched on. Distance and intent are
               independent signals and must be gated independently. */
            _intentMatch: intentMatchExpr,
            /* Only `_bandIndex` is conditional, because it genuinely cannot be
               computed without a position to measure from. */
            ...(distanceStages ? { _bandIndex: distanceStages.bandIndex } : {}),
          },
        });

        /* 📍 NEAREST FIRST, then shared intent, then quality. */
        if (viewerPoint) {
          /* `_bandIndex` is always 0–3 now, including for a campus with no
             coordinates, so this sort is a plain ascending sort on it. Kept as a
             separate projected field because $project runs AFTER the sort and
             the sort key is deliberately not on the public card. The $ifNull is
             a safety net only: if `_bandIndex` were ever absent it would sort
             last rather than first, since Mongo sorts null before every number
             in an ascending sort. */
          stages.push({ $addFields: { _sortBand: { $ifNull: ['$_bandIndex', 3] } } });
        }

        /* ⚠️ NO `$project` HERE.
           Projection must be the LAST stage. DECK_PROJECTION is an inclusion
           list, and `_sortBand` — the field the whole distance ranking sorts on
           — is deliberately not on a public card. Projecting before the sort
           therefore deleted the sort key, Mongo silently sorted on a missing
           field, and every card came back ordered by quality alone with the
           bands applied but never acted on. Labels still looked correct, which
           made it look like ranking worked. Each caller appends $project itself. */
        return stages;
      };

      const rankWindow = async (skipIds) => {
        const skipSet = new Set([...skipIds].map((id) => id.toString()));

        /* ⚠️ SINGLE SOURCE OF TRUTH. This is the ranked query's own row limit,
           and the `poolExhausted` guard further down compares the result against
           it to decide whether the pool has anything left to give. Written out in
           both places it would drift the moment either was edited — and it would
           drift SILENTLY, in the direction of running an unnecessary full scan on
           every window build. */
        const FETCH_CAP = RANK_WINDOW + Math.min(skipSet.size, MAX_SESSION_SERVED);

      /* 📍 Distance, computed IN MONGO for the same reason the score is: doing
         it in JavaScript would mean fetching candidates first, which is the
         ceiling bug from P1 all over again.

         Built ONLY when there is a viewer position. These expressions index
         `viewerPoint[0]` eagerly while the pipeline is assembled, so
         constructing them unconditionally throws a TypeError on a viewer who
         has no location — which is the majority of users until the onboarding
         step ships. */

      const docs = await User.aggregate([
        { $match: baseFilter },

        ...rankStages(),
        /* Sort and limit live HERE, not in rankStages(): building a window needs
           them, but serving a page from a stored session must NOT re-sort — the
           session's order IS the contract P2 exists to keep, and sorting again
           would re-decide exactly what we promised to freeze. */
        /* 📍 NEAREST FIRST, then shared intent, then quality.
           `_sortBand` only exists when there is a position to measure from, so
           it is spread in — `_intentMatch` is always present and always
           sorted, whether or not the viewer shared a location. */
        {
          $sort: viewerPoint
            ? { _sortBand: 1, _intentMatch: -1, hybridScore: -1 }
            : { _intentMatch: -1, hybridScore: -1 },
        },
        /* Over-fetch past the window so post-filter survivors still fill it. */
        { $limit: FETCH_CAP },
        { $project: DECK_PROJECTION },
      ], { allowDiskUse: true });

      let eligible = docs
        .filter((u) => !skipSet.has(u._id.toString()))
        .filter((u) => !excludedIds.has(u._id.toString()));

      /* 🆕 COLD-START RESERVATION — see COLD_START_SHARE for why this is a quota
         and not a score bonus.

         Operates on POPULATION: the below-publish profiles already present in the
         ranked batch are kept exactly where their rank put them — they earned
         that position — and the reservation is topped up from DEEPER in the pool,
         which is the part that matters. Only those topped-up profiles are
         repositioned. */
      const reserve = Math.floor(RANK_WINDOW * COLD_START_SHARE);
      if (reserve > 0) {
        const isCold = (u) => (u.profileScore ?? 0) < LADDER.publish;
        const inBatch = eligible.filter(isCold).length;

        /* ⛔ SKIP WHEN THE POOL IS SMALLER THAN THE WINDOW.
           If the ranked batch came back short, the database already told us it
           has nothing more to give — a second scan cannot find anything, it can
           only re-read a pool we have completely seen. This fired on every single
           deck request for any viewer whose pool was under 500, which is every
           viewer on a small campus.

           Compared against the query's OWN limit, not the bare window size. The
           limit is `RANK_WINDOW + skipSet.size`, so on a window extension a pool
           of exactly 500 would return 500 rows and compare as "full" even though
           500 minus the skipped ids means there is genuinely nothing left — one
           wasted scan on the boundary. */
        const poolExhausted = docs.length < FETCH_CAP;

        if (inBatch < reserve && !poolExhausted) {
          /* ⚠️ `$and: [baseFilter, …]`, NOT `{ ...baseFilter, $or: … }`.
             `baseFilter` already carries a `$or` — the mutual-preference filter
             that keeps the deck to people who are interested in the viewer AND
             who are interested in the viewer. Spreading the filter into a new
             object and then adding `$or` REPLACES that key, silently dropping the
             preference. The first version of this block did exactly that, which
             meant the 50 reserved slots could contain people the viewer had
             explicitly said they were not interested in — spread through their
             deck rather than buried, which is far worse than the invisibility the
             reservation exists to fix.

             Wrapping in `$and` keeps every key of baseFilter intact. */
          const COLD_FILTER = {
            $or: [
              { profileScore: { $lt: LADDER.publish } },
              { profileScore: { $exists: false } },
            ],
          };

          /* Same ranking stages as the main query — the campus lookup, the band
             calculation, the intent match. The first version ran a bare
             `sort: { hybridScore: -1 }` with no campus lookup at all, so reserved
             profiles were ordered without knowing where anyone was and could be
             placed ahead of someone standing next to the viewer. Sharing the
             stages also means the two queries cannot drift apart in future. */
          const deeper = await User.aggregate([
            { $match: { $and: [baseFilter, COLD_FILTER] } },
            ...rankStages(),
            {
              $sort: viewerPoint
                ? { _sortBand: 1, _intentMatch: -1, hybridScore: -1 }
                : { _intentMatch: -1, hybridScore: -1 },
            },
            /* Over-fetch: some will already be in the ranked batch, or excluded,
               and are filtered out below. */
            { $limit: (reserve - inBatch) * 4 + 20 },
            { $project: DECK_PROJECTION },
          ], { allowDiskUse: true });

          const seenInBatch = new Set(eligible.map((u) => u._id.toString()));
          const extra = deeper
            .filter((u) => !seenInBatch.has(u._id.toString()))
            .filter((u) => !skipSet.has(u._id.toString()))
            .filter((u) => !excludedIds.has(u._id.toString()))
            .filter(isCold)
            .slice(0, reserve - inBatch);

          if (extra.length) {
            /* 👉 SPREAD, DON'T PREPEND. These profiles were outside the window
               entirely; stepping them into even gaps keeps them visible without
               costing the viewer their first screen. Newcomers already inside the
               ranked batch are untouched and keep their real position. */
            const alreadyIn = new Set(extra.map((u) => u._id.toString()));
            eligible = spreadReserved(
              eligible.filter((u) => !alreadyIn.has(u._id.toString())),
              extra,
            );
          }
        }
      }

      /* 🎓 OWN-COLLEGE SHARE.
         Without a cap, a single-campus user sees their own college over and
         over and meets nobody — the product is an inter-college network, so a
         deck that is 100% your own campus is a failure even though it is
         "correct" by every ranking rule.

         ⚠️ ONLY APPLIES WHEN THE VIEWER IS ACTUALLY AT THEIR CAMPUS. On a
         break trip `atOwnCampus` is false, the reserved slots are dropped, and
         the nearest people fill the page instead. Reserving campus slots for
         someone 1,400km from that campus would hand them a deck made entirely of
         people they cannot meet, which is the summer-break problem this whole
         distance layer exists to solve.

         Applied AFTER ordering rather than inside the query, so it never changes
         WHICH people rank highest — only how many are the same campus. */
      if (!atOwnCampus) return eligible.slice(0, RANK_WINDOW);

      const cap = Math.max(2, Math.ceil(RANK_WINDOW * OWN_COLLEGE_SHARE));
      const mine = [];
      const others = [];
      for (const u of eligible) {
        (u.collegeCode && u.collegeCode === currentUser.collegeCode ? mine : others).push(u);
      }
      const keptMine = mine.slice(0, cap);
      const overflow = mine.slice(cap);
      others.push(...overflow);

      /* Spread the kept own-college cards evenly through the window so no page
         ends up dominated by them. Deterministic given a fixed order, which
         matters because the whole point of P2 is that the order does not move
         between requests. */
      const out = [];
      const stride = keptMine.length ? Math.max(1, Math.floor(others.length / keptMine.length)) : 1;
      let mi = 0;
      let nextMineAt = 0;
      for (const o of others) {
        out.push(o);
        if (mi < keptMine.length && others.length && out.length >= nextMineAt) {
          out.push(keptMine[mi++]);
          nextMineAt += stride;
        }
      }
      while (mi < keptMine.length) out.push(keptMine[mi++]);

      return out.slice(0, RANK_WINDOW);
    };

    /* Scope toggles do NOT rebuild: each scope keeps its own frozen order and
       cursor, and switching simply resumes the other scope's cursor. A fresh
       order is only built when the current one exhausts or idle timeout hits. */
    let session = await DiscoverSession.findOne({ viewerId: currentUser._id, scope: sessionScope });
    let rebuiltWindow = false;

    if (!isLive(session)) {
      /* Fresh session. Any previous window is overwritten rather than extended:
         past SESSION_IDLE_MINUTES the user has been away, and carrying the old
         order forward is the one thing that would make "new cards" not new. */
      const window = await rankWindow([]);

      if (session) {
        session.userIds = window.map((u) => u._id);
        session.cursor = 0;
        session.servedIds = [];
        session.rankingVersion = RANKING_VERSION;
        session.lastSeenAt = now;
        await session.save();
      } else {
        session = await DiscoverSession.create({
          viewerId: currentUser._id,
          scope: sessionScope,
          userIds: window.map((u) => u._id),
          cursor: 0,
          servedIds: [],
          rankingVersion: RANKING_VERSION,
          lastSeenAt: now,
        });
      }
      /* Deliberately left false. A first-ever build has no previous order to
         compare against, so there is nothing for the client to announce — every
         card is new by definition. The flag means "the order you were mid-way
         through has changed", which only an extension can do. */
      rebuiltWindow = false;
    } else {
      session.lastSeenAt = now;
    }

    /* Scan forward from the cursor until `limit` cards survive the exclusions.
       Scanned-not-returned ids are consumed permanently — that is the whole
       point of an index-based cursor, and it is why a page can come back short
       without those people reappearing on the next page.

       ⚠️ A FUNCTION, because it has to run a SECOND time after a window
       rebuild. It used to be an inline `while` loop that ran once, and the
       rebuild branch underneath reset the cursor to 0 over a fresh 500 ids and
       then returned without ever reading them — so the response carried NO
       cards while `hasMore` was true (`0 < 500`). The client saw "more available",
       asked again, got nothing, and asked again: an unbounded request loop,
       each iteration re-ranking the pool and rewriting the session. */
    const SCAN_CHUNK = Math.max(limit * 4, 40);

    const scanFrom = async (windowIds, startCursor) => {
      const collected = [];
      let cursor = startCursor;

      while (collected.length < limit && cursor < windowIds.length) {
        const slice = windowIds.slice(cursor, cursor + SCAN_CHUNK);
        if (slice.length === 0) break;

        /* ⚠️ MUST go through the same ranking stages as the window build.
         This used to be `User.find({_id:{$in:slice}}).select(DECK_PROJECTION)`,
         which is a QUERY. `hybridScore` and `_bandIndex` are computed by the
         aggregation and are not stored on the document, so a query projection
         cannot return them — every card served from a stored session came back
         with score 0 and no distance label, silently, with no error anywhere.

         That mattered because serving from the session is the NORMAL path once a
         deck is under way; only the very first request of a session reads values
         straight from the window build. */
        const found = await User.aggregate([
          { $match: { _id: { $in: slice } } },
          ...rankStages(),
          { $project: DECK_PROJECTION },
        ], { allowDiskUse: true });
        const byId = new Map(found.map((u) => [u._id.toString(), u]));

        let scannedCount = 0;
        for (const id of slice) {
          scannedCount += 1;
          const u = byId.get(id.toString());
          if (u && !excludedIds.has(u._id.toString())) collected.push(u);
          if (collected.length >= limit) break;
        }
        cursor += scannedCount;
      }
      return { collected, cursor };
    };

    let { collected, cursor } = await scanFrom(session.userIds, session.cursor);
    session.cursor = cursor;

    /* Window exhausted mid-session. Rank a fresh one that skips everything this
       session has already shown — being shown is not an Interaction, so the
       ledger above cannot know about them. */
    let deckExhausted = false;
    if (collected.length < limit && session.cursor >= session.userIds.length) {
      const alreadyServed = new Set([
        ...session.servedIds.map((id) => id.toString()),
        ...session.userIds.map((id) => id.toString()),
      ]);
      const fresh = await rankWindow(alreadyServed);

      if (fresh.length > 0) {
        session.userIds = fresh.map((u) => u._id);
        session.cursor = 0;
        rebuiltWindow = true;
        /* 👉 SERVE FROM THE WINDOW WE JUST BUILT. Without this second scan the
           response returned whatever the first scan managed to collect — usually
           nothing — while `hasMore` was true. The user is left staring at an
           empty deck that claims to have more, which is both a visible dead end
           and the trigger for the request loop above.

           `rankWindow` already filters against `alreadyServed`, so the fresh ids
           are strictly new and this cannot cycle: each rebuild strictly enlarges
           the set of people this session can still show. */
        ({ collected, cursor } = await scanFrom(session.userIds, 0));
        session.cursor = cursor;

        /* Belt and braces. If the fresh window somehow yields nothing servable
           there is no point reporting "more available" — say so instead, so the
           client stops asking. */
        if (collected.length === 0) deckExhausted = true;
      } else {
        /* Nobody eligible left anywhere in the system. Hand back what this page
           managed to collect and let `deckExhausted` tell the client to stop —
           re-serving the exhausted window is what produces the "endless deck"
           feeling, and it is a lie about there being anyone left. */
        deckExhausted = true;
      }
    }

    /* Every id actually handed out this session, for the next extension.

       ⚠️ NO DEDUP HERE. This used to be
       `.filter((id, i, arr) => arr.findIndex(...) === i)` — O(n²) with a
       `.toString()` allocated inside the inner comparison, roughly 125,000
       string comparisons once a session had served 500 cards, on the hottest
       route in the app.

       It was also pointless: `servedIds` is read in exactly one place, and that
       place builds a `Set` from it two lines later, which de-duplicates for
       free. Storing duplicates costs a little space; scanning for them on every
       page costs a great deal. A duplicate would also be harmless — the Set
       collapses it before anything can act on it.

       The array is still capped by the 30-minute session lifetime, so it cannot
       grow without bound within a session. */
    session.servedIds = [...session.servedIds, ...collected.map((u) => u._id)];

    /* Cards handed out in this session BEFORE this page. Used as the first card's
       `deckPosition`, and as the base the running total is incremented from once
       this page's real size is known (below, after exclusions have run).

       Read HERE rather than inline at the impression call, because by then
       `session.cardsServed` has already been advanced by this page — so reading
       it late would label every card one page too deep. */
    const startPosition = session.cardsServed || 0;

    /* NO SAVE HERE. The cursor, `servedIds` and `cardsServed` are all written by
       the single save below, once the page's card count is known. Splitting this
       across two saves doubled the window in which a concurrent request could
       bump the session version and get THIS request rejected with a
       `VersionError` — the intermittent 500 this retry now catches. */
    /* Shapes and strips happen only on the cards actually returned. */
    const eligibleBatch = collected;

    /* Calculate the ranking score.
       Compatibility used to be 50% of this. It is gone: it was computed from
       a per-user answer array that no client could ever fill (the questions were
       served by /config but rendered nowhere), so `compatRaw` was always null
       and the term silently contributed 0 for every candidate. The two live
       signals are re-weighted to fill the range instead of being left summing to
       0.8, which would have compressed every score into the top 40% of the band
       and made the sort close to arbitrary. */
    /* Both `_recency` and `hybridScore` are now COMPUTED BY MONGO in the
       `$addFields` stage above, not here. Re-deriving them in JavaScript would
       be the old bug in a new place: two implementations of one formula that
       drift apart, and the JS one would silently disagree with the sort that
       actually ordered the results. Read them off the document. */
    const scoredUsers = eligibleBatch.map((u) => {
      const recencyScore = u._recency ?? UNKNOWN_ACTIVITY_SCORE;
      const hybridScore = u.hybridScore ?? 0;

      /* 🔒 CAMPUS BADGE — strip it server-side when the person opted out.
       *
       * Done HERE rather than in CSS on purpose. Hiding the field client-side
       * still ships it over the wire, so anyone opening devtools would see
       * every card's college regardless of the setting — the toggle would be a
       * decoration rather than the privacy control it claims to be. Removing it
       * here means the data never leaves the database.
       *
       * Keyed on EACH CARD's own `showCollege`, never the viewer's: this
       * controls whether people can see YOU, and says nothing about what you
       * are allowed to see. A user with the badge off is still shown college
       * names on other people's cards. */
      /* Campus-badge stripping and the dob→age derivation live in
         utils/publicCard.js so the `profile-updated` broadcast (routes/users.js)
         projects fields identically. Duplicating this is how the badge ends up
         hidden in the deck but shipped over the wire in the live path. */
      const shaped = { ...toPublicCard(u), hybridScore, _recency: recencyScore };

      /* 📍 Coarse distance label — a BAND, never a distance and never
       * coordinates. `bandFor` is given the band index rather than a km value
       * because the km value is deliberately not computed in JavaScript or
       * carried on the document; only the bucket crosses this boundary.
       *
       * Band 3 resolves to `label: null` and so renders nothing — labelling
       * every distant stranger "Elsewhere in India" is noise, and the college
       * badge already carries the useful part of that information.
       *
       * A missing band (viewer has no location, or the campus has no map
       * position) leaves `distanceBand` undefined, which is the correct output:
       * no label at all, rather than a wrong or "nearby" one. */
      const band = bandFromIndex(u._bandIndex);
      if (band && band.label) shaped.distanceBand = band.label;
      /* _id is appended AFTER toPublicCard's allowlist on purpose — see the note
         in recordImpressions. The deck client needs it to key the card stack, and
         the impression log needs it as candidateId. It carries no profile data. */
      shaped._id = u._id;
      return shaped;
    });

    /* NO re-sort here. MongoDB already returned these in descending
       hybridScore order via `$sort`. Re-sorting in JS looks harmless but
       reintroduces exactly the bug we just fixed: it would re-rank only the
       RANK_WINDOW slice, silently making anyone outside that window
       unreachable again — the ceiling, just wearing a different hat. */
    const finalDeck = scoredUsers.slice(0, limit);

    /* Fold this page's real card count into the session's own running total.

       `scoredUsers.length`, not `finalDeck.length` and not `collected.length`:
         • `collected` over-collects on purpose so the scan can satisfy `limit`
           after exclusions, so it overstates the count on most pages.
         • `finalDeck` is capped at `limit`, so on a SHORT page — the last page of
           a deck, or one where exclusions ate most of the batch — it would
           understate it.
       `scoredUsers` is what actually survives exclusion, so its length is the
       page's true size either way.

       ONE save, not two. An earlier version saved a second time here, because
       `finalDeck` was originally declared below this point. That doubled the
       window in which a concurrent request could bump the session version and
       reject THIS save — which is how a normal page load started returning
       intermittent 500s. The field is set before the single save at the end of
       the scan instead. */
    session.cardsServed = startPosition + scoredUsers.length;
    await session.save();

    /* 📊 IMPRESSION LOG — fire-and-forget, never awaited.
     *
     * One row per card actually returned. This is the baseline the ranking
     * rewrite is measured against, so it has to be recording from BEFORE that
     * change ships — afterwards, the "before" ordering can no longer be
     * reconstructed. See models/DeckImpression.js for why likes and passes
     * alone cannot substitute for it.
     *
     * `deckPosition` continues from where this viewer left off, which is why it
     * is computed from the count already served rather than restarting at 0 for
     * every page.
     *
     * `sessionId` is the DiscoverSession that defined this page's ORDER, not a
     * client-supplied value. Taking it from the query string would let a caller
     * mislabel which ordering produced these impressions, which is precisely
     * the thing the column exists to record.
     *
     * ⚠️ `startPosition` IS SERVER-OWNED TOO, and it used to be
     * `Number(req.query.served) || 0` — the client-supplied number, three lines
     * below an argument for not trusting the client on exactly this point. The
     * client keeps a running total in a ref; when the app-open location check
     * discards a stale deck because the viewer travelled, the deck was rebuilt
     * correctly (the CURSOR resets to 0, so the cards are right) but the client's
     * total was never reset, so a fresh deck's first page was logged as cards
     * 41–50 instead of 1–10. Invisible in the product, fatal to the metric the
     * log exists for. `session.cardsServed` cannot drift that way. */
    recordImpressions({
      viewerId: currentUser._id,
      sessionId: session._id,
      cards: finalDeck,
      startPosition,
    });

    res.status(200).json({
      users: finalDeck,
      total: eligibleBatch.length,
      /* "Are there more cards after this one?"

         ⚠️ NEVER TRUE WITH AN EMPTY PAGE. This expression used to be
         `session.cursor < session.userIds.length || …`, which is satisfied the
         moment a fresh window exists — even if this request returned zero cards.
         The client reads `hasMore` as permission to ask again, so a
         rebuild-then-return-empty response told it to keep asking, and it did:
         an unbounded loop of requests, each one re-ranking the pool.

         The guard is `finalDeck.length > 0`. A response with nothing in it is
         never an invitation to try again, whatever the cursor says. The session
         is left intact so a later request can still resume it — we are stopping
         the client hammering, not deleting the deck. */
      hasMore: finalDeck.length > 0
        && (session.cursor < session.userIds.length || finalDeck.length === limit),
      /* True when this request re-decided the order (new session, expired
         session, or window extension). The client uses this to show a brief
         "showing newer profiles" line. It is NOT a prompt to act and NOT a
         button — see the decision that there is no user-triggered re-roll,
         because tapping one returns the same exhausted pool. */
      rebuiltWindow,
      /* Nobody eligible is left anywhere in the system. The client must stop
         fetching and show "You're all caught up" rather than paging into a void. */
      deckExhausted,
      /* Identifies the order this page came from, so impressions from one
         browsing session can be told apart from another's. */
      sessionId: session._id.toString(),
      /* Cards handed out in this session, SERVER-SIDE. Sent back so the client's
         running total agrees with the number actually logged — the client no
         longer needs it for correctness, but keeping them in sync means a future
         client that reads it is reading the truth rather than its own guess. */
      served: session.cardsServed || 0,
    });
  } catch (error) {
    /* ⚠️ A LOST OPTIMISTIC-CONCURRENCY RACE IS NOT AN ERROR. It means another
       request for this same viewer finished first and already advanced the
       session — which is precisely what should happen when two deck requests
       overlap. Mongoose reports it as `VersionError` ("No matching document
       found for id ... version N"), and the old code turned that into a 500.

       The failure was reachable from ordinary use, not just a rare race. On
       mount the client issues TWO deck requests: `refreshMerged()` (limit=20)
       and `fetchProfiles(false)` (limit=10), milliseconds apart. Only the one
       that saved second lost, which is why the log showed the same URL as both
       `500 221ms` and `200 266ms` — an intermittent 500 that looked like the
       server randomly breaking.

       So: retry once against fresh state. The retry re-reads the session, sees
       the winner's cursor, and serves the page that actually follows it — which
       is what the client needed all along. One retry is deliberate rather than a
       loop: genuine contention on a single viewer's deck is two requests, and a
       third concurrent caller is a client bug that should still surface.

       Retrying beats returning the winner's response because that response was
       built for a different page size and cursor, so handing it back would
       duplicate or skip cards in the deck the user is holding. */
    throw error;
  }
};

/**
 * 🔒 PER-VIEWER SERIALISATION FOR THE DECK.
 *
 * A session's whole purpose is that it is a single ordered list advancing by a
 * cursor. Two requests reading and writing it at once is not a rare edge case —
 * it is the normal state on page load, because the client deliberately issues
 * `refreshMerged()` (limit=20) and `fetchProfiles(false)` (limit=10) together.
 *
 * Both problems that produced 500s are the same problem. With Mongoose's
 * optimistic concurrency, whichever request saved second was rejected with
 * `VersionError`, and when neither request found an existing session both tried
 * to CREATE one, so the unique `viewerId` index rejected the loser with `E11000`.
 *
 * Retrying is the WRONG shape of fix here. Measured on a 5-way burst, three
 * retries still lost a request: every colliding retry re-runs the same read and
 * collides again, and the retries are themselves concurrent. It reduced the
 * failure rate without removing it.
 *
 * Serialising per viewer removes the race instead of surviving it. Requests for
 * DIFFERENT viewers still run fully in parallel — the key is the viewer's id, not
 * a global lock — so this costs nothing under real multi-user load. It is
 * in-process only, which matches how the app runs today; a multi-process
 * deployment would need the same guarantee at the database level instead.
 *
 * Chain-based rather than a mutex flag, so the ordering is FIFO and a waiter
 * cannot be starved by a stream of newcomers.
 */
const deckLocks = new Map();

const withViewerDeckLock = async (viewerId, fn) => {
  const key = String(viewerId);
  const previous = deckLocks.get(key) || Promise.resolve();

  /* Release on settle, not on success — a throw must not wedge the viewer. */
  let release;
  const held = new Promise((r) => { release = r; });
  deckLocks.set(key, previous.then(() => held));

  await previous.catch(() => {});
  try {
    return await fn();
  } finally {
    release();
    /* Drop the entry once this request is the last one queued, so the map does
       not grow one entry per viewer for the life of the process. */
    if (deckLocks.get(key) === held) deckLocks.delete(key);
  }
};

/**
 * Serves one deck page, serialised per viewer.
 *
 * ⚠️ A LOST RACE IS NOT AN ERROR. It means another request for this same viewer
 * finished first and already advanced — or created — the session, which is
 * precisely what should happen when two deck requests overlap.
 *
 * This was reachable from ordinary use, not a rare race. On mount the client
 * issues TWO deck requests milliseconds apart. Only whichever finished second
 * lost, which is why the log showed the same URL as both `500 221ms` and
 * `200 266ms` — an intermittent 500 that read as the server randomly breaking.
 *
 * The lock above is what prevents the race. `isConcurrentDeckRace` below is only
 * a backstop for the case the lock cannot cover: a process restart mid-write, or
 * a deployment where the in-memory map is not shared between workers. Two
 * attempts is enough there, because there is no ongoing contention to retry
 * through — only at most one already-committed write to step past.
 */
const DECK_RACE_RETRIES = 2;

const serveDeck = async (req, res) => {
  const viewerId = req.user?._id;
  if (!viewerId) {
    res.status(401).json({ message: 'Not authorised' });
    return;
  }

  await withViewerDeckLock(viewerId, async () => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        await buildDeckPage(req, res);
        return;
      } catch (error) {
        if (isConcurrentDeckRace(error) && attempt < DECK_RACE_RETRIES) {
          console.warn(
            `Discover deck: ${error.name || error.code} despite the viewer lock, retry ${attempt + 1}/${DECK_RACE_RETRIES}`,
          );
          await new Promise((r) => setTimeout(r, 20 * (attempt + 1)));
          continue;
        }
        console.error('Discover deck error:', error);
        /* `headersSent` guards against writing a second response: a retry can
           partially succeed and then fail while shaping cards. */
        if (!res.headersSent) {
          res.status(500).json({ message: 'Server error fetching discovery deck' });
        }
        return;
      }
    }
  });
};

// @route   GET /api/discover
router.get('/', protect, serveDeck);

// Validation middleware for target artifact to prevent injection/NaN crashes
const validateTarget = [
  body('target')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^(photo|prompt)_\d+$/)
    .withMessage('Invalid target artifact format. Must be like "photo_0" or "prompt_1".'),
  validate,
];

router.post('/like/:id', protect, discoverLimiter, validateTarget, (req, res) => handleLike(req, res));
router.post('/telegram/:id', protect, discoverLimiter, validateTarget, (req, res) => handleLike(req, res, { isTelegram: true }));

router.post('/pass/:id', protect, discoverLimiter, async (req, res) => {
  const targetId = req.params.id;
  const currentUser = req.user;

  try {
    // 🧹 ATOMIC UPSERT: Overwrites existing pass cooldowns instead of stacking duplicate rows
    //
    // `origin: 'pass'` is what finally distinguishes a swipe from a block or an
    // unmatch. The field has been in the Interaction schema's enum since it was
    // added, but no route ever wrote it, so a pass and a permanent block were
    // only separable by `cooldownExpiresAt === null` — which cannot express
    // "passed four times, now hide forever". Setting origin here is what lets the
    // escalating cooldown count passes without counting blocks as passes.
    //
    // NOTE: `$set` would clobber a permanent archive back into a temporary pass.
    // It is deliberately NOT in the $set — origin only moves null → 'pass', so a
    // blocked user who somehow gets a pass row cannot un-block themselves.
    await Interaction.findOneAndUpdate(
      { actorId: currentUser._id, targetId, actionType: 'archive', origin: { $ne: 'unmatch' } },
      {
        $set: { cooldownExpiresAt: new Date(Date.now() + 7 * DAY_MS) },
        $setOnInsert: { origin: 'pass' },
      },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Pass error:', error);
    res.status(500).json({ message: 'Server error processing pass' });
  }
});

export default router;
```

## server/models/DiscoverSession.js
```
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

    /* Which scope this session serves: 'all' (default, everyone) or 'campus'
       (IIT-only). Two sessions can be live at once — toggling the header chip
       swaps between them instead of rebuilding — while a SHARED seen-list
       (the union of their servedIds) guarantees nobody is shown twice, no
       matter which scope they first appeared in. */
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
discoverSessionSchema.index({ viewerId: 1, scope: 1 }, { unique: true });

/* Housekeeping: sessions expire after a day whether or not anyone reads them
   again, so the collection cannot grow unbounded. The 30-minute idle rule is
   enforced in code on read; this is only a backstop for abandoned rows. */
discoverSessionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

const DiscoverSession = mongoose.model('DiscoverSession', discoverSessionSchema);

export default DiscoverSession;
```

## server/models/DeckImpression.js
```
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
```

## server/models/User.js
```
import mongoose from 'mongoose';
import { randomInt } from 'node:crypto';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    college: {
      type: String,
      default: '',
    },
    collegeCode: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      trim: true,
      default: '',
      maxlength: 60,
    },
    age: {
      type: Number,
      default: null,
    },
    dob: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      default: '',
    },
    pronouns: {
      type: String,
      trim: true,
      default: '',
      maxlength: 30,
    },
    // `branch` and `hostel` were removed here. Neither moved the ladder (only
    // card content scores), `hostel` was the only location signal and the
    // discover deck is no longer campus-scoped, and branch forced a whole
    // modal + BRANCHES list in onboarding for zero matching value —
    // discover.js never filtered on it.
    //
    // ⚠️ No migration issued: existing documents keep the two orphan fields and
    // nothing reads them. Unset them via scripts/backfill-ladder.mjs if you
    // want the documents clean.
    year: {
      type: String,
      default: '',
      maxlength: 40,
    },
    // Expected year of graduation, user-asserted at signup.
    //
    // ⚠️ NOT PROOF of enrolment — anyone can type a future year. It exists to
    // (a) drive the annual re-verification date and (b) show "Graduating 2027"
    // on the card, which is a real dating signal. Enrolment is actually proven
    // by the yearly email re-check (see reverifyDue), not by this number.
    graduatingYear: {
      type: Number,
      default: null,
      min: 2000,
      max: 2100,
    },
    // ─── ANNUAL RE-VERIFICATION ────────────────────────────────────────
    // The product claims "Students only." An alumni mailbox never stops
    // working, so the claim is only true if we re-check. Once per year each
    // account must confirm it still controls a college inbox; when it can't,
    // the account stops being a student (see status).
    //
    // ⚠️ Set to one year after verification, never backdated, so deploying this
    // can't immediately lock out an existing user on a date they never saw.
    reverifyDue: {
      type: Date,
      default: null,
      index: true,
    },
    lastVerifiedAt: {
      type: Date,
      default: null,
    },
    // active        — verified, in good standing
    // reverify_due  — the re-check date has passed; must re-verify to continue
    // suspended     — separate moderation state, handled elsewhere
    //
    // A failed re-check NEVER deletes the account. Losing access to a college
    // inbox is not proof of anything, and quietly destroying someone's account
    // because a mail server had a bad afternoon is not acceptable.
    status: {
      type: String,
      enum: ['active', 'reverify_due'],
      default: 'active',
    },
    // Owned by utils/ladder.js — never written by hand. Recomputed on every
    // profile write (/users/setup, PUT /users/profile) and backfilled by
    // scripts/backfill-ladder.mjs. The client renders this value and never
    // derives it, because it gates the discover deck (see LADDER.interact).
    profileScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    bio: {
      type: String,
      trim: true,
      default: '',
      maxlength: 160,
    },
    bioPhoto: {
      type: String,
      default: '',
    },
    prompts: [
      {
        // `question` is client-supplied straight from the request body and was
        // never checked against PROMPT_BANK, so it needs a bound of its own.
        question: { type: String, maxlength: 200 },
        // 300 is ~3x the longest answer ever written in practice (97 chars) and
        // renders as ~3 lines on a profile card. Both client textareas and both
        // write routes enforce this; the schema cap is the backstop.
        answer: { type: String, maxlength: 300, default: '' },
        photoUrl: String,
      },
    ],
    photos: {
      type: [String],
      default: [],
    },
    intent: {
      type: [String],
      default: [],
    },
    // Optional self-described gap year. Still discoverable — no ranking penalty —
    // surfaced as a badge on the card so people know.
    gapYear: {
      type: Boolean,
      default: false,
    },
    interestedIn: {
      type: [String],
      default: [],
    },
    // ageRange was removed here: it was written by PUT /profile but read by
    // nothing — no query, no UI, not even the client (the settings editor was
    // deleted in 1e83660). Its schema default silently added {min:18,max:30}
    // to every new user document, so it looked configured while doing nothing.
    // No migration: existing documents keep the orphan subdocument and no code
    // path reads it.
    interests: {
      type: [String],
      default: [],
    },
    onboardingStep: {
      type: Number,
      default: 1,
    },
    onboardingData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    // Whether this user's college is shown to OTHERS on their deck card.
    //
    // Once the deck is platform-wide rather than campus-only, the college is
    // the only location signal a card carries — so this defaults to TRUE and
    // the badge is useful from day one. People opt out.
    //
    // Enforced in routes/discover.js by STRIPPING the field from the response
    // when false, not by hiding it in CSS. Hiding it client-side would still
    // ship the data to anyone with devtools, which would make this a
    // decoration rather than a privacy control.
    showCollege: {
      type: Boolean,
      default: true,
    },

    lastLogoutAt: {
      type: Date,
      default: null,
      // Internal bookkeeping — never serialise to the client. Queries that
      // need it name it explicitly (middleware/auth.js) or use '+lastLogoutAt'.
      select: false,
    },

    /* ─── 📍 COARSE LOCATION ───────────────────────────────────────────────
     *
     * ⚠️ THIS IS THE MOST SENSITIVE FIELD IN THE SCHEMA. Read the three rules
     * below before changing anything that touches it.
     *
     * 1. ROUNDED ON WRITE, SERVER-SIDE. Values are stored at 2 decimal places
     *    (~1.1km) by `sanitizeLatLng()` in routes/users.js. Exact coordinates
     *    must never be persisted — a precise home location sitting in the
     *    database is a safety liability, and 1km is ample for a 30km band. The
     *    rounding happens on the server deliberately: rounding client-side
     *    would leave the precise value in the request body and every log that
     *    captures it.
     *
     * 2. NEVER SHOWN TO OTHER USERS. `currentLatLng` is NOT in CARD_FIELDS in
     *    utils/publicCard.js, so it cannot reach any client through the deck,
     *    the profile-updated broadcast, or any card projection. What other
     *    people receive is a derived `distanceBand` string on their own card —
     *    a label, never a coordinate. Do not add this field to CARD_FIELDS.
     *
     * 3. EXPIRES. After LOCATION_TTL_DAYS (utils/geo.js) without a refresh it
     *    stops affecting ranking entirely and reads as unknown, rather than
     *    being trusted indefinitely and quietly wrong — a student who set this
     *    in May should not be ranked as "near" in September.
     *
     * Written only from an explicit opt-in step in onboarding and from
     * `PUT /api/users/location`. There is no background tracking: the client
     * takes ONE reading on app open and the server stores it. `watchPosition`
     * must never be used here. */
    currentLatLng: {
      type: [Number],
      default: undefined,
      // Belt-and-braces with sanitizeLatLng(): even a write that bypasses the
      // route cannot store an out-of-range or non-finite pair.
      validate: {
        validator: (v) => v === undefined || v === null
          || (Array.isArray(v)
            && v.length === 2
            && v.every((n) => Number.isFinite(n))
            && v[0] >= -90 && v[0] <= 90
            && v[1] >= -180 && v[1] <= 180),
        message: 'currentLatLng must be [latitude, longitude]',
      },
      select: false,
    },

    /* How this location came to be: 'gps' from the permission prompt, or
       'campus' when the user declined and we fall back to their college's
       position. Null means no location was ever set. Recorded rather than
       inferred so the distinction between "declined" and "never asked" stays
       visible. */
    locationSource: {
      type: String,
      enum: ['gps', 'campus', null],
      default: null,
    },
    locationNudgeDismissed: {
      type: Boolean,
      default: false,
    },

    /* When the last reading was taken. Drives the TTL above. Null alongside a
       null currentLatLng, and treated as unknown if currentLatLng is somehow
       populated without it. */
    locationUpdatedAt: {
      type: Date,
      default: null,
      select: false,
    },
    pushSubscription: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    suspended: {
      type: Boolean,
      default: false,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspendedReason: {
      type: String,
      default: '',
      // Admin-only (the suspended screen shows a generic message from
      // api.js, not this). Admin queries must use '+suspendedReason'.
      // report.js:71 also needs it so escalation does not clobber the
      // admin's reason with the generic fallback.
      select: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // Report system — shadowban fields
    shadowbanScore: {
      type: Number,
      default: 0,
    },
    shadowbannedAt: {
      type: Date,
      default: null,
    },
    contentFrozen: {
      type: Boolean,
      default: false,
    },
    // Admin-only. NOT selected by default: /me and the login response would
    // otherwise hand staff commentary about the user back to the user.
    // Admin queries must ask for it with '+adminNotes'.
    adminNotes: {
      type: String,
      default: '',
      select: false,
    },
    // 🚀 DETERMINISTIC SEED: Allows instant indexed random sampling without $sample
    // CSPRNG float in [0,1) — preserves the $gte/$lt range sampling in discover.js
    randomSeed: {
      type: Number,
      default: () => randomInt(0, 0x7fffffff) / 0x7fffffff,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Legacy columns that predate the current schema and are no longer read or
// written anywhere in the app, but still sit in the database. Mongoose passes
// through any DB field it does not know about, so they were being serialised
// to clients on /me and the login response — including a password hash and
// salt. Strip them at serialisation time rather than deleting user data.
const LEGACY_PRIVATE_FIELDS = ['passwordHash', 'passwordSalt', 'emailVerified', 'otp', 'otpExpiry'];

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    for (const field of LEGACY_PRIVATE_FIELDS) {
      delete ret[field];
    }
    return ret;
  },
});

userSchema.index({ name: 'text', email: 'text' });
// Deck query index.
//
// `collegeCode` USED to lead this index, because the deck was campus-only
// (discover.js filtered on `collegeCode: currentUser.collegeCode`). The deck is
// now platform-wide, so that leading field only applied to the optional
// `?campusOnly=true` narrowing — and leaving it first would mean the common
// case (no campus filter) couldn't use this index at all, leaving the whole
// deck scan unindexed.
//
// Reordered so the always-present equality fields come first, `collegeCode`
// sits mid-compound where it still serves the narrowed case, and `randomSeed`
// stays LAST because the deck samples a range on it (`$gte`/`$lt` on a
// [0,1) float) rather than matching it exactly — a range scan wants the field
// at the end of the compound so the preceding equalities collapse to one
// contiguous key range.
userSchema.index(
  { isOnboarded: 1, isVerified: 1, isDeleted: 1, suspended: 1, shadowbannedAt: 1, collegeCode: 1, randomSeed: 1 },
  { name: 'discover_deck_filter_index' }
);

// ⚠️ THERE IS DELIBERATELY NO INDEX FOR THE DECK'S SCORE SORT, and adding one
// today would be dead weight that misleads the next reader.
//
// The deck's ranking key is COMPUTED inside the aggregation in
// routes/discover.js (`$addFields`), not read off this document:
//
//   hybridScore = recency(lastActive) * 0.6 + completeness(photos, prompts, bio) * 0.4
//
// where recency is `exp(-ln2 * hoursSince / 72)`. MongoDB cannot serve an index
// over a computed expression, so a `{ profileScore: -1, lastActive: -1 }` index
// would sit here unused while appearing to be the thing making the deck fast. It
// would also add real write cost to every profile update for no read benefit.
//
// VERIFIED with .explain(): the $match stage uses `discover_deck_filter_index`
// above (keys examined == docs examined, no over-fetch), and the `$sort` that
// follows is an in-memory sort, which is why the aggregation passes
// `allowDiskUse: true`.
//
// WHAT THAT COSTS, AND WHEN TO CHANGE IT: an in-memory sort of the entire
// eligible pool is O(n log n) on memory. At current scale that is nothing. At
// ~10^6 users it will spill to disk and become the deck's slowest step.
//
// The fix at that point is DENORMALIZATION, not another index: persist the
// computed value as `deckScore` on this document, recompute it in the two places
// that can change it (`lastActive` writes and ladder `profileScore` writes), and
// index `{ deckScore: -1 }`. Then the sort becomes index-served and the
// aggregation drops `$addFields` entirely.
//
// Do not do that speculatively. It introduces a second source of truth that must
// be kept in sync or the deck silently ranks on stale data — a worse failure
// than a slow sort. Wait until the sort is measurably the bottleneck.

const User = mongoose.model('User', userSchema);
export default User;
```

## client/src/pages/Discover.jsx
```
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileCard from '../components/ProfileCard';
import { closeAllPopouts } from '../components/PopoutItem';
import DeckActions from '../components/DeckActions';
import ProfileCardSkeleton from '../components/ProfileCardSkeleton';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { useAppConfig } from '../utils/AppConfigContext';
import { canInteract, readLadder } from '../utils/ladder';
import ShadowbanBanner from '../components/ShadowbanBanner';
import LearnMoreSheet from '../components/LearnMoreSheet';
import { triggerHaptic } from '../utils/haptics';
import { toast } from '../utils/toast';
import { discoverStore, initDiscoverStore, saveDiscoverStore, resetDiscoverStore, readScope, writeScope } from '../utils/discoverStore';
import { useIsDesktop } from '../utils/useIsDesktop';
import { syncLocationIfPermitted } from '../utils/locationSync';
import socket from '../utils/socket';
import { RotateCw, Compass, AlertTriangle, X, Flower, Send, Undo2, Heart } from 'lucide-react';

/* Locked tokens — neubrutalism, same family as ProfileCard */
const t = {
  desk: '#131313',
  paper: '#FFF9EC',
  card: '#FFFFFF',
  ink: '#191919',
  ink2: '#5F5B52',
  ink3: '#A39E92',
  hair: '#EBE5D6',
  yellow: '#FFD43D',
  coral: '#FF7A59',
  green: '#5BD98A',
  pink: '#FFA3C6',
  red: '#E5484D',
  fontHeavy: "'Archivo Black', 'Arial Black', sans-serif",
  fontBody: "'Inter', -apple-system, 'Segoe UI', sans-serif",
  fontMono: "'Space Mono', 'Courier New', monospace",
};

const slideVariants = {
  enter: (direction) => ({
    opacity: 0,
    scale: 0.92,
    filter: 'blur(12px)',
    zIndex: 2,
  }),
  center: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    zIndex: 2,
  },
  exit: (direction) => ({
    opacity: 0,
    scale: 0.95,
    filter: 'blur(8px)',
    zIndex: 1,
  }),
};

const springTransition = {
  type: 'spring',
  stiffness: 220,
  damping: 18,
  mass: 1,
};

/* How many times the gate will re-read `/auth/me` on its own before handing
   recovery to the online/visibility listeners. See the backoff effect below. */
const MAX_GATE_RETRIES = 2;

/* `onGoToProfile` — raised by the gate toast's action button. Navigating is the
   PARENT's job: Discover doesn't own the tab bar, and routing from here would
   mean reaching into AppShell's state. */
const Discover = ({ onOpenChat, onSheetNearHeader, onGoToProfile }) => {
  const isDesktop = useIsDesktop();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  /* Nobody eligible is left in the system. Distinct from hasMore=false: that
     only means "this page is the last one for now", which the prefetcher
     resolves on its own. This means there is genuinely nothing behind it, and
     paging further would loop the user over people they have already seen. */
  const [deckExhausted, setDeckExhausted] = useState(false);
  /* Set when the server re-decided the deck order mid-browse (new session,
     expired session, or window extension). Drives the brief "showing newer
     profiles" line — deliberately NOT a button. See the decision that no
     dating app exposes a user-triggered re-roll. */
  const [rebuiltAt, setRebuiltAt] = useState(0);
  const [slideDirection, setSlideDirection] = useState('up');
  const [undoNonce, setUndoNonce] = useState(0);   /* bump to re-arm the 5s undo */
  const [nuudgeDismissed, setNuudgeDismissed] = useState(false); /* local mirror so the line vanishes instantly after Got it */
  const [merging, setMerging] = useState(false); /* subtle Updating pill during the background reconcile */
  const [locationDenied, setLocationDenied] = useState(false);

  const [showAlignmentModal, setShowAlignmentModal] = useState(false);
  const [alignedProfile, setAlignedProfile] = useState(null);

  const actionPendingRef = useRef(false);

  /* How many cards the server has actually served this viewer, so the next page
     request can number its impressions by true deck position. A ref rather than
     state: it changes on every fetch and nothing renders from it, and putting it
     in state would make `fetchProfiles` depend on itself. */
  const servedRef = useRef(0);
  /* Holds the dismiss timer for the "Showing newer profiles" notice. A ref, not
     state: the timer identity must survive re-renders without itself causing
     one. */
  const rebuiltTimer = useRef(null);
  const { user: myUser } = useAuth();
  const [showLearnMore, setShowLearnMore] = useState(false);
  const shadowbanScore = myUser?.shadowbanScore || 0;

  const config = useAppConfig();

  /* The viewer's own profile — the ONLY thing in Discover that needs it, since
     the deck cards are other people's profiles.

     `myProfileState` exists so a real 0% is distinguishable from a failed read.
     These used to be the same thing (`myProfile === null` → score 0), which let
     the gate toast announce "You're at 0%" after a single dropped request —
     a number we never fetched, stated as fact. State is separate now:
       loading → we don't know yet
       ready   → we have a score, however small
       error   → the read failed; the gate still shows, but the copy doesn't lie */
  const [myProfile, setMyProfile] = useState(null);
  const [myProfileState, setMyProfileState] = useState('loading'); // loading | ready | error
  const myProfileScore = myProfile?.profileScore ?? 0;

  /* The single gate decision, derived once and handed to both the card and the
     action handler. Two things consume it, so it must not be recomputed
     independently in each — the card needs it to know not to play its seal
     animation, and the handler needs it to know not to send.

     Fail-closed and deliberately unchanged: an unreadable profile is treated as
     not-verified, because the alternative is silently leaving the deck fully
     interactive for anyone we can't score. Only the COPY became honest about
     uncertainty; the gate itself still refuses to open on a guess. */
  const deckGated = !canInteract(myProfileScore, config);

  const loadMyProfile = useCallback(async () => {
    // Only surface 'loading' again if we'd already failed — flipping back to
    // loading on every retry would make the deck flicker through an error state
    // we already recovered from.
    setMyProfileState((s) => (s === 'error' ? 'loading' : s));
    try {
      const me = await api.get('/auth/me');
      setMyProfile(me);
      setMyProfileState('ready');
      return me;
    } catch {
      // Deliberately NOT nulled on failure, same reasoning as the college list
      // in Auth.jsx: a blip after a good read should not wipe a score we already
      // have. The error state is what tells the toast not to quote a number.
      setMyProfileState('error');
      return null;
    }
  }, []);

  useEffect(() => { loadMyProfile(); }, [loadMyProfile]);

  /* Recover from a failed read instead of stranding the deck at "0%" until the
     tab remounts. Both events mean "the network situation probably changed":
     `online` for a dropped connection, `visibilitychange` for a phone that
     went to sleep mid-request. Same shape as the college retry in Auth.jsx. */
  useEffect(() => {
    const onOnline = () => loadMyProfile();
    const onVisible = () => { if (document.visibilityState === 'visible') loadMyProfile(); };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadMyProfile]);

  /* Bounded backoff for the initial failure, so a server that isn't up yet
     doesn't leave the deck permanently at "unknown" until someone toggles the
     tab. The cap is load-bearing, not decoration: `loadMyProfile` flips state
     back to 'error' on every failure, so an uncapped effect would re-arm itself
     forever and poll a dead server every 2.5s for the life of the tab. After
     MAX_GATE_RETRIES the online/visibility listeners above own recovery. */
  const gateRetries = useRef(0);
  useEffect(() => {
    if (myProfileState !== 'error') return undefined;
    if (gateRetries.current >= MAX_GATE_RETRIES) return undefined;
    gateRetries.current += 1;
    const t = setTimeout(() => loadMyProfile(), 2500);
    return () => clearTimeout(t);
  }, [myProfileState, loadMyProfile]);

  /* A successful read earns the retries back — otherwise a user whose network
     dropped once during onboarding would burn through the budget and lose the
     self-healing the backoff exists to provide. */
  useEffect(() => {
    if (myProfileState === 'ready') gateRetries.current = 0;
  }, [myProfileState]);

  /* ── DECK SCOPE: everyone (default) vs my campus only ──
     The CONTROL lives in the Header now (the chip under the wordmark).
     Discover owns the fetch side: it seeds from the store, then listens for
     the scope event the header dispatches and refetches. */
  const [campusOnly, setCampusOnly] = useState(() => readScope(myUser?._id));


  useEffect(() => {
    const onScope = (e) => {
      const next = !!e.detail?.campusOnly;
      /* Clear before the new scope fetches, or the old scope's cards flash
         for a beat — and a quick like/pass can land on the wrong scope. */
      resetDiscoverStore();
      setProfiles([]);
      setCurrentIndex(0);
      servedRef.current = 0;
      setHasMore(true);
      setDeckExhausted(false);
      /* #17: gate retries must not count against the new scope. */
      gateRetries.current = 0;
      /* Scope toggles resume the other (frozen) session; the next
         fetchProfiles sees the new campusOnly and returns that cursor. */
      setCampusOnly(next);
    };
    window.addEventListener('matchalize:scope', onScope);
    return () => window.removeEventListener('matchalize:scope', onScope);
  }, []);

  /* Escape hatch used by the empty state: flips the scope AND tells the
     header chip, so the two can never disagree. */
  const toggleCampusOnly = useCallback(() => {
    const next = !campusOnly;
    setCampusOnly(next);
    writeScope(myUser?._id, next);
    triggerHaptic(next ? 'medium' : 'light');
    window.dispatchEvent(new CustomEvent('matchalize:scope', { detail: { campusOnly: next } }));
  }, [campusOnly, myUser?._id]);

  /* Guards against StrictMode's double mount and the Profile→Discover
     remount: a second call while one is in flight awaits the same request
     instead of starting a parallel one (which the server answered 500s to). */
  const deckFetchInFlight = useRef(null);

  const fetchProfiles = useCallback(async (append = false) => {
    if (deckFetchInFlight.current) return deckFetchInFlight.current;
    const run = (async () => {
    if (!append) { setLoading(true); setError(null); resetDiscoverStore(); }
    else setFetchingMore(true);

    try {
      // `campusOnly` narrows the deck to your own college. Default is the
      // platform-wide deck; the scope persists per user so a deliberate
      // narrowing survives a refresh instead of silently resetting.
      //
      // `served` is the count of cards already shown to this viewer this
      // session. The server needs it to number each impression by its real
      // position in the deck; without it every page would restart at 0 and
      // "how deep did they get" would be meaningless. Sent on append only —
      // a fresh (non-append) load starts a new deck, so it starts at 0 too.
      const servedCount = append ? servedRef.current : 0;
      const scope = campusOnly ? '&campusOnly=true' : '';
      const q = `/discover?limit=10${scope}&served=${servedCount}`;
      const data = await api.get(q);
      const newProfiles = data.users || [];
      servedRef.current = Number.isFinite(data.served) ? data.served : servedCount + newProfiles.length;
      if (append) {
        /* 🛑 AN EMPTY PAGE ENDS THE FETCHING, regardless of what `hasMore` says.
         *
         * A response carrying no cards cannot advance anything, so asking again
         * would return no cards too — the request loop. If the server ever
         * reported "more available" alongside an empty page, this is what stops
         * the client acting on it.
         *
         * The server also refuses to set `hasMore` on an empty page, so this is a
         * second layer rather than the primary defence: if either side is ever
         * changed without the other, the deck still stops rather than spinning.
         *
         * ⚠️ `setDeckExhausted` MUST BE SET BEFORE THE `return`. This early exit
         * was originally written without it, which quietly undid a fix from
         * earlier in the session: `deckExhausted` gates the Refresh button on the
         * caught-up screen, so leaving it false put a Refresh button back on a
         * screen that had genuinely run out — a button that looks actionable and
         * does nothing, since the server only ever returns nothing again. Stopping
         * the request loop and hiding the dead button are the same fix; missing
         * one line here resurrected the bug the other one removed. */
        if (newProfiles.length === 0) {
          setHasMore(false);
          setDeckExhausted(!!data.deckExhausted);
          discoverStore.hasMore = false;
          saveDiscoverStore();
          return;
        }
        setProfiles((prev) => {
          const next = [...prev, ...newProfiles];
          discoverStore.profiles = next;
          discoverStore.hasMore = data.hasMore;
          saveDiscoverStore();
          return next;
        });
      }
      else {
        /* A non-append request is a "start me a deck" request, but it can
           arrive when this viewer already HAS a live deck — StrictMode
           double-invokes this effect in development, and returning to Discover
           from Profile re-runs it too. The server cursor is mid-deck at that
           point, so the response legitimately holds only what is left AFTER the
           cards already on screen, which on a small pool is nothing.

           Replacing the list with an empty array would then blank a perfectly
           good deck and flash "You're all caught up" at someone who has four
           perfectly good cards. An empty response must never destroy a
           populated deck; the caught-up screen is for decks that were ALREADY
           empty. */
        if (newProfiles.length > 0) {
          setProfiles(newProfiles);
          setCurrentIndex(0);
          discoverStore.profiles = newProfiles;
          discoverStore.currentIndex = 0;
          discoverStore.hasMore = data.hasMore;
          saveDiscoverStore();
        }
      }

      /* ⚠️ UNCONDITIONAL, and deliberately outside the branches above.
       * `hasMore` and `deckExhausted` are a matched pair describing the END of
       * the deck, so they must be set the same way for every response — empty
       * page, full page, append or not. They used to be set inside the branch
       * bodies as well as here, so the branch values were immediately overwritten
       * by these: harmless, but it meant the state that actually took effect was
       * the duplicate rather than the one a reader would expect to be reading. */
      setHasMore(data.hasMore);
      setDeckExhausted(!!data.deckExhausted);

      /* Only surface the notice when this request actually re-decided the
         order. On the very first page load the deck was always new, so showing
         "showing newer profiles" then would be noise on every cold start. */
      if (data.rebuiltWindow && append) setRebuiltAt(Date.now());
      /* Auto-dismiss the notice. Without this the render-time `Date.now()` check
         never re-evaluates on its own, so the line would stay pinned forever —
         a timestamp comparison only changes the DOM when something causes a
         re-render, and nothing else would. */
      if (data.rebuiltWindow && append) {
        clearTimeout(rebuiltTimer.current);
        rebuiltTimer.current = setTimeout(() => setRebuiltAt(0), 4000);
      }
    } catch (err) {
      console.error('Failed to fetch deck profiles:', err);
      if (!append) setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
    })();
    deckFetchInFlight.current = run;
    try { await run; } finally { deckFetchInFlight.current = null; }
    return run;
  }, [campusOnly]);


  /* 📍 Refresh the stored position and, if the server decides the move mattered,
     drop the saved session so the next deck request rebuilds around the new
     position. Both this and the auto-check below are one-shot reads: nothing is
     watched, and nothing here can break the deck if it fails. */
  const refreshLocation = useCallback(async () => {
    const res = await syncLocationIfPermitted();
    /* ⚠️ `toast` is an OBJECT with .success/.error/.info — not a bare function.
       Calling `toast(...)` throws "toast is not a function" on tap. */
    if (!res.ok) {
      if (res.reason === 'denied') setLocationDenied(true);
      toast.error(
        res.reason === 'denied' ? 'Location permission declined'
        : res.reason === 'insecure-context' ? 'Location needs a secure (https) connection'
        : "Couldn't update your location",
      );
      return;
    }
    if (!res.moved) { toast.info('Location unchanged'); return; }

    /* The server has already discarded the session. Forget the cached deck too,
       or the client would keep rendering the old ordering until something
       happened to trigger a refetch. */
    resetDiscoverStore();
    setProfiles([]);
    setCurrentIndex(0);
    setHasMore(true);
    setDeckExhausted(false);
    setRebuiltAt(Date.now());
    servedRef.current = 0;
    await fetchProfiles(false);
    toast.success('Location updated — showing people near you now');
  }, [fetchProfiles]);

  /* 📍 Hide the refresh-location button when the OS already said no — tapping
     it again would do exactly nothing, which reads as a bug. If the browser
     doesn't expose the permission API, leave the button as-is. */
  useEffect(() => {
    if (!navigator?.permissions?.query) return;
    let alive = true;
    navigator.permissions.query({ name: 'geolocation' })
      .then((r) => {
        if (!alive) return;
        setLocationDenied(r.state === 'denied');
        r.onchange = () => setLocationDenied(r.state === 'denied');
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  /* 📍 THE AUTOMATIC CHECK. Runs once per app open, silently.
     A one-shot permission prompt is all this ever is — see the rules at the top of
     utils/locationSync.js. No prompt appears here: if the user already granted
     location, the browser returns a cached or fresh reading without asking again,
     and if they did not, the read fails quietly and nothing changes.

     The `moved` branch clears the cached deck and rebuilds. That is the case the
     whole feature exists for: someone who travelled while the app was closed
     would otherwise spend half an hour looking at a deck ordered around a place
     they are no longer at. */
  useEffect(() => {
    let alive = true;
    syncLocationIfPermitted().then((res) => {
      if (!alive || !res.ok || !res.moved) return;
      resetDiscoverStore();
      setProfiles([]);
      setCurrentIndex(0);
      setHasMore(true);
      setDeckExhausted(false);
      servedRef.current = 0;
    });
    return () => { alive = false; };
  }, []);

  /* Clear the rebuild-notice timer on unmount. Without this, navigating away
     mid-window leaves a live timeout that calls setState on a dead component.
     Harmless today, but a source of confusing warnings the moment this page is
     mounted twice — which the deck's own remount behaviour already does. */
  useEffect(() => () => clearTimeout(rebuiltTimer.current), []);

  /* ── DECK HYDRATION + REFRESH ──
     The cache exists so leaving the tab and coming back lands you on the SAME
     card, at the SAME index, with no spinner — that behaviour is load-bearing
     (the gate sends you to Profile and back).

     It was also serving that snapshot FOREVER: on a cache hit this returned
     before `fetchProfiles` ever ran, so a card you had edited stayed frozen at
     whatever it looked like when it was cached. Two accounts editing each other
     is the normal loop, so that read as "my save didn't work".

     So: paint the cache immediately, then reconcile with the server behind it.

     MERGE, not replace. `GET /discover` is randomised per request (a
     `randomSeed` range query around a fresh `Math.random()`), so replacing the
     list would reshuffle the deck and throw away the position we just restored.
     Patching by `_id` keeps order and index untouched while every card in the
     fresh batch becomes current. Cards the batch doesn't cover keep their
     cached copy rather than vanishing — a gap would shift everything below it. */
  const refreshMerged = useCallback(async () => {
    setMerging(true);
    try {
      const q = campusOnly ? '/discover?limit=20&campusOnly=true' : '/discover?limit=20';
      const data = await api.get(q);
      const fresh = data.users || [];
      if (fresh.length === 0) return;
      const byId = new Map(fresh.map((p) => [String(p._id), p]));
      setProfiles((prev) => {
        if (prev.length === 0) return prev;
        let changed = false;
        const next = prev.map((p) => {
          const f = byId.get(String(p._id));
          /* Keep `hybridScore`, which the deck computes per VIEWER. The merge
             response is viewer-specific too, so it does carry one — but the
             `profile-updated` broadcast cannot, and clobbering it with
             undefined would collapse every card to the bottom of the sort. */
          if (!f) return p;
          changed = true;
          return {
            ...f,
            hybridScore: f.hybridScore ?? p.hybridScore,
            distanceBand: f.distanceBand ?? p.distanceBand,
          };
        });
        if (!changed) return prev;
        discoverStore.profiles = next;
        saveDiscoverStore();
        return next;
      });
    } catch {
      // Silent by design. This is a background reconciliation behind an
      // already-usable deck; failing it must not surface an error over cards
      // that are on screen and readable.
    } finally {
      setMerging(false);
    }
  }, [campusOnly]);

  useEffect(() => {
    const userId = myUser?._id;
    if (!userId) return;
    const restored = initDiscoverStore(userId);
    if (restored && discoverStore.profiles.length > 0) {
      setProfiles(discoverStore.profiles);
      setCurrentIndex(discoverStore.currentIndex);
      setHasMore(discoverStore.hasMore);
      setLoading(false);
      return;
    }
    fetchProfiles(false);
  }, [myUser?._id, fetchProfiles, refreshMerged]);

  /* ── LIVE EDITS ──
     `profile-updated` fires from the server whenever anyone saves a profile, so
     a card repaints in place the moment its owner edits it — no refetch, no
     index movement. Ids we aren't showing are ignored, which is the whole of
     the client-side half of the broadcast.
     Merged rather than replaced for the same reason as `refreshMerged`: the
     broadcast carries no viewer-relative score, so replacing the card outright
     would knock its `hybridScore` to undefined. */
  useEffect(() => {
    const onProfileUpdated = (card) => {
      if (!card?._id) return;
      setProfiles((prev) => {
        const idx = prev.findIndex((p) => String(p._id) === String(card._id));
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = {
          ...card,
          hybridScore: card.hybridScore ?? prev[idx].hybridScore,
          distanceBand: card.distanceBand ?? prev[idx].distanceBand,
        };
        discoverStore.profiles = next;
        saveDiscoverStore();
        return next;
      });
    };
    socket.on('profile-updated', onProfileUpdated);
    return () => socket.off('profile-updated', onProfileUpdated);
  }, []);

  const handleNextProfile = useCallback((direction = 'up', isAction = false) => {
    if (direction === 'down') {
      if (currentIndex <= 0) return;
      const next = Math.max(0, currentIndex - 1);
      setCurrentIndex(next);
      discoverStore.currentIndex = next;
      saveDiscoverStore();
      setSlideDirection('down');
      return;
    }

    if (currentIndex >= profiles.length) return;

    setSlideDirection(direction);

    if (!isAction) {
      const passedProfile = profiles[currentIndex];
      if (passedProfile) {
        api.post(`/discover/pass/${passedProfile._id}`).catch(console.error);
        triggerHaptic('light');
      }
    }

    const next = currentIndex + 1;
    setCurrentIndex(next);
    discoverStore.currentIndex = next;
    discoverStore.profiles = profiles;
    saveDiscoverStore();

    /* Prefetch at 6 remaining, not 4.
       The server now hands out a fixed, already-decided order, so the page
       boundary is predictable: the next page is always the next 10 ids in that
       order, not a fresh shuffle of whatever happens to be eligible. Waiting
       until 4 remain still stalls visibly on a full page of 10 — the user is
       looking at their last two cards while the request runs. Fetching at 6
       overlaps the wait with cards they are still swiping. */
    if (profiles.length - currentIndex <= 6 && hasMore && !deckExhausted && !fetchingMore) {
      fetchProfiles(true);
    }
  }, [currentIndex, profiles, hasMore, deckExhausted, fetchingMore, fetchProfiles]);

  /* ══════════════════════════════════════════════════════════════════════
     🚪 THE GATE — deck-wide, before any action reaches the network.

     One rule, no per-action exceptions: whatever the user tapped, they get the
     same toast and the same route to Profile. There is deliberately NO pending
     action and no replay — they finish, come back to the SAME card (the deck
     and index are restored from discoverStore), and choose what to do next.

     `pass` is deliberately NOT gated. It's a way to leave, not a way to
     interact — gating it would trap someone on a card they didn't choose.
     ══════════════════════════════════════════════════════════════════════ */
  const handleAction = useCallback(async (action, payload = {}) => {
    if (actionPendingRef.current) return;
    if (currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];
    const target = profile || {};

    if (action !== 'pass' && deckGated) {
      triggerHaptic('medium');
      // Close the popout FIRST. The toast renders at z-index 9999, just above
      // the popout overlay's 9998, so if the popout were left open the toast
      // would sit on top of a blurred scrim and read as "something appeared
      // behind the modal" — which is exactly what it looked like before.
      closeAllPopouts();

      const need = readLadder(config).interact;

      /* Re-read the score here rather than quoting the mount-time snapshot.
         This costs one round-trip on the tap that hits the gate, and buys two
         things the cached value couldn't give us:
           1. the number in the copy is one we actually fetched, so it can't be
              stale — the user may have finished onboarding in another tab, or
              the mount-time fetch may have died and recovered since;
           2. if it fails, we find out NOW instead of asserting "0%".
         The gate DECISION still uses the cached value, so an intercepted tap is
         never conditional on this succeeding; it only decides what we say.

         Resolved before handing to toast: `toast.info` stores `message` verbatim
         and ArchivalToast renders it as text, so a Promise would surface as
         "[object Promise]". */
      const fresh = await loadMyProfile();
      toast.info(
        fresh && Number.isFinite(fresh.profileScore)
          ? `You're at ${fresh.profileScore}%. Profile strength needs ${need}%.`
          /* A genuine 0% and a dropped request must not read the same. With no
             number in hand we say nothing about one. */
          : `Your profile needs ${need}% to send. Open Profile to finish it.`,
        { label: 'Profile', onClick: () => onGoToProfile?.() },
      );
      return;
    }

    actionPendingRef.current = true;
    try {
      if (action === 'like') {
        triggerHaptic('light');
        const response = await api.post(`/discover/like/${profile._id}`, payload);
        if (response.matched) {
          setAlignedProfile({ ...response.user, alignmentId: response.alignmentId });
          setShowAlignmentModal(true);
        }
      }
      else if (action === 'telegram') {
        triggerHaptic('heavy');
        const response = await api.post(`/discover/telegram/${profile._id}`, payload);
        if (response.matched) {
          setAlignedProfile({ ...response.user, alignmentId: response.alignmentId });
          setShowAlignmentModal(true);
        }
      }
      else if (action === 'pass') {
        triggerHaptic('medium');
        await api.post(`/discover/pass/${profile._id}`);
        /* Bump the undo nonce so DeckActions opens its 5s window. Only on a
           real pass — liking or messaging someone shouldn't offer an undo. */
        setUndoNonce((n) => n + 1);
      }

      handleNextProfile('up', true);

    } catch (err) {
      /* Server-side gate (403 GATED) reached when the client didn't know we were
         locked — e.g. the score dropped mid-session, or our local copy was
         stale. Recover the same way as a normal tap: open the sheet and replay
         the action once it resolves. */
      if (err.response?.data?.code === 'GATED') {
        setPendingAction({ action: payload?.note ? 'letter' : action, payload });
        return;
      }
      console.error('Action failed:', err);
    } finally {
      actionPendingRef.current = false;
    }
  }, [currentIndex, profiles, handleNextProfile, deckGated]);

  /* Desktop: preload the next hero image so swipes feel instant. */
  useEffect(() => {
    if (!isDesktop) return;
    const next = profiles[currentIndex + 1]?.photos?.[0];
    if (!next) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = next;
  }, [isDesktop, profiles, currentIndex]);

  /* Desktop: keyboard deck controls. Ignored while typing or in modals. */
  useEffect(() => {
    if (!isDesktop) return;
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      if (showAlignmentModal) {
        if (e.key === 'Escape') { setShowAlignmentModal(false); setAlignedProfile(null); }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'ArrowRight' || k === 'l' || k === 'L') { e.preventDefault(); triggerHaptic('light'); handleAction('like', {}); }
      else if (k === 'ArrowLeft' || k === 'p' || k === 'P') { e.preventDefault(); triggerHaptic('medium'); handleAction('pass'); }
      else if (k === 'ArrowUp' || k === 's' || k === 'S') { e.preventDefault(); triggerHaptic('heavy'); handleAction('telegram', {}); }
      else if (k === 'ArrowDown' || k === 'b' || k === 'B') { e.preventDefault(); triggerHaptic('light'); handleNextProfile('down'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDesktop, showAlignmentModal, handleAction, handleNextProfile]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px', backgroundColor: t.desk }}>
        <ProfileCardSkeleton />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '24px', backgroundColor: t.desk }}>
        <style>{DECK_CSS}</style>
        <div style={styles.stateCard}>
          <div style={{ ...styles.stateTile, background: t.coral }}>
            <AlertTriangle size={22} strokeWidth={2.6} color={t.ink} />
          </div>
          <h3 style={styles.stateTitle}>The deck hit a snag</h3>
          <p style={styles.stateBody}>{error}</p>
          <button onClick={() => fetchProfiles(false)} className="slam-btn" style={styles.slamBtn}>
            <RotateCw size={14} strokeWidth={3} /> Try again
          </button>
        </div>
      </div>
    );
  }

  if (!profiles || profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '24px', backgroundColor: t.desk }}>
        <style>{DECK_CSS}</style>
        <div style={styles.stateCard}>
          <div style={{ ...styles.stateTile, background: t.yellow }}>
            <Compass size={22} strokeWidth={2.6} color={t.ink} />
          </div>
          <h3 style={styles.stateTitle}>You're all caught up</h3>
          <p style={styles.stateBody}>
            {deckExhausted
              ? "You've seen everyone who fits right now. New people join all the time — check back later."
              : "You've reviewed everyone for now. Check back later — new people land all the time."}
          </p>
          {/* One-time nudge: only when the viewer has never set a location and
              hasn't dismissed it. No banner, no repeats — a line, once. */}
          {!myUser?.locationSource && !myUser?.locationNudgeDismissed && !nuudgeDismissed && (
            <p style={{ ...styles.stateBody, marginTop: 14, color: t.ink2 }}>
              Turn on location and you'll see people near you first.{' '}
              <button
                type="button"
                onClick={async () => {
                  try { await api.put('/users/location', { dismissNudge: true }); } catch { /* non-fatal */ }
                  setNuudgeDismissed(true);
                }}
                style={{ background: 'none', border: 'none', padding: 0, color: t.ink3, textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}
              >
                Got it
              </button>
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Escape hatch from a narrowed deck. Campus-only plus mutual gender
                filtering on a single campus can legitimately return nothing, and
                a dead end with only "Refresh" is indistinguishable from a bug.
                This offers the way out in one tap — and syncs the header chip. */}
            {campusOnly && (
              <button onClick={toggleCampusOnly} className="slam-btn" style={styles.slamBtn}>
                <Compass size={14} strokeWidth={3} /> Show everyone
              </button>
            )}
            {/* Refresh is only honest when there is something to re-fetch.
                Once deckExhausted is true the server has confirmed nobody
                eligible is left ANYWHERE, so tapping this would re-request the
                same exhausted pool and appear broken. Hiding it is the truthful
                state; showing it would be a button that lies about the system. */}
            {!deckExhausted && (
              <button onClick={() => fetchProfiles(false)} className="slam-btn" style={styles.slamBtn}>
                <RotateCw size={14} strokeWidth={3} /> Refresh
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.viewportRoot, ...(isDesktop ? styles.viewportRootDesktop : null) }}>
      <style>{DECK_CSS}</style>

      <ShadowbanBanner score={shadowbanScore} onLearnMore={() => setShowLearnMore(true)} />
      {showLearnMore && <LearnMoreSheet onClose={() => setShowLearnMore(false)} />}

      {/* Quiet notice that the order was re-decided mid-browse — a new session
          after being away, or the deck window running out and refilling.
          Auto-dismisses. Deliberately a LINE, not a button: no major dating app
          lets you re-roll the deck on demand, and a button here would appear to
          offer something the server cannot actually do differently. */}
      <AnimatePresence>
        {rebuiltAt > 0 && Date.now() - rebuiltAt < 4000 && (
          <motion.div
            key="rebuilt"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="status"
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 40,
              pointerEvents: 'none',
              padding: '6px 12px',
              borderRadius: 999,
              background: t.card,
              border: `1px solid ${t.line}`,
              color: t.ink2,
              fontFamily: t.fontBody,
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            Showing newer profiles
          </motion.div>
        )}
      </AnimatePresence>

      {merging && !loading && (
        <div aria-live="polite" style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 30, pointerEvents: 'none', padding: '4px 10px', background: t.card, border: `1px solid ${t.hair}`, borderRadius: 999, color: t.ink3, fontFamily: t.fontBody, fontSize: 11, whiteSpace: 'nowrap' }}>
          Updating…
        </div>
      )}

      <div style={{ ...styles.stageContainer, ...(isDesktop ? styles.stageContainerDesktop : null) }}>
        {/* Desktop: constrained deck column floating on the desk. Mobile: full-bleed. */}
        <div style={isDesktop ? styles.deckColumnDesktop : { position: 'relative', width: '100%', height: '100%' }}>
          <AnimatePresence custom={slideDirection}>
            {profiles[currentIndex] && (
              <motion.div
                key={profiles[currentIndex]._id || profiles[currentIndex].id}
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <ProfileCard
                  profile={profiles[currentIndex]}
                  onAction={handleAction}
                  onSheetNearHeader={onSheetNearHeader}
                  isGated={deckGated}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Deck-scoped actions — ONE instance, sibling of the card stack.
            Fixed to the viewport, so these stay level with the Header bell
            and never remount (or re-arm) as cards animate through. */}
        {!isDesktop && (
          <DeckActions
            onPass={() => handleAction('pass')}
            onUndo={() => handleNextProfile('down')}
            canGoBack={currentIndex > 0}
            undoNonce={undoNonce}
            onRefreshLocation={locationDenied ? undefined : refreshLocation}
          />
        )}
      </div>

      {isDesktop && (
        <div style={styles.desktopActionBar} role="toolbar" aria-label="Discovery actions">
          <button
            className="deck-action-btn"
            title="Previous profile (↓ or B)"
            aria-label="Previous profile"
            disabled={currentIndex <= 0}
            onClick={() => handleNextProfile('down')}
            style={{ ...styles.deckBtn, background: t.paper, color: t.ink }}
          >
            <Undo2 size={19} strokeWidth={2.8} />
          </button>
          <button
            className="deck-action-btn"
            title="Pass (← or P)"
            aria-label="Pass"
            onClick={() => handleAction('pass')}
            style={{ ...styles.deckBtn, background: t.card, color: t.ink }}
          >
            <X size={21} strokeWidth={3} />
          </button>
          <button
            className="deck-action-btn"
            title="Send flower (→ or L) — click photos & prompts too"
            aria-label="Send flower"
            onClick={() => handleAction('like', {})}
            style={{ ...styles.deckBtn, background: t.coral, color: '#fff' }}
          >
            <Flower size={21} strokeWidth={2.6} />
          </button>
          <button
            className="deck-action-btn"
            title="Send telegram (↑ or S)"
            aria-label="Send telegram"
            onClick={() => handleAction('telegram', {})}
            style={{ ...styles.deckBtn, background: t.yellow, color: t.ink }}
          >
            <Send size={19} strokeWidth={2.8} />
          </button>
          <div aria-hidden="true" style={styles.deckHints}>
            <span><kbd className="deck-kbd">←</kbd> pass</span>
            <span><kbd className="deck-kbd">→</kbd> flower</span>
            <span><kbd className="deck-kbd">↑</kbd> telegram</span>
            <span><kbd className="deck-kbd">↓</kbd> back</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAlignmentModal && alignedProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(12,12,14,0.62)', zIndex: 99998 }}
              onClick={() => { setShowAlignmentModal(false); setAlignedProfile(null); }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 16 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 340, backgroundColor: t.paper, border: `2px solid ${t.ink}`, borderRadius: 22, boxShadow: `8px 8px 0 ${t.ink}`, padding: '30px 24px 24px', textAlign: 'center', zIndex: 99999, overflow: 'hidden' }}
            >
              {/* candy confetti — straight, tiny, celebratory */}
              <span aria-hidden="true" style={{ position: 'absolute', top: 18, left: 20, width: 14, height: 14, borderRadius: 999, background: t.yellow, border: `1.5px solid ${t.ink}` }} />
              <span aria-hidden="true" style={{ position: 'absolute', top: 26, right: 24, width: 11, height: 11, borderRadius: 3, background: t.coral, border: `1.5px solid ${t.ink}` }} />
              <span aria-hidden="true" style={{ position: 'absolute', bottom: 78, left: 28, width: 10, height: 10, borderRadius: 3, background: t.green, border: `1.5px solid ${t.ink}` }} />
              <span aria-hidden="true" style={{ position: 'absolute', bottom: 88, right: 30, width: 13, height: 13, borderRadius: 999, background: t.pink, border: `1.5px solid ${t.ink}` }} />

              {/* the match badge — candy tile, pop-in */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 14, stiffness: 280 }}
                style={{ width: 92, height: 92, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: t.yellow, border: `2px solid ${t.ink}`, borderRadius: 24, boxShadow: `5px 5px 0 ${t.ink}` }}
              >
                <Heart size={40} strokeWidth={2.4} color={t.ink} fill={t.ink} />
              </motion.div>

              <h2 style={{ fontFamily: t.fontHeavy, fontSize: 27, fontWeight: 400, color: t.ink, margin: '0 0 8px 0', letterSpacing: '-.01em', textTransform: 'uppercase' }}>
                Aligned<span style={{ color: t.coral }}>!</span>
              </h2>
              <p style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: 500, color: t.ink2, margin: '0 0 24px 0', lineHeight: 1.6 }}>
                You and {alignedProfile.name} found common ground. The chat is now open.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  className="slam-btn"
                  onClick={() => { triggerHaptic('heavy'); setShowAlignmentModal(false); if (onOpenChat && alignedProfile) { onOpenChat({ _id: alignedProfile.alignmentId, user: alignedProfile }); } setAlignedProfile(null); }}
                  style={{ width: '100%', padding: '15px', background: t.yellow, color: t.ink, border: `2px solid ${t.ink}`, borderRadius: 12, boxShadow: `4px 4px 0 ${t.ink}`, fontFamily: t.fontMono, fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Open chat
                </button>
                <button
                  onClick={() => { setShowAlignmentModal(false); setAlignedProfile(null); }}
                  style={{ width: '100%', padding: '15px', background: 'transparent', color: t.ink, border: `2px solid ${t.ink}`, borderRadius: 12, fontFamily: t.fontMono, fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Keep browsing
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* The gate is a TOAST, not a sheet — see handleAction. It renders at
          z-index 9999 (ArchivalToast), just above the popout overlay's 9998,
          and handleAction closes the popout first so it never appears behind a
          blurred scrim. */}
    </div>
  );
};

/* ── deck styles: borders, hard shadows, slam presses ── */
const DECK_CSS = `
  .slam-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-family: ${t.fontMono}; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
    cursor: pointer; transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .slam-btn:active { transform: translate(4px, 4px) !important; box-shadow: 0 0 0 ${t.ink} !important; }
  .deck-action-btn { transition: transform .08s steps(2), box-shadow .08s steps(2); will-change: transform; }
  .deck-action-btn:active { transform: translate(4px, 4px) !important; box-shadow: 0 0 0 ${t.ink} !important; }
  .deck-action-btn:disabled { opacity: .35; cursor: default; transform: none !important; box-shadow: none !important; }
  @media (hover: hover) {
    .deck-action-btn:hover:not(:disabled) { transform: translate(-1px, -1px);
      box-shadow: 5px 5px 0 ${t.ink}; }
    .slam-btn:hover { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 ${t.ink}; }
  }

  kbd.deck-kbd { font-family: ${t.fontMono}; font-size: 10px; font-weight: 700;
    background: ${t.paper}; border: 1.5px solid ${t.ink}; border-radius: 5px; padding: 2px 6px; color: ${t.ink2}; }
  @media (prefers-reduced-motion: reduce) {
    .slam-btn, .deck-action-btn { transition: none; }
  }
`;

const styles = {
  viewportRoot: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: t.desk, position: 'relative', overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none' },
  viewportRootDesktop: { alignItems: 'center' },
  stageContainer: { flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', padding: 0, zIndex: 2 },
  stageContainerDesktop: { width: '100%', maxWidth: 560, padding: '20px 20px 12px', margin: '0 auto' },
  deckColumnDesktop: {
    position: 'relative', width: '100%', height: '100%', minHeight: 0,
    backgroundColor: t.desk, border: `2px solid ${t.ink}`, borderRadius: 22,
    overflow: 'hidden',
  },
  desktopActionBar: {
    position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: '12px 20px 18px', width: '100%', maxWidth: 560, margin: '0 auto',
  },
  deckBtn: {
    width: 54, height: 54, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', border: `2px solid ${t.ink}`, boxShadow: `4px 4px 0 ${t.ink}`,
  },
  deckHints: {
    display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8,
    fontFamily: t.fontMono, fontSize: 10, color: t.ink3, whiteSpace: 'nowrap',
  },
  /* error / empty state card */
  stateCard: {
    width: '100%', maxWidth: 330, backgroundColor: t.paper,
    border: `2px solid ${t.ink}`, borderRadius: 20, boxShadow: `8px 8px 0 ${t.ink}`,
    padding: '30px 24px 26px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  stateTile: {
    width: 56, height: 56, borderRadius: 16, border: `2px solid ${t.ink}`,
    boxShadow: `4px 4px 0 ${t.ink}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  stateTitle: {
    fontFamily: t.fontHeavy, fontSize: 21, fontWeight: 400, color: t.ink,
    letterSpacing: '-.01em', textTransform: 'uppercase', margin: '0 0 8px 0',
  },
  stateBody: {
    fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 500, lineHeight: 1.6,
    maxWidth: 260, marginBottom: 22, color: t.ink2,
  },
  slamBtn: {
    padding: '13px 24px', background: t.yellow, color: t.ink,
    border: `2px solid ${t.ink}`, borderRadius: 12, boxShadow: `4px 4px 0 ${t.ink}`,
  },
};

export default Discover;
```

## client/src/utils/discoverStore.js
```
const STORAGE_PREFIX = 'matchalize_discover_';
const MAX_BYTES = 4.5 * 1024 * 1024;

const store = {
  profiles: [],
  currentIndex: 0,
  hasMore: true,
};

let storageKey = null;
let warnedHighWaterMark = false;

const persist = () => {
  if (!storageKey) return;
  try {
    const serialized = JSON.stringify({
      profiles: store.profiles,
      currentIndex: store.currentIndex,
      hasMore: store.hasMore,
      savedAt: Date.now(),
    });
    if (serialized.length > MAX_BYTES) {
      if (!warnedHighWaterMark) {
        warnedHighWaterMark = true;
        console.warn(`[discoverStore] Deck exceeded ${MAX_BYTES / (1024 * 1024)}MB — skipping persistence (in-memory copy kept).`);
      }
      return;
    }
    localStorage.setItem(storageKey, serialized);
  } catch {
    // Storage full or unavailable → keep the in-memory copy only.
  }
};

/**
 * Bind the persisted deck to a user and hydrate from localStorage.
 * Returns true if a usable deck was restored.
 */
const initDiscoverStore = (userId) => {
  if (!userId) return false;
  const key = `${STORAGE_PREFIX}${userId}`;
  if (storageKey === key) return store.profiles.length > 0;

  storageKey = key;
  store.profiles = [];
  store.currentIndex = 0;
  store.hasMore = true;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.profiles)) {
      const idx = parsed.currentIndex || 0;
      const fresh = Date.now() - (parsed.savedAt || 0) < 30 * 60 * 1000;
      if (fresh && idx < parsed.profiles.length) {
        store.profiles = parsed.profiles;
        store.currentIndex = idx;
        store.hasMore = parsed.hasMore !== false;
        return store.profiles.length > 0;
      }
      localStorage.removeItem(key);
    }
  } catch {
    // Corrupted cache → treat as empty.
  }
  return false;
};

const discoverStore = store;

const saveDiscoverStore = () => persist();

/* ══════════════════════════════════════════════════════════════════════════
   DECK SCOPE — "everyone" vs "my campus only".

   ⚠️ DELIBERATELY NOT IN THE DECK CACHE ABOVE.

   `resetDiscoverStore()` DELETES the cache key outright, and every non-append
   refetch calls it — including the refetch that flipping this toggle itself
   triggers. Storing the scope in `store` would mean tapping the chip wiped the
   setting you just chose, on every tap.

   So it lives under its own key. The two have genuinely different lifetimes:
   the deck cache is disposable (a list of cards and an index), while the scope
   is a durable preference the user set deliberately and expects to survive a
   refresh.
   ══════════════════════════════════════════════════════════════════════════ */

const SCOPE_PREFIX = 'matchalize_deck_scope_';

const readScope = (userId) => {
  if (!userId) return false;
  try {
    return localStorage.getItem(`${SCOPE_PREFIX}${userId}`) === 'campus';
  } catch {
    return false;
  }
};

const writeScope = (userId, campusOnly) => {
  if (!userId) return;
  try {
    localStorage.setItem(`${SCOPE_PREFIX}${userId}`, campusOnly ? 'campus' : 'all');
  } catch { /* storage unavailable — session-only preference */ }
};

const resetDiscoverStore = () => {
  store.profiles = [];
  store.currentIndex = 0;
  store.hasMore = true;
  if (storageKey) {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }
};

export { discoverStore, initDiscoverStore, saveDiscoverStore, resetDiscoverStore, readScope, writeScope };
```

## client/src/components/ProfileCard.jsx
```
import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef,
} from 'react';
import {
  AnimatePresence, motion, useMotionValue, useTransform, animate, useReducedMotion, useMotionValueEvent,
} from 'framer-motion';
import PopoutItem from './PopoutItem';
import ReportModal from './chat/ReportModal';
import { triggerHaptic } from '../utils/haptics';
import { toast } from '../utils/toast';
import {
  Sparkle, MoreVertical, Calendar, Flag,
} from 'lucide-react';

/* ───────────────────────── constants ───────────────────────── */

const FALLBACK_IMG = 'https://placehold.co/600x800/fff3dc/191919?text=%C2%B7';

const RUBBER = 0.3;
const MOMENTUM_MS = 240;
const SIDE_MARGIN = 12;
const TOP_GAP = 16;
const BOTTOM_GAP = 16;
const PEEK_PAD = 10;
const PEEK_FALLBACK = 148;

/* Header duck: see the note on the trigger measurement below. */
const HEADER_LEAD = 12;
const HEADER_RELEASE = 8;

/* Used only if [data-deck-header] cannot be found: DECK_TOP (12) + DECK_BTN (42). */
const HEADER_FALLBACK_BOTTOM = 54;

/* How far the sheet lifts when the ⋮ opens the report row — enough to clear
   the 48px row plus its margin, never the full travel to the top. */
const MENU_RAISE = 84;


const F = {
  heavy: "'Archivo Black', 'Arial Black', sans-serif",
  body: "'Inter', -apple-system, 'Segoe UI', sans-serif",
  mono: "'Space Mono', 'Courier New', monospace",
};

/* the candy box — warm, harmonized, from the references */
const C = {
  paper: '#FFF9EC',
  card: '#FFFFFF',
  ink: '#191919',
  ink2: '#5F5B52',
  ink3: '#A39E92',
  hair: '#EBE5D6',
  yellow: '#FFD43D',
  coral: '#FF7A59',
  green: '#5BD98A',
  pink: '#FFA3C6',
  red: '#E5484D',
};

/* vitals icon tiles cycle through these */
const TILE = ['coral', 'yellow', 'green', 'pink'];

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/* ───────────────────────── styles ─────────────────────────
   Fonts (Archivo Black / Space Mono / Inter) are loaded once in index.html,
   so there is no @import here — a late swap would reflow the whole card. */

const PROFILE_CARD_CSS = `
  .pc-root {
    --paper: ${C.paper};
    --card: ${C.card};
    --ink: ${C.ink};
    --ink-2: ${C.ink2};
    --ink-3: ${C.ink3};
    --hair: ${C.hair};
    --yellow: ${C.yellow};
    --coral: ${C.coral};
    --green: ${C.green};
    --pink: ${C.pink};
    --red: ${C.red};
    --bw: 2px;
    --r: 14px;
    --ease: cubic-bezier(.2,0,0,1);

    position: relative; width: 100%; height: 100%; overflow: hidden;
    background: #131313;
    font-family: ${F.body}; color: var(--ink);
    -webkit-font-smoothing: antialiased;
  }
  .pc-root ::selection { background: var(--yellow); color: var(--ink); }

  /* ════ PHOTO — natural, full-bleed. Functional scrim only. ════ */
  .pc-heroWrap { position: absolute; inset: 0; z-index: 0; transform-origin: 50% 30%; will-change: transform; }
  .pc-hero { width: 100%; height: 100%; object-fit: cover; display: block;
    opacity: 0; transition: opacity .4s ease-out; -webkit-user-drag: none; }
  .pc-hero.is-loaded { opacity: 1; }
  .pc-shade { position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(to top, rgba(15,13,10,.4) 0%, rgba(15,13,10,.08) 42%, rgba(15,13,10,.18) 100%); }

  /* ════ THE SHEET — cream, chunky border, ONE big shadow, rounded ════ */
  .pc-sheet { position: absolute; left: ${SIDE_MARGIN}px; right: ${SIDE_MARGIN}px; top: 0; z-index: 30;
    background: var(--paper); border: var(--bw) solid var(--ink); border-radius: 22px;
    box-shadow: 8px 8px 0 var(--ink);
    touch-action: none; cursor: grab; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
    padding: 14px 20px calc(28px + env(safe-area-inset-bottom));
    display: flex; flex-direction: column; gap: 22px; will-change: transform; }
  .pc-sheet:active { cursor: grabbing; }
  .pc-sheet img { -webkit-user-drag: none; }

  /* grabber — ink at rest, yellow while you hold the sheet */
  .pc-grabber { width: 48px; height: 6px; border-radius: 999px; margin: 0 auto; flex-shrink: 0;
    background: var(--ink); transition: none; }
  .pc-sheet:active .pc-grabber { background: var(--yellow); }

  /* ════ IDENTITY — the peek poster: name with age beside it ════ */
  .pc-id { position: relative; }
  .pc-idrow { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
  .pc-name { font-family: ${F.heavy}; font-size: 34px; font-weight: 400; letter-spacing: -.01em;
    line-height: 1.08; color: var(--ink); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    background-image: linear-gradient(180deg, transparent 58%, var(--yellow) 58%);
    padding: 0 6px 3px 0; }
  /* the ", 21" — same line as the name, quieter type so the name leads */
  .pc-age { font-family: ${F.body}; font-weight: 600; font-size: .72em;
    letter-spacing: 0; color: var(--ink-2); }

  /* Campus — its own full-width line BELOW the ⋮ row. Inside the row it shared
     space with the 42px button and every long college name was ellipsised
     down; as a block under the row it gets the whole sheet width. */
  .pc-college { font-family: ${F.mono}; font-size: 10.5px; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase; color: var(--ink-2);
    margin: 8px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  /* Distance band sits under the campus name, de-emphasised so it reads as
     context rather than a headline. Not uppercase — the labels are sentences
     ("In your area") and shouting them looks wrong. */
  .pc-distance { color: var(--ink-3); text-transform: none; letter-spacing: .01em;
    font-weight: 600; margin-top: 3px; }

  /* ⋮ — clean white utility button (yellow is reserved for the undo timer) */
  .pc-iconbtn { width: 42px; height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    cursor: pointer; border: var(--bw) solid var(--ink); border-radius: 12px;
    background: var(--card); color: var(--ink);
    box-shadow: 4px 4px 0 var(--ink);
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2); }
  .pc-iconbtn:active, .pc-iconbtn.pressed {
    transform: translate(4px, 4px); box-shadow: 0 0 0 var(--ink);
    background: var(--ink); color: var(--paper); }

  /* report — inline row, hairlines, red */
  .pc-menurow { border-top: 1px solid var(--hair); border-bottom: 1px solid var(--hair); overflow: hidden; }
  .pc-menubtn { display: flex; align-items: center; gap: 10px; width: 100%; height: 48px; padding: 0 4px;
    background: none; border: none; cursor: pointer; border-radius: 8px;
    font-family: ${F.mono}; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    color: var(--red); transition: none; }
  .pc-menubtn:active { background: var(--red); color: #fff; }

  /* ════ SECTION HEADS — colored marker square + bold mono label ════ */
  .pc-sec { display: flex; flex-direction: column; flex-shrink: 0; }
  .pc-shead { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; }
  .pc-mark { width: 11px; height: 11px; flex-shrink: 0; border: var(--bw) solid var(--ink); border-radius: 3px; }
  .pc-mark.yellow { background: var(--yellow); }
  .pc-mark.coral { background: var(--coral); }
  .pc-mark.green { background: var(--green); }
  .pc-mark.pink { background: var(--pink); }
  .pc-stitle { font-family: ${F.mono}; font-size: 12px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: var(--ink); }
  .pc-scount { font-family: ${F.mono}; font-size: 10px; font-weight: 400; color: var(--ink-3);
    font-variant-numeric: tabular-nums; }

  /* ════ CARDS — white on cream, 2px border, 5px shadow ════ */
  .pc-card { background: var(--card); border: var(--bw) solid var(--ink); border-radius: var(--r);
    box-shadow: 5px 5px 0 var(--ink); position: relative; }
  .pc-card.padded { padding: 16px; }

  /* ════ VITALS ════ */
  .pc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 12px; }
  .pc-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .pc-tile { width: 34px; height: 34px; flex-shrink: 0; border: var(--bw) solid var(--ink); border-radius: 10px;
    display: flex; align-items: center; justify-content: center; color: var(--ink); }
  .pc-tile.yellow { background: var(--yellow); }
  .pc-tile.coral { background: var(--coral); }
  .pc-tile.green { background: var(--green); }
  .pc-tile.pink { background: var(--pink); }
  .pc-cellinfo { min-width: 0; }
  .pc-clabel { font-family: ${F.mono}; font-size: 9px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; color: var(--ink-3); }
  .pc-cval { font-size: 14px; font-weight: 700; color: var(--ink); margin-top: 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }

  /* ════ ABOUT ════ */
  .pc-bio { font-size: 15px; font-weight: 500; line-height: 1.65; color: var(--ink-2);
    margin: 0; word-break: break-word; text-wrap: pretty; }

  /* ════ CHIPS ════ */
  .pc-pills { display: flex; flex-wrap: wrap; gap: 9px; }
  .pc-chip { display: inline-block; padding: 8px 15px; border: var(--bw) solid var(--ink); border-radius: 999px;
    font-family: ${F.mono}; font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    background: var(--card); color: var(--ink); transition: none; }
  .pc-chip.acc { background: var(--yellow); }
  .pc-chip:active { background: var(--ink); color: var(--paper); border-color: var(--ink); }

  /* ════ PROMPTS ════
     Question is the setup, answer is the payoff — so the ANSWER carries the type
     weight (17px/700 ink) and the question recedes to a small mono caption. */
  .pc-prompt { padding: 14px 16px; cursor: pointer; transition: none; }
  .pc-promptq { font-family: ${F.mono}; font-size: 11.5px; font-weight: 700; line-height: 1.55;
    color: var(--ink-3); margin: 0 0 8px; word-break: break-word; transition: none; }
  .pc-prompta { font-size: 17px; font-weight: 700; line-height: 1.5; color: var(--ink);
    margin: 0; word-break: break-word; overflow-wrap: anywhere; text-wrap: pretty;
    transition: none; }
  .pc-prompt:active { background: var(--ink); border-color: var(--ink); }
  .pc-prompt:active .pc-prompta { color: var(--paper); }
  .pc-prompt:active .pc-promptq { color: rgba(255,249,236,.55); }

  /* ════ PHOTOS ════ */
  .pc-ph { background: var(--card); border: var(--bw) solid var(--ink); border-radius: var(--r);
    box-shadow: 4px 4px 0 var(--ink); padding: 6px;
    transition: transform .08s steps(2), box-shadow .08s steps(2); }
  .pc-ph:active { transform: translate(4px, 4px); box-shadow: 0 0 0 var(--ink); }
  .pc-ph-in { border-radius: 9px; overflow: hidden; aspect-ratio: 1 / 1; background: var(--hair); }
  .pc-ph-in.wide { aspect-ratio: 16 / 10; }
  .pc-ph-in img { width: 100%; height: 100%; object-fit: cover; display: block;
    opacity: 0; transition: opacity .3s ease-out; -webkit-user-drag: none; }
  .pc-ph-in img.is-loaded { opacity: 1; }

  @media (hover: hover) and (pointer: fine) {
    .pc-iconbtn:hover { filter: brightness(1.04); }
    .pc-iconbtn.pressed:hover { filter: none; }
    .pc-menubtn:hover { background: rgba(229,72,77,.08); }
    .pc-chip:hover { background: #FFF3D6; }
    .pc-chip.acc:hover { background: #FFCE1F; }
    .pc-prompt:hover { background: #FFFDF6; }
  }

  .pc-sheet:focus-visible, .pc-iconbtn:focus-visible, .pc-menubtn:focus-visible {
    outline: 3px solid var(--yellow); outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .pc-hero, .pc-ph-in img, .pc-iconbtn, .pc-ph { transition: none; }
  }
`;

/* ───────────────────────── small pieces ───────────────────────── */

const FieldCell = ({ icon: Icon, color, label, value }) => (
  <div className="pc-cell">
    <span className={`pc-tile ${color}`}><Icon size={16} strokeWidth={2.4} /></span>
    <span className="pc-cellinfo">
      <span className="pc-clabel" style={{ display: 'block' }}>{label}</span>
      <span className="pc-cval" style={{ display: 'block' }}>{value}</span>
    </span>
  </div>
);

const SectionHead = ({ mark = 'yellow', children, count }) => (
  <div className="pc-shead">
    <span className={`pc-mark ${mark}`} aria-hidden="true" />
    <span className="pc-stitle">{children}</span>
    {count > 0 && <span className="pc-scount">/ {count}</span>}
  </div>
);


const PhotoTile = ({ src, wide = false }) => (
  <div className="pc-ph">
    <div className={`pc-ph-in${wide ? ' wide' : ''}`}>
      <img
        src={src || FALLBACK_IMG}
        alt=""
        draggable={false}
        loading="lazy"
        decoding="async"
        onLoad={(e) => e.currentTarget.classList.add('is-loaded')}
        onError={(e) => {
          const img = e.currentTarget;
          if (img.dataset.err) { img.classList.add('is-loaded'); return; }
          img.dataset.err = '1';
          img.src = FALLBACK_IMG;
        }}
      />
    </div>
  </div>
);

/* ───────────────────────── main card ───────────────────────── */

const ProfileCard = ({ profile = {}, onAction, onSheetNearHeader, isGated = false }) => {
  const rootRef = useRef(null);
  const sheetRef = useRef(null);
  const menuBtnRef = useRef(null);
  const menuRef = useRef(null);
  const heroImgRef = useRef(null);
  const idRef = useRef(null);

  const setSheetRefs = useCallback((node) => {
    sheetRef.current = node;
  }, []);

  /* ── derived data ── */
  /* The target's own intent chips, for the SEEKING section — the last thing
     this memo was for.

     It also used to derive the compatibility percentage and the shared-interest
     / shared-intent overlap that rendered as an "In common" list. All gone. Worth
     recording why the overlap was itself a latent bug: it intersected the
     target's interests with YOUR OWN profile read from
     `localStorage.matchalize_user`, which is written once at login. So it
     silently disagreed with server data from the moment you edited anything —
     the same stale-localStorage class of defect as the score it sat beneath.
     Nothing on this card compares your profile against the viewer's now. */
  const profileIntent = useMemo(() => (
    Array.isArray(profile.intent) ? profile.intent : [profile.intent].filter(Boolean)
  ), [profile]);

  /* ── geometry ── */
  const [rootH, setRootH] = useState(0);
  const [sheetH, setSheetH] = useState(0);
  const rootHRef = useRef(0);
  const sheetHRef = useRef(0);
  const entranceTimer = useRef(null);
  const entranceUntil = useRef(0);        // timestamp: re-clamp stays off until here
  const entranceDoneFor = useRef(null);    // profile id whose entrance has run

  /* Declared up here on purpose: the reset-per-profile effect below lists it in
     a dependency array, and dep arrays are evaluated during render — declaring
     it after that effect throws "Cannot access before initialization". */
  const cancelEntrance = useCallback(() => {
    if (entranceTimer.current) { clearTimeout(entranceTimer.current); entranceTimer.current = null; }
    entranceUntil.current = 0;
  }, []);
  const peekHRef = useRef(0);

  /* The sheet is content-sized, so it is taller than the screen and its own
     translation is the scroll: `lo` is the fully-raised position (whole card
     readable). `hi` is the rest position: the identity block — grabber, name
     and age, and the campus line — pokes above the bottom edge, measured live
     off the identity element. Only a sheet SHORTER THAN THAT PEEK rests fully
     visible. The sheet never auto-returns here; it only goes down when the
     user swipes it down. */
  const computeBounds = (h, w) => {
    if (!h || !w) return { lo: 0, hi: 0, ready: false, short: true };
    const lo = Math.min(TOP_GAP, h - BOTTOM_GAP - w);
    const peek = peekHRef.current || PEEK_FALLBACK;

    /* `short` means "the whole sheet is shorter than the peek we'd otherwise
       show", i.e. peeking would reveal nothing beyond it — so show all of it.

       This used to be `w <= h - BOTTOM_GAP - TOP_GAP`, which asks a completely
       different question: "is the sheet smaller than the SCREEN". That is true
       of nearly every card (720px of available height on a 752px stage), so
       almost every card took the show-everything branch and rested at
       `h - BOTTOM_GAP - w` instead of at the peek.

       The visible damage was largest on exactly the profiles with the least
       content. Measured on a 420×820 viewport: a 473px sheet (a 45-score
       profile) rested at 263px, leaving the profile photo 35% of the card —
       the sheet parked across the middle of the screen with the face behind it.
       The same card under the corrected test rests at 618px and shows 82%, and
       a 1392px sheet (a 95-score profile) was never affected because it exceeds
       the old 720px threshold anyway.

       The threshold has to be `peek`, because `peek` is the height the rest
       position is trying to reveal. Any other comparison makes "rest" mean
       something different from what the comment above describes. */
    const short = w <= peek;
    const hi = Math.max(lo, h - BOTTOM_GAP - (short ? w : peek));
    return { lo, hi, ready: true, short };
  };

  const boundsRef = useRef({ lo: 0, hi: 0, ready: false });
  boundsRef.current = computeBounds(rootH, sheetH);

  /* ── motion values ── */
  const yMV = useMotionValue(0);

  const photoScale = useTransform(yMV, (y) => {
    const { lo, hi, ready } = boundsRef.current;
    if (!ready || hi <= lo) return 1;
    const p = clamp((hi - y) / (hi - lo), 0, 1);
    return 1 + 0.06 * p;
  });
  const photoOpacity = useTransform(yMV, (y) => {
    const { lo, hi, ready } = boundsRef.current;
    if (!ready || hi <= lo) return 1;
    const p = clamp((hi - y) / (hi - lo), 0, 1);
    return 1 - 0.4 * p;
  });

  /* ── entrance ──
     Opacity + scale only. This animated `filter: blur(12px) → 0` across a
     full-bleed photo on every card swipe, re-rasterising a screen-sized layer
     per frame — the heaviest thing in the whole deck. Removing the blur leaves
     both properties compositor-only, so the swipe stays on the GPU. */
  const entranceOpacity = useMotionValue(0);
  const entranceScale = useTransform(entranceOpacity, [0, 1], [0.92, 1]);
  const combinedPhotoOpacity = useTransform(
    [entranceOpacity, photoOpacity],
    ([entrance, drag]) => entrance * drag
  );
  const combinedPhotoScale = useTransform(
    [entranceScale, photoScale],
    ([entrance, drag]) => entrance * drag
  );

  /* ── glide helpers ── */
  const reduceMotion = useReducedMotion();
  const SPRING = useRef(null);
  SPRING.current = reduceMotion
    ? { glide: { duration: 0 }, bounce: { duration: 0 }, wheel: { duration: 0 } }
    : {
        glide: { type: 'spring', stiffness: 170, damping: 30 },
        bounce: { type: 'spring', stiffness: 380, damping: 32 },
        wheel: { duration: 0.25, ease: 'easeOut' },
      };
  const glideControls = useRef(null);
  const stopGlide = () => {
    if (glideControls.current) { glideControls.current.stop(); glideControls.current = null; }
  };
  const glideTo = (target, kind) => {
    stopGlide();
    glideControls.current = animate(yMV, target, SPRING.current[kind] || SPRING.current.glide);
  };

  /* ── state ── */
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  const showReportRef = useRef(false);
  useEffect(() => { showReportRef.current = showReport; }, [showReport]);

  /* ── measure root + sheet ── */
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { rootHRef.current = el.clientHeight; setRootH(el.clientHeight); });
    ro.observe(el);
    rootHRef.current = el.clientHeight;
    setRootH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.offsetHeight;
      sheetHRef.current = w;
      setSheetH(w);
      const idEl = idRef.current;
      if (idEl) peekHRef.current = idEl.offsetTop + idEl.offsetHeight + PEEK_PAD;
      const h = rootHRef.current;
      if (!h || !w) return;

      /* ── ENTRANCE, here in the measure pass ──
         The sheet is positioned in the SAME layout effect that measures it, so
         it cannot be missed or reordered against the measurement. Run from a
         separate effect it raced this one, and the sheet painted at y=0 —
         covering the whole photo — for ~300ms before the park landed, which
         looked like the sheet arriving before the photo. */
      if (entranceDoneFor.current !== profile._id) {
        entranceDoneFor.current = profile._id;
        const rest = computeBounds(h, w).hi;
        cancelEntrance();
        entranceUntil.current = performance.now() + 900;   // self-expiring guard
        yMV.set(h);                                        // park below the fold
        entranceTimer.current = setTimeout(() => {
          entranceTimer.current = null;
          /* Re-read geometry at glide time: fonts/images may have settled
             since, and a stale peek lands the sheet at the wrong rest. */
          const hh = rootHRef.current, ww = sheetHRef.current;
          const restNow = (hh && ww) ? computeBounds(hh, ww).hi : rest;
          entranceUntil.current = 0;
          glideTo(restNow, 'glide');
        }, 300);
        return;
      }

      /* Stay out of the way while the entrance glide is in flight. A TIMESTAMP,
         not a boolean: if a timer is dropped the guard lapses on its own, so
         the re-clamp can never be wedged off permanently. */
      if (performance.now() < entranceUntil.current) return;
      const { lo, hi } = computeBounds(h, w);
      /* Only intervene when genuinely out of bounds. A blanket stopGlide() here
         was killing legit glides (entrance, the menu raise) mid-flight whenever
         the sheet resized, freezing the sheet — and the photo derived from its
         position. */
      const cur = yMV.get();
      const target = clamp(cur, lo, hi);
      if (Math.abs(target - cur) > 0.5) { stopGlide(); yMV.set(target); }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    /* Cancel the entrance wholesale and forget that it ran, so a remount
       (StrictMode's double-invoke, or a new profile) re-does it from scratch. */
    return () => { ro.disconnect(); cancelEntrance(); entranceDoneFor.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── reset per profile ──
     Deliberately does NOT cancel the entrance. The card is keyed per profile
     upstream, so a real profile change remounts this component anyway. */
  useEffect(() => {
    setShowMenu(false);
    setShowReport(false);
    setHeroLoaded(false);
    entranceOpacity.set(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile._id]);

  /* ── entrance animation: photo fade-in + slight scale-up ── */
  useEffect(() => {
    if (reduceMotion) {
      entranceOpacity.set(1);
      return;
    }
    const controls = animate(entranceOpacity, 1, { duration: 0.5, ease: 'easeOut' });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  useEffect(() => {
    if (heroImgRef.current?.complete) setHeroLoaded(true);
  }, [profile.photos]);

  /* ── report row: outside-click close ── */
  useEffect(() => {
    if (!showMenu) return;
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (menuBtnRef.current?.contains(e.target)) return;
      setShowMenu(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [showMenu]);

  /* ── ⋮ menu open → lift the sheet JUST enough to reveal the row ──
     The report row expands BELOW the identity block; at the rest position it
     would unfurl under the bottom edge. So the sheet lifts by roughly the
     row's height — a small, deliberate rise, never the full travel to the
     top. If the sheet already sits higher than that, nothing moves. Closing
     the menu never repositions the sheet. */
  useEffect(() => {
    if (!showMenu) return;
    const { lo, hi, ready, short } = boundsRef.current;
    if (!ready) return;

    /* Only raise when the raise is actually needed.
       A SHORT sheet — which is what a low-score profile produces, since less
       filled-in content means a shorter sheet — already rests with its ENTIRE
       height on screen (`computeBounds` switches `hi` from `peek` to the full
       `w` when `short`). The report row is therefore already visible and the
       lift is pure harm: it shoved the sheet up over the profile photo, parked
       it mid-screen, and because closing the menu never repositions the sheet
       it stayed there. Taller cards were unaffected precisely because their
       sheet already sits mostly below the fold, so the same 84px is invisible.

       Keyed off the same `short` flag the bounds maths already uses, rather than
       a hardcoded score — the trigger is geometry, not the ladder. */
    if (short) return;

    const target = Math.max(lo, hi - MENU_RAISE);
    if (yMV.get() > target + 1) { stopGlide(); glideTo(target, 'glide'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMenu]);

  /* ════ HEADER DUCK ════
     The header is a position:fixed row. The sheet's top edge sits at
     `rootTop + y`, so the header must duck once
        y  <  (headerBottom - rootTop - HEADER_LEAD)
     Both edges are measured ONCE, with the header at rest, and cached.
     The callback MUST be held in a ref, never in an effect dep. AppShell
     passes a fresh arrow on every render, so a dep on it re-runs the unmount
     cleanup each time — an infinite self-cancelling loop. */
  const headerTriggerRef = useRef(null);
  const headerNearRef = useRef(false);
  const onSheetNearRef = useRef(onSheetNearHeader);
  useEffect(() => { onSheetNearRef.current = onSheetNearHeader; });

  const setHeaderNear = useCallback((near) => {
    if (headerNearRef.current === near) return;
    headerNearRef.current = near;
    onSheetNearRef.current?.(near);
  }, []);

  const measureHeaderTrigger = useCallback(() => {
    if (headerNearRef.current) return;            // never measure mid-animation
    const root = rootRef.current;
    if (!root) return;
    const bar = document.querySelector('[data-deck-header]');
    let headerBottom;
    if (bar) {
      headerBottom = bar.getBoundingClientRect().bottom;
    } else {
      console.warn('[header-duck] [data-deck-header] not found — assuming 54px (DECK_TOP 12 + DECK_BTN 42)');
      headerBottom = HEADER_FALLBACK_BOTTOM;
    }
    const rootTop = root.getBoundingClientRect().top;
    headerTriggerRef.current = headerBottom - rootTop - HEADER_LEAD;
  }, []);

  useMotionValueEvent(yMV, 'change', (y) => {
    const trigger = headerTriggerRef.current;
    if (trigger == null) return;
    /* Two fixed numbers — the two directions cannot disagree. */
    if (headerNearRef.current) {
      if (y > trigger + HEADER_RELEASE) setHeaderNear(false);
    } else if (y < trigger) {
      setHeaderNear(true);
    }
  });

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => { measureHeaderTrigger(); setHeaderNear(false); });
    window.addEventListener('resize', measureHeaderTrigger);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measureHeaderTrigger);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Unmount ONLY (empty deps). See the note above. */
  useEffect(() => () => {
    headerNearRef.current = false;
    onSheetNearRef.current?.(false);
  }, []);

  /* ════ THE DRAG — rigid panel with momentum. No return-to-rest: the sheet
     goes down only when the user swipes it down. Momentum flicks glide
     naturally; releases outside the bounds bounce back into range. ════ */
  const drag = useRef(null);
  const yBaseRef = useRef(0);
  const dragged = useRef(false);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const onDown = (e) => {
      if (showReportRef.current) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (drag.current) return;
      stopGlide();
      drag.current = { id: e.pointerId, startY: e.clientY, lastY: e.clientY, lastT: performance.now(), vel: 0, moved: 0 };
      yBaseRef.current = yMV.get();
      dragged.current = false;
    };

    const onMove = (e) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      if (e.pointerType === 'mouse' && e.buttons === 0) { finish(e, false); return; }
      const { lo, hi, ready } = boundsRef.current;
      if (!ready) return;
      const dy = e.clientY - d.lastY;
      d.lastY = e.clientY;
      d.moved += Math.abs(dy);
      if (d.moved > 5) dragged.current = true;
      const now = performance.now();
      d.vel = d.vel * 0.7 + (dy / Math.max(1, now - d.lastT)) * 0.3;
      d.lastT = now;

      const raw = yBaseRef.current + (e.clientY - d.startY);
      if (raw < lo) {
        const over = lo - raw;
        yMV.set(lo - over * RUBBER);
      } else if (raw > hi) {
        const over = raw - hi;
        yMV.set(hi + over * RUBBER);
      } else {
        yMV.set(raw);
      }
    };

    const finish = (e, withMomentum) => {
      const d = drag.current;
      if (!d) return;
      if (e && e.pointerId !== undefined && e.pointerId !== d.id) return;
      const vel = withMomentum ? d.vel : 0;
      drag.current = null;                    // ← dropped AFTER reading velocity
      const { lo, hi, ready } = boundsRef.current;
      if (!ready) return;
      const y = yMV.get();
      /* No snap-back to rest: a release inside the bounds either glides with
         momentum or stops dead where the finger lifted. Only an out-of-bounds
         release bounces back into range. */
      if (y < lo || y > hi) { glideTo(clamp(y, lo, hi), 'bounce'); return; }
      const projected = clamp(y + vel * MOMENTUM_MS, lo, hi);
      if (Math.abs(projected - y) > 1) glideTo(projected, 'glide');
    };

    const onUp = (e) => finish(e, true);
    const onCancel = (e) => finish(e, false);

    sheet.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      sheet.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── self-healing watchdog — no stray position survives a render ──
     Armed shortly after mount (so it never fights the entrance glide).
     If the sheet ever ends up outside its bounds for ANY reason, the
     next render bounces it back. */
  const watchdogArmedRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => { watchdogArmedRef.current = true; }, 1500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!watchdogArmedRef.current || drag.current) return;
    const { lo, hi, ready } = boundsRef.current;
    if (!ready) return;
    const cur = yMV.get();
    if (cur > hi + 1 || cur < lo - 1) glideTo(clamp(cur, lo, hi), 'bounce');
  }); /* runs after every render — deliberately */

  const onClickCapture = (e) => {
    if (dragged.current) {
      dragged.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const onWheel = (e) => {
      const { lo, hi, ready } = boundsRef.current;
      if (!ready) return;
      e.preventDefault();
      glideTo(clamp(yMV.get() - e.deltaY, lo, hi), 'wheel');
    };
    sheet.addEventListener('wheel', onWheel, { passive: false });
    return () => sheet.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSheetKeyDown = (e) => {
    const { lo, hi, ready } = boundsRef.current;
    if (!ready) return;
    const step = 90;
    if (e.key === 'ArrowUp') { e.preventDefault(); glideTo(clamp(yMV.get() - step, lo, hi), 'glide'); }
    if (e.key === 'ArrowDown') { e.preventDefault(); glideTo(clamp(yMV.get() + step, lo, hi), 'glide'); }
  };

  const sheetReady = rootH > 0 && sheetH > 0;
  const prompts = profile.prompts || [];
  const interests = profile.interests || [];
  const photoB = profile.photos?.[1];
  const photoC = profile.photos?.[2];

  return (
    <div ref={rootRef} className="pc-root">
      <style>{PROFILE_CARD_CSS}</style>

      {/* ════ PHOTO — natural, full-bleed, recedes as the sheet covers it ════ */}
      <motion.div className="pc-heroWrap" style={{ scale: combinedPhotoScale, opacity: combinedPhotoOpacity }}>
        <img
          ref={heroImgRef}
          src={profile.photos?.[0] || FALLBACK_IMG}
          alt={profile.name || 'Profile photo'}
          draggable={false}
          onLoad={() => setHeroLoaded(true)}
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.err) { img.dataset.err = '1'; img.src = FALLBACK_IMG; }
          }}
          decoding="async"
          className={`pc-hero${heroLoaded ? ' is-loaded' : ''}`}
        />
        <div className="pc-shade" aria-hidden="true" />
      </motion.div>

      {/* ════ THE SHEET ════ */}
      <motion.div
        ref={setSheetRefs}
        className="pc-sheet"
        style={{ y: yMV, visibility: sheetReady ? 'visible' : 'hidden' }}
        onClickCapture={onClickCapture}
        onKeyDown={onSheetKeyDown}
        tabIndex={0}
        role="region"
        aria-label={`${profile.name || 'Profile'} details — drag or use arrow keys to move the card`}
      >
        <div className="pc-grabber" aria-hidden="true" />

        {/* IDENTITY — name with age beside it; ⋮ in the row; campus below */}
        <div ref={idRef} className="pc-id">
          <div className="pc-idrow">
            <div style={{ minWidth: 0 }}>
              <h2 className="pc-name">
                {profile.name || 'Anonymous'}
                {profile.age ? <span className="pc-age">, {profile.age}</span> : null}
              </h2>
            </div>
            <button
              ref={menuBtnRef}
              type="button"
              className={`pc-iconbtn${showMenu ? ' pressed' : ''}`}
              aria-label="More options"
              aria-expanded={showMenu}
              onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
            >
              <MoreVertical size={18} strokeWidth={3} />
            </button>
          </div>

          {/* Campus badge — DISPLAY ONLY, BELOW the ⋮ row so it gets the full
              sheet width. The server strips `college` entirely when that person
              opted out (User.showCollege), so this renders nothing and no
              location data reaches the client at all. It never filters the
              deck. */}
          {profile.college && (
            <p className="pc-college">{profile.college}</p>
          )}

          {/* 📍 Coarse distance label — a BAND, never a distance.
              `distanceBand` is derived server-side from the two campuses'
              positions and arrives as one of "Near you" / "In your area" /
              "Further away". It is absent when the viewer's location is off or
              stale, or when the campus has no map position — and it is absent for
              the 300km+ band by design, since labelling every distant stranger
              "Elsewhere in India" is noise.

              No exact kilometres are rendered anywhere, by decision: publishing
              a precise distance on a card is a stronger privacy disclosure than
              a band, and the extra precision changes no decision a user makes. */}
          {profile.distanceBand && (
            <p className="pc-college pc-distance">{profile.distanceBand}</p>
          )}

          {/* Gap year — self-described; the card just says it. No ranking
              effect: hiding people for pausing a degree punishes honesty. */}
          {profile.gapYear && (
            <p className="pc-college" style={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 11 }}>Gap year</p>
          )}

          {/* report — inline row */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                key="menurow"
                ref={menuRef}
                className="pc-menurow"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                style={{ marginTop: 16 }}
              >
                <button
                  type="button"
                  className="pc-menubtn"
                  onClick={() => { triggerHaptic('light'); setShowMenu(false); setShowReport(true); }}
                >
                  <Flag size={14} strokeWidth={2.6} /> Report profile
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ABOUT — right after the identity block */}
        {profile.bio && (
          <div className="pc-sec">
            <SectionHead mark="green">About</SectionHead>
            <p className="pc-bio">{profile.bio}</p>
          </div>
        )}

        {/* VITALS */}
        <div className="pc-sec">
          <SectionHead mark="coral">Vitals</SectionHead>
          <div className="pc-card" style={{ padding: 16 }}>
            <div className="pc-grid">
              <FieldCell icon={Calendar} color={TILE[1]} label="Year" value={profile.year || '—'} />
              <FieldCell icon={Sparkle} color={TILE[3]} label="Pronouns" value={profile.pronouns || '—'} />
            </div>
          </div>
        </div>

        {/* SEEKING */}
        <div className="pc-sec">
          <SectionHead mark="pink">Seeking</SectionHead>
          <div className="pc-pills">
            {(profileIntent.length ? profileIntent : ['Connection']).map((it, i) => (
              <span key={`${it}-${i}`} className="pc-chip acc">{it}</span>
            ))}
          </div>
        </div>

        {/* INTERESTS */}
        {interests.length > 0 && (
          <div className="pc-sec">
            <SectionHead mark="yellow" count={interests.length}>Interests</SectionHead>
            <div className="pc-pills">
              {interests.map((it, i) => (
                <span key={`${it}-${i}`} className="pc-chip">{it}</span>
              ))}
            </div>
          </div>
        )}

        {/* EXHIBITS */}
        {(prompts[0]?.question || prompts[1]?.question || prompts[2]?.question || photoB || photoC || profile.photos?.[3]) && (
          <div className="pc-sec">
            <SectionHead mark="coral" count={[prompts[0], prompts[1], prompts[2], photoB, photoC, profile.photos?.[3]].filter(Boolean).length}>Exhibits</SectionHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {prompts[0]?.question && (
                <PopoutItem isGated={isGated} targetId="prompt_0" onAction={onAction} style={{ display: 'block' }}>
                  <div className="pc-card pc-prompt">
                    <p className="pc-promptq">{prompts[0].question}</p>
                    {prompts[0].answer && (
                      <p className="pc-prompta">{prompts[0].answer}</p>
                    )}
                  </div>
                </PopoutItem>
              )}
              {/* Photo pair — a LONE photo never sits in a half grid: with no
                  second tile the right square would sit empty. One photo alone
                  renders full-width on the wide 16/10 tile. */}
              {(photoB || photoC) && (photoB && photoC ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <PopoutItem isGated={isGated} targetId="photo_1" onAction={onAction} style={{ display: 'block' }}>
                    <PhotoTile src={photoB} />
                  </PopoutItem>
                  <PopoutItem isGated={isGated} targetId="photo_2" onAction={onAction} style={{ display: 'block' }}>
                    <PhotoTile src={photoC} />
                  </PopoutItem>
                </div>
              ) : (
                <PopoutItem isGated={isGated} targetId={photoB ? 'photo_1' : 'photo_2'} onAction={onAction} style={{ display: 'block' }}>
                  <PhotoTile src={photoB || photoC} wide />
                </PopoutItem>
              ))}
              {prompts[1]?.question && (
                <PopoutItem isGated={isGated} targetId="prompt_1" onAction={onAction} style={{ display: 'block' }}>
                  <div className="pc-card pc-prompt">
                    <p className="pc-promptq">{prompts[1].question}</p>
                    {prompts[1].answer && (
                      <p className="pc-prompta">{prompts[1].answer}</p>
                    )}
                  </div>
                </PopoutItem>
              )}
              {profile.photos?.[3] && (
                <PopoutItem isGated={isGated} targetId="photo_3" onAction={onAction} style={{ display: 'block' }}>
                  <PhotoTile src={profile.photos[3]} wide />
                </PopoutItem>
              )}
              {prompts[2]?.question && (
                <PopoutItem isGated={isGated} targetId="prompt_2" onAction={onAction} style={{ display: 'block' }}>
                  <div className="pc-card pc-prompt">
                    <p className="pc-promptq">{prompts[2].question}</p>
                    {prompts[2].answer && (
                      <p className="pc-prompta">{prompts[2].answer}</p>
                    )}
                  </div>
                </PopoutItem>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showReport && profile._id && (
          <ReportModal
            reportedUserId={profile._id}
            onClose={() => setShowReport(false)}
            onReported={() => { setShowReport(false); toast.success('Report submitted.'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileCard;
```

## client/src/components/DeckActions.jsx
```
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { X, Undo2, Compass } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { DECK_TOP, DECK_EDGE } from '../utils/deckChrome';

const C = {
  paper: '#FFF9EC',
  card: '#FFFFFF',
  ink: '#191919',
  yellow: '#FFD43D',
  red: '#E5484D',
};

const UNDO_MS = 5000;
const RING_R = 19.25;
const RING_CIRC = 2 * Math.PI * RING_R;

/* One spring, used for BOTH the undo's entrance and its exit —
   so the exit is the exact reverse of the entrance. */
const UNDO_SPRING = { type: 'spring', stiffness: 480, damping: 26 };

const DECK_ACTIONS_CSS = `
  .da-float {
    --card: ${C.card};
    --ink: ${C.ink};
    --yellow: ${C.yellow};
    --bw: 2px;

    /* absolute: anchors to the deck column on mobile AND desktop */
    position: absolute; top: ${DECK_TOP}; left: ${DECK_EDGE}; z-index: 500;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    pointer-events: none;
  }
  /* the pass button — bigger, red */
  .da-floatbtn { pointer-events: auto; position: relative; width: 46px; height: 46px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    border: var(--bw) solid var(--ink); border-radius: 14px;
    background: ${C.red}; color: #fff;
    box-shadow: 4px 4px 0 var(--ink);
    transition: transform .08s steps(2), box-shadow .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .da-floatbtn:active { transform: translate(4px, 4px); box-shadow: 0 0 0 var(--ink); }
  .da-floatbtn.undo { border-radius: 999px; background: var(--yellow); }
  .da-floatbtn.undo svg { color: var(--ink); }
  /* Location refresh — deliberately quieter than pass (red) and undo (yellow).
     It is a maintenance control, not a decision about a person, so it gets a
     plain card colour rather than borrowing the visual weight of the two actions
     a user makes about someone. */
  .da-refreshloc { pointer-events: auto; width: 40px; height: 40px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    border: var(--bw) solid var(--ink); border-radius: 12px;
    background: ${C.card}; color: var(--ink-2);
    box-shadow: 3px 3px 0 var(--ink);
    transition: transform .08s steps(2), box-shadow .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .da-refreshloc:active { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--ink); }
  .da-refreshloc:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }
  .da-floatbtn:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }

  /* the timer line — rides exactly on the undo button's boundary */
  .da-ring { position: absolute; inset: 0; width: 100%; height: 100%;
    transform: rotate(-90deg); pointer-events: none; }
  .da-ring circle { fill: none; stroke: var(--ink); stroke-width: 3.5; stroke-linecap: round; }

  @media (hover: hover) and (pointer: fine) {
    .da-floatbtn:hover { filter: brightness(1.06); }
    .da-floatbtn:active { filter: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .da-floatbtn { transition: none; }
  }
`;

const DeckActions = ({ onPass, onUndo, canGoBack, undoNonce, onRefreshLocation }) => {
  const [showUndo, setShowUndo] = useState(false);
  const ringMV = useMotionValue(0);
  const reduceMotion = useReducedMotion();

  /* Arm the undo window only when the deck says "a pass just happened". */
  useEffect(() => {
    if (!undoNonce || !canGoBack) return;
    setShowUndo(true);
    ringMV.set(0);
    const controls = reduceMotion
      ? null
      : animate(ringMV, RING_CIRC, { duration: UNDO_MS / 1000, ease: 'linear', onComplete: () => setShowUndo(false) });
    const t = setTimeout(() => setShowUndo(false), UNDO_MS + 60);
    return () => { controls?.stop(); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoNonce, canGoBack]);

  const handlePass = useCallback((e) => {
    e.stopPropagation();
    onPass?.();
  }, [onPass]);

  /* Undo: go back one profile, then dismiss IMMEDIATELY — the button exits
     with the reverse of its entrance spring (not the 5s timeout fade). */
  const handleUndo = useCallback((e) => {
    e.stopPropagation();
    triggerHaptic('light');
    setShowUndo(false);   // ← reverse transition plays right now
    onUndo?.();
  }, [onUndo]);

  return (
    <>
      <style>{DECK_ACTIONS_CSS}</style>
      <div className="da-float">
        <button
          type="button"
          className="da-floatbtn"
          aria-label="Pass this profile"
          title="Pass"
          onClick={handlePass}
        >
          <X size={22} strokeWidth={3.2} />
        </button>

        <AnimatePresence>
          {showUndo && canGoBack && (
            <motion.button
              key="undo"
              type="button"
              className="da-floatbtn undo"
              aria-label="Go to previous profile — available for 5 seconds"
              title="Previous profile (5s)"
              initial={reduceMotion ? false : { opacity: 0, y: -16, scale: 0.5, rotate: -8 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -16, scale: 0.5, rotate: 8 }}
              transition={UNDO_SPRING}
              onClick={handleUndo}
            >
              <Undo2 size={19} strokeWidth={2.8} />
              <svg className="da-ring" viewBox="0 0 42 42" aria-hidden="true">
                <motion.circle
                  cx="21" cy="21" r={RING_R}
                  strokeDasharray={RING_CIRC}
                  style={{ strokeDashoffset: ringMV }}
                />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        {/* 📍 REFRESH LOCATION — a convenience, not the mechanism.
         *
         * Location is re-read automatically every time the app opens (see
         * utils/locationSync.js), so this button is strictly optional: someone who
         * opened the app in one place and then travelled would get a corrected
         * deck on their next open regardless.
         *
         * It is here for the case the automatic check cannot cover — the app has
         * been open the whole time, so no app-open has happened. Long-press style
         * "I moved" affordances are absent from most dating apps, but this one is
         * small, unlabelled in the primary action row, and does nothing at all
         * when the position has not changed.
         *
         * Deliberately NOT the "New deck" button that was rejected earlier. That
         * one re-rolled the deck and would hand back the same exhausted pool. This
         * one re-reads a position; if the position is the same, the server reports
         * `moved: false` and nothing is rebuilt. */}
        {onRefreshLocation && (
          <button
            type="button"
            className="da-refreshloc"
            aria-label="Update my location"
            title="Update my location"
            onClick={onRefreshLocation}
          >
            <Compass size={19} strokeWidth={2.6} />
          </button>
        )}
      </div>
    </>
  );
};

export default DeckActions;
```

## client/src/components/ProfileCardSkeleton.jsx
```
// client/src/components/ProfileCardSkeleton.jsx
import React from 'react';

/* Self-contained shimmer (sk-* namespace).
   Matches the deck card's ENTRANCE START STATE: full-bleed photo only —
   the sheet is parked below the fold while the entrance plays, so showing
   it at peek here would cause a position jump at swap-in. The sheet
   gliding up IS the "loaded" moment. */
const SKELETON_CSS = `
  @keyframes sk-sweep { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  .sk-photo { background-color: #1b1b1b;
    background-image: linear-gradient(100deg, transparent 25%, rgba(255,255,255,0.06) 50%, transparent 75%);
    background-size: 200% 100%; background-repeat: no-repeat;
    animation: sk-sweep 2.2s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .sk-photo { animation: none; }
  }
`;

const ProfileCardSkeleton = () => (
  <div
    aria-hidden="true"
    style={{
      position: 'relative', width: '100%', height: '100%',
      overflow: 'hidden', backgroundColor: '#131313', contain: 'strict',
    }}
  >
    <style>{SKELETON_CSS}</style>

    {/* photo — full-bleed shimmer, same scrim recipe as the real card */}
    <div className="sk-photo" style={{ position: 'absolute', inset: 0 }} />
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'linear-gradient(to top, rgba(15,13,10,.4) 0%, rgba(15,13,10,.08) 42%, rgba(15,13,10,.18) 100%)',
    }} />
  </div>
);

export default ProfileCardSkeleton;
```

## server/utils/publicCard.js
```
import { withFreshAge } from './age.js';

/**
 * The ONLY fields another person may see on a card.
 *
 * An allowlist, not a denylist, and this function enforces it itself rather than
 * trusting the caller to have selected these fields first. The deck route does
 * `.select(CARD_FIELDS)`, so projection looked redundant there — but the
 * `profile-updated` broadcast hands it a full user document, and a projection
 * that only stripped `college` shipped `email`, `isVerified`, `shadowbanScore`
 * and `adminNotes` to every connected socket. Adding a field to the schema would
 * have leaked it silently.
 */
export const CARD_FIELDS = [
  'name', 'photos', 'bio', 'bioPhoto', 'year', 'pronouns', 'graduatingYear',
  'college', 'collegeCode', 'showCollege', 'dob', 'age', 'interests', 'intent',
  'prompts', 'interestedIn', 'gender', 'profileScore', 'lastActive', 'gapYear',
];

/** Space-separated projection, for `.select()` on a Mongoose query. */
export const CARD_FIELDS_SELECT = CARD_FIELDS.join(' ');

/**
 * Project a user document — Mongoose document or plain object — down to the
 * public card shape.
 *
 * Deliberately NOT included: `hybridScore`. It is relative to the VIEWER (it
 * measures how well the candidate matches the person being shown the deck), so it
 * can only be computed for a specific reader. Callers that know the viewer compute
 * it separately and spread it on top; a broadcast payload carries only the
 * view-independent fields, and each client keeps whatever viewer-relative scores
 * it already had.
 */
export const toPublicCard = (user) => {
  if (!user) return user;

  /* Normalise Mongoose documents to plain objects first.
     `const { a, ...rest } = doc` reads `a` through the prototype getter, but a
     rest-spread copies OWN enumerable properties — and a document keeps its
     schema fields under `_doc`, not on itself. Spreading a document therefore
     yields internals, not fields. The deck route passes `.lean()` documents so
     it never hit this; the broadcast path did, and shipped
     `{bio: undefined, profileScore: undefined}` while still looking correct,
     because the explicitly re-added `college` happened to survive. */
  const src = typeof user.toObject === 'function' ? user.toObject() : user;

  const out = {};
  for (const field of CARD_FIELDS) {
    if (field in src) out[field] = src[field];
  }

  /* 🔒 CAMPUS BADGE — stripped here, not hidden in CSS.

     Hiding it client-side still ships it over the wire, so anyone opening
     devtools sees every card's college regardless of the setting, and the
     toggle is a decoration rather than the privacy control it claims to be.
     Removing it at the projection means the data never leaves the database.

     Keyed on the OWNER's `showCollege`, never the viewer's: this controls
     whether people can see YOU, and says nothing about what you are allowed to
     see. Someone with the badge off is still shown college names on other
     people's cards. The `showCollege` flag itself is dropped either way — it is
     the owner's private preference and no card needs it. */
  const showCollege = out.showCollege;
  delete out.showCollege;
  if (showCollege === false) {
    delete out.college;
    delete out.collegeCode;
  }

  return withFreshAge(out);
};
```
