import express from 'express';
import User from '../models/User.js';
import Alignment from '../models/Alignment.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Interaction from '../models/Interaction.js';
import DeckImpression from '../models/DeckImpression.js';
import DiscoverSession from '../models/DiscoverSession.js';
import DailyAlignQuota from '../models/DailyAlignQuota.js';
import { protect } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { CARD_FIELDS_SELECT, toPublicCard } from '../utils/publicCard.js';
import { isFreshLocation, bandFromIndex, sanitizeLatLng, haversineKm, LOCATION_TTL_DAYS } from '../utils/geo.js';
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

/**
 * True when an error means "a concurrent request got there first".
 *
 * There are THREE distinct shapes of the same race, and fixing only the first one
 * leaves the 500 in place — which is exactly what happened when this was first
 * written to handle `VersionError` alone.
 *
 *   1. `VersionError` — "No matching document found for id … version N". The
 *     session EXISTED when we read it, and somebody else saved it before we did.
 *     This is the one the original report was about: two overlapping deck
 *     requests, only the second save rejected.
 *
 *   2. `MongoServerError` code 112 / "write conflict" — the write-conflict
 *     variant, where two saves interleave instead of arriving strictly in order.
 *
 *   3. `E11000` duplicate key on `viewerId_1` — the session did NOT exist when we
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
        { actorId: currentUser._id, actionType: { $in: ['align', 'letter', 'telegram', 'accept_letter', 'archive'] } },
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

    const activeAlignments = await Alignment.find({
      users: currentUser._id,
      isActive: true,
    }).select('users').lean();
    for (const alignment of activeAlignments) {
      const otherId = alignment.users.find((id) => id.toString() !== currentUser._id.toString());
      if (otherId) excludedIds.add(otherId.toString());
    }

    const blockExclusion = await getBlockExclusionQuery(currentUser._id);
    const blockedIds = blockExclusion._id?.$nin || [];
    blockedIds.forEach(id => excludedIds.add(id.toString()));
    excludedIds.add(currentUser._id.toString());

    /* One session per viewer. There used to be one per (viewer, scope) so the
       campus chip could swap between them — that chip is gone, so there is one
       feed, one frozen order and one cursor. */
    // Base filter — heavy $nin moved to Node.js memory filtering
    //
    // ⚠️ NOT filtered by college. This deck is PLATFORM-WIDE: an IIT Bombay
    // student should see IIT Delhi, NIT Trichy and everyone else, because the
    // product is an inter-college network, not one campus. A single IIT-sized
    // pool is thin once mutual gender filtering is applied on top.
    //
    // Campus is now VERIFICATION ONLY — it proves the account is a real student
    // and labels the card. It no longer narrows the feed, because a campus is
    // not where a person is. Distance is measured from the person's own stored
    // location; see the candidate-position block in rankStages.
    const baseFilter = {
      isOnboarded: true,
      isVerified: true,
      suspended: { $ne: true },
      shadowbannedAt: null,
      isDeleted: { $ne: true },
    };


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
      ['_bandIndex', 1],
      ['finalScore', 1], // Added so the blended score is passed through
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
    /* 📐 The cap is a share of the ACTUAL POOL, clamped to the historical
       ceiling of 20% of the window.

       It used to be `ceil(RANK_WINDOW * SHARE)` — a flat 100 — which silently
       became a no-op on a small launch. With 100 users, a cap of 100 allows the
       viewer's own college to be ALL 100 cards, so the rule that exists to stop
       a campus monopolising the feed did nothing precisely when a new campus
       dominates the population.

       Measuring the share against `eligible` makes the ratio mean what it says at
       any size: 20 users → 4, 100 → 20, 500 → 100. Above 500 the clamp holds and
       behaviour is byte-for-byte what it always was.

       ⚠️ This still never REMOVES anyone. `overflow` is pushed back into
       `others` below, so the cap only changes how many own-college cards keep
       their early position — it cannot leave a hole, and cannot shorten the
       deck. If the viewer's campus is the only thing available, every one of
       them is still shown; there is simply nothing to swap them with. */
    const ownCollegeCap = (poolSize) =>
      Math.max(
        2,
        Math.min(
          Math.ceil(RANK_WINDOW * OWN_COLLEGE_SHARE),
          Math.ceil(poolSize * OWN_COLLEGE_SHARE),
        ),
      );

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

        /* 📍 CANDIDATE POSITION — the person, not their campus.

           `_lat1`/`_lng1` MUST each resolve to a SCALAR number. They are consumed
           by `$subtract` a few stages below; handing them the `[lat, lng]` PAIR
           instead reproduces the one failure this file is most careful about —
           "can't $subtract double from array" — which takes down the whole
           aggregation and therefore the entire feed.

           Order of preference, per candidate:
             1. their own stored reading, but ONLY while it is fresh (30d TTL,
                matching `isFreshLocation` on the viewer side)
             2. otherwise their campus coordinates

           ⚠️ The candidate side had NO freshness gate at all before this change:
           `isFreshLocation` was only ever applied to the VIEWER, so a reading
           from months ago was treated as if the person were standing there today.
           A stale reading now falls through to campus rather than lying.

           `$$NOW` is the aggregation constant, not a JS value — a `Date` baked
           into the pipeline would freeze the TTL boundary at request-build time
           and never advance. */
        if (distanceStages) {
          const candidateIsFresh = {
            $and: [
              { $ne: [{ $type: '$currentLatLng' }, 'missing'] },
              { $ne: ['$currentLatLng', null] },
              { $ne: [{ $type: '$locationUpdatedAt' }, 'missing'] },
              { $ne: ['$locationUpdatedAt', null] },
              /* A future-dated stamp is corrupt data, not "very fresh" — treat it
                 as stale rather than letting it bypass the TTL entirely. */
              { $lte: ['$locationUpdatedAt', '$$NOW'] },
              {
                $gte: [
                  '$locationUpdatedAt',
                  { $dateSubtract: { startDate: '$$NOW', unit: 'day', amount: LOCATION_TTL_DAYS } },
                ],
              },
            ],
          };

          const ownOrCampus = (idx) => ({
            $arrayElemAt: [
              {
                $cond: {
                  if: candidateIsFresh,
                  then: '$currentLatLng',
                  else: { $ifNull: ['$_c.latLng', []] },
                },
              },
              idx,
            ],
          });

          stages.push({
            $addFields: {
              /* `$arrayElemAt`, NOT the dotted path '$_c.latLng.0'.
                 Inside a `$cond` the dotted form silently evaluates to an EMPTY
                 ARRAY rather than the first element, so `$subtract` then failed
                 with "can't $subtract double from array" and took the whole
                 aggregation — and therefore the entire deck — down.
                 `$arrayElemAt` is explicit about indexing and cannot be
                 reinterpreted. */
              _lat1: ownOrCampus(0),
              _lng1: ownOrCampus(1),
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

        /* 🧮 BLENDED SCORE — distance, intent, quality in one number.
           Evaluated in a second stage so it can read hybridScore and _intentMatch
           which were just birthed above.
           baseScore = hybridScore * 0.7 + _intentMatch * 0.3  (range 0..1)
           distanceMultiplier by bandIndex: 0=1.0, 1=0.6, 2=0.4, 3=0.1
           No viewer location → neutral 1.0 (fairness: cannot penalise unknown) */
        stages.push({
          $addFields: {
            finalScore: {
              $multiply: [
                {
                  $add: [
                    { $multiply: ['$hybridScore', 0.7] },
                    { $multiply: ['$_intentMatch', 0.3] }
                  ]
                },
                viewerPoint ? {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$_bandIndex', 0] }, then: 1.0 },
                      { case: { $eq: ['$_bandIndex', 1] }, then: 0.6 },
                      { case: { $eq: ['$_bandIndex', 2] }, then: 0.4 },
                      { case: { $eq: ['$_bandIndex', 3] }, then: 0.1 }
                    ],
                    default: 0.1
                  }
                } : 1.0
              ]
            }
          }
        });

        /* ⚠️ NO `$project` HERE.
           Projection must be the LAST stage. DECK_PROJECTION is an inclusion
           list. Projecting before the sort deletes the sort key. */
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
           Single blended score handles distance, intent, and quality.
           finalScore already includes band-based distance multiplier,
           intent boost, and hybridScore. No need for _sortBand. */
        { $sort: { finalScore: -1 } },
        /* Over-fetch past the window so post-filter survivors still fill it. */
        { $limit: FETCH_CAP },
        { $project: DECK_PROJECTION },
      ], { allowDiskUse: true });

      let eligible = docs
        .filter((u) => !skipSet.has(u._id.toString()))
        .filter((u) => !excludedIds.has(u._id.toString()));

      /* 🆕 COLD-START RESERVATION — see COLD_START_SHARE for why this is a quota
         and not a score bonus.

         TOPPED UP FROM OUTSIDE THE BATCH. The below-publish profiles already in
         the ranked batch are kept exactly where their rank put them — they earned
         that position — and the reservation is filled from DEEPER in the pool,
         which is the part that matters.

         ⚠️ That "from outside" is what used to make this a no-op at small scale,
         and the failure is worth stating plainly: with a pool smaller than the
         window, EVERY eligible person is already inside the batch, so there is
         nothing deeper to pull and the reservation silently did nothing. At 100
         users a brand-new account ranked purely on completeness sank to the
         bottom — precisely the population the reserve exists to protect, and
         precisely the population that needs it most.

         Two ways out, so the quota holds at any pool size:

           1. Pool is LARGE — pull newcomers from beyond the window and step
              them in. Unchanged, and the common case.
           2. Pool is SMALL — nothing to pull, so step the newcomers already
              present through the batch instead. Same guarantee (they occupy
              spread positions rather than ranking purely on score), reached the
              other way.

         Both are POSITIONAL ONLY. Nobody is added or dropped by either path.

         The reserve is a share of what is actually available, not of the window:
         `max(1, ceil(pool × share))`, still clamped to the historical 50 so a
         large pool behaves exactly as it always has. */
      const reserve = Math.max(
        1,
        Math.min(
          Math.floor(RANK_WINDOW * COLD_START_SHARE),
          Math.ceil(eligible.length * COLD_START_SHARE),
        ),
      );
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
            /* finalScore already includes distance, intent, quality — single sort key. */
            { $sort: { finalScore: -1 } },
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

        /* ⛔→✅ SMALL-POOL FALLBACK — the case the exhausted-pool guard above used
           to abandon entirely.

           When the pool is exhausted there is nothing beyond the window to pull,
           so the reservation silently lapsed and every newcomer ranked purely on
           completeness — which is what sank them. Instead, spread the newcomers
           ALREADY in the batch so they occupy even gaps rather than clustering at
           whatever rank their incomplete profile earned them.

           ⚠️ Only when the pool is exhausted. On a large pool the pull-from-
           outside path above is strictly better: it adds people who would not
           otherwise be seen at all, rather than merely repositioning people who
           already were. Doing this unconditionally would overwrite the ranked
           order of newcomers who genuinely earned good positions.

           ⚠️ Only the TOP-UP is spread, never the whole in-batch newcomer set:
           once `reserve` slots are satisfied the rest keep their real rank, which
           is the same rule the large-pool path has always used.

           ⚠️ POSITIONAL ONLY — `spreadReserved` returns the same members
           reordered. Nobody is added or dropped, so the zero-repeat guarantee is
           untouched. */
        else if (poolExhausted && inBatch > 0) {
          const inBatchCold = eligible.filter(isCold);
          const topUp = inBatchCold.slice(0, reserve);
          const rest = new Set(topUp.map((u) => u._id.toString()));
          eligible = spreadReserved(
            eligible.filter((u) => !rest.has(u._id.toString())),
            topUp,
          );
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

      /* Measured against the real pool — see ownCollegeCap(). */
      const cap = ownCollegeCap(eligible.length);
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

    /* Keyed by viewer ALONE. It used to be keyed by (viewer, scope) so the campus
       chip could resume a second frozen order — the chip is gone, so there is
       one order and one cursor. Keying on scope would have kept two live
       sessions per returning user, one of them dead weight. */
    let session = await DiscoverSession.findOne({ viewerId: currentUser._id });
    let rebuiltWindow = false;

    if (!isLive(session)) {
      /* Fresh session. Any previous window is overwritten rather than extended:
         past SESSION_IDLE_MINUTES the user has been away, and carrying the old
         order forward is the one thing that would make "new cards" not new.

         Still skip every id from the previous window: the client can retain
         prefetched cards while the server session ages out, and a new window
         must not append those same profiles again. */
      const previouslyShown = new Set([
        ...(session?.servedIds || []).map((id) => id.toString()),
        ...(session?.userIds || []).map((id) => id.toString()),
      ]);
      const window = await rankWindow(previouslyShown);

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
          { $match: { _id: {$in: slice } } },
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

The array is still capped by the 30-minute session lifetime, so it cannot
        grow without bound within a session. */
    /* NOTE: we no longer append every dealt card to `servedIds` here. Only
       cards the user actually acts on (pass, like, telegram) will be added
       below, so that prefetched cards are not permanently burned. */

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

    /* 📍 REMEMBER EVERY CARD DEALT, NOT JUST THE ONES ACTED ON.
     *
     * `servedIds` used to be written only by the pass/align actions, on the
     * reasoning that a merely-prefetched card should not be "burned". That
     * reasoning is sound for a single window and wrong for the session.
     *
     * On window rebuild the skip set is `servedIds ∪ session.userIds`
     * (see `alreadyServed`), and the rebuild REPLACES `userIds` with the new
     * window. So the moment the new window is installed, every id from the
     * previous window that was dealt but never acted on vanishes from the skip
     * set. The next rebuild ranks them again and hands them back a second time.
     *
     * Measured on the seeded 1,200-user population: draining a viewer with 600
     * eligible profiles dealt 600 cards containing only 543 distinct people —
     * 57 of them a second time. The comment above the rebuild claimed "each
     * rebuild strictly enlarges the set of people this session can still show";
     * replacing the window made that false, and it was the only thing keeping
     * the deck from cycling.
     *
     * Recording the dealt ids fixes it at the source, because the skip set then
     * survives a window swap. The cost the old comment worried about — an
     * unbounded array — is already handled by MAX_SESSION_SERVED, and the whole
     * session is discarded after SESSION_IDLE_MINUTES regardless, so a card can
     * never be burned beyond the lifetime of one browsing session.
     *
     * `$addToSet` so a pass/align that already recorded the id, or two cards in
     * one page, cannot duplicate it. Trimmed to the cap by dropping the oldest,
     * which is the only order worth losing: the newest cards are the ones a
     * repeat would be most visible against. */
    const dealt = finalDeck.map((u) => u._id).filter(Boolean);
    if (dealt.length) {
      session.servedIds = [...new Set([...(session.servedIds || []), ...dealt])];
      if (session.servedIds.length > MAX_SESSION_SERVED) {
        session.servedIds = session.servedIds.slice(-MAX_SESSION_SERVED);
      }
    }

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

/* ✨ ALIGN — the single expression of interest in the deck.

   Replaces both the flower (`/like`) and the telegram. One action, so there is
   no longer a question of which button expresses more.

   Deliberately a SEPARATE handler rather than `handleLike(req, res, { … })`
   with a flag. Sharing it would keep the two-era daily limits (7 letters, 1
   telegram) and the two-era notification types alive in the only code path that
   matters, and the flags would be the part that rots first.

   The note is OPTIONAL and the target is OPTIONAL: a bare POST with neither body
   field is a plain profile-level align, which is what the global button sends. */
const handleAlign = async (req, res) => {
  const targetId = req.params.id;
  const currentUser = req.user;

  try {
    // 🛡️ BLOCK SELF-INTERACTION
    if (targetId === currentUser._id.toString()) {
      return res.status(400).json({ message: 'Cannot align with yourself' });
    }

    /* 🛡️ THE GATE — server-side enforcement. Presentation lives in the client;
     * this is what actually enforces it, because POST /discover/align/:id is
     * directly callable and devtools makes that trivial. Same threshold the
     * client uses, read from the same module, so they cannot drift. */
    const actor = await User.findById(currentUser._id).select('profileScore');
    const score = Number.isFinite(actor?.profileScore) ? actor.profileScore : 0;
    if (score < LADDER.interact) {
      return res.status(403).json({
        message: 'Finish your profile to start aligning.',
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

    // 🛡️ BLOCK PERMANENTLY CLOSED CONNECTIONS
    const permanentArchive = await Interaction.findOne({
      $or: [
        { actorId: currentUser._id, targetId, actionType: 'archive', cooldownExpiresAt: null },
        { actorId: targetId, targetId: currentUser._id, actionType: 'archive', cooldownExpiresAt: null },
      ],
    });
    if (permanentArchive) {
      return res.status(403).json({
        message: 'This connection has been permanently closed.',
        code: 'USER_UNMATCHED',
      });
    }

    /* DAILY LIMIT — 10 aligns/day, IST midnight.
     * Align is the deck's only positive action, so this is the quota that now
     * matters. The old split (7 letters + 1 telegram) was two budgets for one
     * gesture, which is why neither number described what a user could do. */
    const DAILY_ALIGN_LIMIT = 10;
    const { note, target } = req.body;
    const safeNote = typeof note === 'string' ? note.trim() : '';
    if (safeNote.length > 140) {
      return res.status(400).json({
        message: 'Note must be 140 characters or fewer.',
        code: 'NOTE_TOO_LONG',
      });
    }

    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(Date.now() + IST_OFFSET_MS);
    const dayKey = istNow.toISOString().slice(0, 10);
    const startOfDay = new Date(`${dayKey}T00:00:00.000Z`);
    startOfDay.setTime(startOfDay.getTime() - IST_OFFSET_MS);
    const expiresAt = new Date(startOfDay.getTime() + 46 * DAY_MS);

    let quota = await DailyAlignQuota.findOne({
      userId: currentUser._id,
      dayKey,
    }).select('_id');
    if (!quota) {
      // Seed the atomic counter with today's usage from before this counter existed.
      const priorAligns = await Interaction.countDocuments({
        actorId: currentUser._id,
        actionType: 'align',
        createdAt: { $gte: startOfDay },
      });
      try {
        quota = await DailyAlignQuota.create({
          userId: currentUser._id,
          dayKey,
          count: priorAligns,
          expiresAt,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        quota = await DailyAlignQuota.findOne({ userId: currentUser._id, dayKey }).select('_id');
        if (!quota) throw error;
      }
    }

    const reservedQuota = await DailyAlignQuota.findOneAndUpdate(
      { userId: currentUser._id, dayKey, count: { $lt: DAILY_ALIGN_LIMIT } },
      { $inc: { count: 1 } },
      { new: true },
    );
    if (!reservedQuota) {
      return res.status(403).json({
        message: 'Out of aligns. Come back tomorrow.',
        code: 'DAILY_ALIGN_LIMIT',
      });
    }

    // 1. THE LEDGER ENTRY
    let alignInteraction;
    try {
      alignInteraction = await Interaction.create({
        actorId: currentUser._id,
        targetId,
        actionType: 'align',
        targetArtifact: target || null,
        letterContent: safeNote || null,
        cooldownExpiresAt: null,
      });
    } catch (error) {
      try {
        await DailyAlignQuota.updateOne(
          { userId: currentUser._id, dayKey, count: { $gt: 0 } },
          { $inc: { count: -1 } },
        );
      } catch (releaseError) {
        console.error('Failed to release align quota reservation:', releaseError);
      }
      throw error;
    }

    // 2. INBOX NOTIFICATION
    const notification = await Notification.create({
      recipientId: targetId,
      senderId: currentUser._id,
      type: 'new_align',
      interactionRef: alignInteraction._id,
    });

    const io = req.app.get('io');

    // 3. REAL-TIME PING
    if (io) {
      io.to(targetId.toString()).emit('new-align', {
        type: 'new_align',
        senderName: currentUser.name,
      });
    }

    // 4. BACKGROUND PUSH
    addToQueue(() => sendPushNotification(targetId, {
      title: 'New Align',
      body: `${currentUser.name} wants to align with you.`,
      data: {
        type: 'notification',
        notificationId: notification._id.toString(),
        interactionId: alignInteraction._id.toString(),
      },
    }));

    /* 5. MUTUAL — spans the retired types on purpose.
       'letter' and 'telegram' rows already exist from the two-action era, and a
       match half-built out of those is a real match the user can see in their
       drawer. Dropping them would strand those pairs forever, because nothing
       re-writes history into 'align'. */
    const isMutual = await Interaction.findOne({
      actorId: targetId,
      targetId: currentUser._id,
      actionType: { $in: ['align', 'letter', 'telegram', 'accept_letter'] },
    });

    const targetProfile = {
      _id: targetUser._id,
      name: targetUser.name,
      photos: targetUser.photos,
      bio: targetUser.bio,
      year: targetUser.year,
      // Same opt-out as the deck rows: hiding your campus must not re-expose it
      // through the payload that follows a mutual align.
      ...(targetUser.showCollege !== false && targetUser.college
        ? { college: targetUser.college, collegeCode: targetUser.collegeCode }
        : {}),
      pronouns: targetUser.pronouns,
      interests: targetUser.interests,
      prompts: targetUser.prompts,
      intent: targetUser.intent,
    };

    if (isMutual) {
      const pairKey = [currentUser._id.toString(), targetId.toString()].sort().join('__');

      // Atomic upsert: two people can accept at the same instant, and a plain
      // find-then-create is a duplicate-key crash on the loser.
      let match;
      try {
        match = await Alignment.findOneAndUpdate(
          { pairKey },
          {
            $setOnInsert: {
              pairKey,
              users: [currentUser._id, targetId],
            },
            $set: {
              isActive: true,
              unlockedByInteractionId: alignInteraction._id,
            },
          },
          { upsert: true, new: true },
        );
      } catch (error) {
        // Concurrent upserts can race on the unique pairKey index. The winner
        // has created the alignment; update and return that row for the loser.
        if (error.code !== 11000) throw error;
        match = await Alignment.findOneAndUpdate(
          { pairKey },
          {
            $set: {
              isActive: true,
              unlockedByInteractionId: alignInteraction._id,
            },
          },
          { new: true },
        );
        if (!match) throw error;
      }

      /* OPENING MESSAGE — only when there is something to open with.
         A bare align carries no text, and an empty chat bubble reading "" is
         worse than no message: it looks broken rather than unwritten. */
      if (safeNote || target) {
        const senderProfile = await User.findById(currentUser._id).select('photos prompts');
        const msgData = {
          alignmentId: match._id,
          senderId: currentUser._id,
          type: 'opening_letter',
          text: safeNote || '',
          deliveryStatus: 'sent',
        };

        if (target?.startsWith('photo_')) {
          const idx = parseInt(target.split('_')[1], 10);
          const url = senderProfile?.photos?.[idx] || senderProfile?.photos?.[0];
          if (url) {
            msgData.mediaUrl = url;
          }
        } else if (target?.startsWith('prompt_')) {
          const idx = parseInt(target.split('_')[1], 10);
          const q = senderProfile?.prompts?.[idx]?.question;
          if (q) {
            msgData.text = safeNote ? `"${q}"\n\n${safeNote}` : `"${q}"`;
          }
        }

        try {
          await Message.findOneAndUpdate(
            { alignmentId: match._id, type: 'opening_letter' },
            { $setOnInsert: msgData },
            { upsert: true },
          );
        } catch (err) {
          // E11000 = a concurrent request already created the opening message.
          // That is the desired end-state, so swallow it. Anything else rethrow.
          if (err.code !== 11000) throw err;
        }
      }

      if (io) {
        io.to(targetId.toString()).emit('match-notification', {
          _id: match._id,
          alignmentId: match._id,
          interactionRef: alignInteraction._id,
          targetArtifact: target || null,
          letterContent: safeNote || null,
          user: targetProfile,
        });
      }

      /* Mark as seen HERE, and only here.
         The deck route marks a card seen when the viewer ACTS on it; this is the
         action route, so it owns that write. Doing it in both places would be a
         duplicate `$addToSet`, which is harmless — but doing it in neither is
         how a card the user aligned with comes back on the next rebuild. */
      const session = await DiscoverSession.findOne({ viewerId: currentUser._id });
      if (session) {
        await session.updateOne({
          $addToSet: { servedIds: targetId },
          $set: { lastSeenAt: new Date() },
        });
      }

      return res.status(200).json({
        matched: true,
        alignmentId: match._id,
        user: targetProfile,
      });
    }

    const session = await DiscoverSession.findOne({ viewerId: currentUser._id });
    if (session) {
      await session.updateOne({
        $addToSet: { servedIds: targetId },
        $set: { lastSeenAt: new Date() },
      });
    }

    return res.status(200).json({ matched: false });
  } catch (error) {
    console.error('Align error:', error);
    return res.status(500).json({ message: 'Server error processing align' });
  }
};

router.post('/align/:id', protect, discoverLimiter, validateTarget, handleAlign);

router.post('/pass/:id', protect, discoverLimiter, async (req, res) => {
  const targetId = req.params.id;
  const currentUser = req.user;

  try {
    // 🧹 ATOMIC UPSERT: Update temporary passes without replacing a permanent
    // block/unmatch archive. A duplicate-key race means a permanent archive
    // already occupies this unique actor/target/action row; leave it untouched.
    //
    // `origin: 'pass'` is what finally distinguishes a swipe from a block or an
    // unmatch. The field has been in the Interaction schema's enum since it was
    // added, but no route ever wrote it, so a pass and a permanent block were
    // only separable by `cooldownExpiresAt === null` — which cannot express
    // "passed four times, now hide forever". Setting origin here is what lets the
    // escalating cooldown count passes without counting blocks as passes.
    //
    try {
      await Interaction.findOneAndUpdate(
        {
          actorId: currentUser._id,
          targetId,
          actionType: 'archive',
          cooldownExpiresAt: { $ne: null },
          origin: { $nin: ['block', 'unmatch'] },
        },
        {
          $set: { cooldownExpiresAt: new Date(Date.now() + 7 * DAY_MS) },
          $setOnInsert: { origin: 'pass' },
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
    let session = await DiscoverSession.findOne({ viewerId: currentUser._id });
    if (!session) {
      session = await DiscoverSession.create({ viewerId: currentUser._id, servedIds: [] });
    }
    await session.updateOne({
      $addToSet: { servedIds: targetId },
      $set: { lastSeenAt: new Date() },
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Pass error:', error);
    res.status(500).json({ message: 'Server error processing pass' });
  }
});

router.post('/undo/:id', protect, discoverLimiter, async (req, res) => {
  const targetId = req.params.id;

  try {
    const pass = await Interaction.findOneAndDelete({
      actorId: req.user._id,
      targetId,
      actionType: 'archive',
      cooldownExpiresAt: { $gt: new Date() },
      $or: [{ origin: 'pass' }, { origin: null }],
    });

    const session = await DiscoverSession.findOne({ viewerId: req.user._id });
    if (session) {
      await session.updateOne({
        $pull: { servedIds: targetId },
        $set: { lastSeenAt: new Date() },
      });
    }

    res.status(200).json({ success: true, undone: Boolean(pass) });
  } catch (error) {
    console.error('Undo pass error:', error);
    res.status(500).json({ message: 'Server error undoing pass' });
  }
});

export default router;