# Chunk 21 — Server Core

> Matchalize · `server-core` · files 21 of 28 chunks · 5 file(s) · 25 KB · ~7,265 tokens
> Generated 2026-10-18 20:29.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./server/utils/partnerView.js`
> - `./server/utils/publicCard.js`
> - `./server/utils/push.js`
> - `./server/utils/queue.js`
> - `./server/utils/signalingRateLimit.js`

---
### ./server/utils/partnerView.js

```
/**
 * 🛡️ PARTNER VIEW — the single answer to "what may this connection show?"
 *
 * ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────
 * Before this, "can person A see person B's profile?" was decided
 * independently by every screen that displayed a name. Twenty-two inline sites
 * read `user.name` or `user.photos[0]` directly, and four server paths embedded
 * real names in payloads and push titles. There was no rule to break and no
 * single place to change — which is why a promise of "your profile is hidden"
 * could not be kept, and why it could not be tested.
 *
 * This module is that rule. It is deliberately boring: one lookup, one
 * fallback chain, no clever branching. Every surface that shows a partner
 * eventually calls `displayNameFor` instead of reading a field itself, which
 * is what makes the promise auditable.
 *
 * ── THE INVARIANT ────────────────────────────────────────────────────────────
 *   NO GRANT MEANS NO ACCESS. Not "unless it is a deck connection", not "unless
 *   the field is missing". Absence is denial.
 *
 * That is the whole design. It fails closed because there is no branch that
 * could decide otherwise — the only way to grant access is to write a grant.
 *
 * ── NOT CALLED ANYTHING YET ──────────────────────────────────────────────────
 * Stage 1 defines and tests the contract. Wiring it into Chat, the Requests
 * list, search, typing events and push notifications is Stage 8, and the
 * acceptance gate for that stage is that all thirteen of those surfaces call
 * these functions. Until then no screen changes behaviour, which is precisely
 * why this can be merged without regression risk.
 *
 * Design source: ambitions/roulette.md §4
 */

import Alignment from '../models/Alignment.js';

/**
 * Placeholder shown when nothing authorises a real identity.
 *
 * ⚠️ Never derive this from the user's name, college, ObjectId or an avatar.
 * The whole point is that a partner learns nothing. This string is the same
 * for everyone so it also leaks nothing by comparison — two strangers looking
 * at each other see identical text.
 */
export const ANONYMOUS_LABEL = 'Stranger';

/**
 * Resolve the OTHER user in a connection.
 *
 * @param {{ users?: Array }} connection  an Alignment document or plain object
 * @param {string|import('mongoose').Types.ObjectId} viewerId
 * @returns {string|null} the partner's id, or null if viewerId is not a member
 */
export const partnerIdFor = (connection, viewerId) => {
  const users = Array.isArray(connection?.users) ? connection.users : [];
  if (users.length !== 2) return null;
  const viewer = String(viewerId);
  const partner = users.find((u) => String(u) !== viewer);
  return partner ? String(partner) : null;
};

/**
 * The authorisation question, answered directly from the document.
 *
 * Pure: takes an already-loaded connection, hits no database. `canViewProfile`
 * below is the loading variant.
 *
 * @param {{ profileGrants?: Array }} connection
 * @param {string} viewerId
 * @param {string} subjectId
 * @returns {boolean} true ONLY if an explicit grant exists
 */
export const hasGrant = (connection, viewerId, subjectId) => {
  const grants = Array.isArray(connection?.profileGrants) ? connection.profileGrants : [];
  const viewer = String(viewerId);
  const subject = String(subjectId);
  // An empty list is the common case for a hidden connection, so bail before
  // doing any string comparison work.
  if (grants.length === 0) return false;
  return grants.some((g) => String(g?.viewerId) === viewer && String(g?.subjectId) === subject);
};

/**
 * May `viewerId` see `subjectId`'s public profile through this connection?
 *
 * @param {object} connection  a loaded Alignment
 * @param {string} viewerId
 * @param {string} [subjectId]  defaults to "whoever else is in it"
 * @returns {boolean}
 */
export const canViewProfileIn = (connection, viewerId, subjectId) => {
  // A connection is two people by definition, and Alignment.js:53-63 enforces
  // that on save. Refusing anything else here is defence in depth for a
  // function whose entire job is to be un-grantable: a malformed document
  // naming extra members must not become a way to hand out access, even if
  // it happens to contain a matching grant.
  const users = Array.isArray(connection?.users) ? connection.users : [];
  if (users.length !== 2) return false;

  const subject = subjectId ? String(subjectId) : partnerIdFor(connection, viewerId);
  if (!subject || !viewerId) return false;
  if (String(viewerId) === subject) return false;
  return hasGrant(connection, viewerId, subject);
};

/**
 * The nickname this connection records for the partner, if any.
 *
 * @param {object} connection
 * @param {string} partnerId
 * @returns {string|null}
 */
export const aliasFor = (connection, partnerId) => {
  const aliases = Array.isArray(connection?.conversationAliases)
    ? connection.conversationAliases
    : [];
  const partner = String(partnerId);
  const found = aliases.find((a) => String(a?.userId) === partner);
  const alias = found?.alias;
  return typeof alias === 'string' && alias.trim() ? alias.trim() : null;
};

/**
 * The display name for a partner, in a fixed order of preference.
 *
 * 1. A nickname recorded for this connection  → use it
 * 2. A grant authorises their real name       → use their real name
 * 3. Otherwise                                → ANONYMOUS_LABEL
 *
 * Order matters and is not interchangeable. The alias wins even after a
 * mutual reveal, which is deliberate (spec §8.2): the conversation keeps the
 * name people chose for each other, and the real name is still available
 * through `canViewProfile` for the profile sheet. A user who has seen
 * "Moonwalker" for a week should not have that silently replaced mid-chat
 * because they later agreed to share profiles.
 *
 * ⚠️ Callers that want to display a real name must ALSO check
 * `canViewProfileIn` — this function is for labels, not for authorisation.
 * They coincide today by construction, and will drift the moment anyone adds
 * a UI that renders one without the other.
 *
 * @param {object} connection
 * @param {string} viewerId
 * @param {{ name?: string }} [partnerUser]  the partner's user doc, for the real name
 * @returns {string}
 */
export const displayNameIn = (connection, viewerId, partnerUser) => {
  const partnerId = partnerIdFor(connection, viewerId);
  if (!partnerId) return ANONYMOUS_LABEL;

  const alias = aliasFor(connection, partnerId);
  if (alias) return alias;

  if (canViewProfileIn(connection, viewerId, partnerId)) {
    const real = partnerUser?.name;
    if (typeof real === 'string' && real.trim()) return real.trim();
  }

  return ANONYMOUS_LABEL;
};

/* ═══════════════════════════════════════════════════════════════════════════
 * DATABASE-BACKED VARIANTS
 *
 * The pure functions above are what the tests exercise and what every call
 * site should prefer. These exist so a route does not have to hand-roll the
 * same two queries.
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Load a connection and answer the authorisation question.
 *
 * @param {string} alignmentId
 * @param {string} viewerId
 * @returns {Promise<{ connection: object|null, partnerId: string|null, canView: boolean }>}
 */
export const canViewProfile = async (alignmentId, viewerId) => {
  const connection = await Alignment.findById(alignmentId).lean();
  if (!connection) return { connection: null, partnerId: null, canView: false };

  const partnerId = partnerIdFor(connection, viewerId);
  // A non-member gets the same answer as a stranger: false. Never throw and
  // never distinguish "not a member" from "not allowed" — that difference is
  // an oracle for probing whether a connection exists.
  const canView = partnerId ? canViewProfileIn(connection, viewerId, partnerId) : false;
  return { connection, partnerId, canView };
};

/**
 * Load a connection and resolve a partner's display name.
 *
 * @param {string} alignmentId
 * @param {string} viewerId
 * @param {string} [partnerId]  avoids a lookup when the caller already has it
 * @param {{ name?: string }} [partnerUser]  avoids a lookup when already loaded
 * @returns {Promise<string>}
 */
export const displayNameFor = async (alignmentId, viewerId, partnerId, partnerUser) => {
  const connection = await Alignment.findById(alignmentId).lean();
  if (!connection) return ANONYMOUS_LABEL;

  const partner = partnerId ? String(partnerId) : partnerIdFor(connection, viewerId);
  if (!partner) return ANONYMOUS_LABEL;

  const alias = aliasFor(connection, partner);
  if (alias) return alias;

  if (canViewProfileIn(connection, viewerId, partner)) {
    const name = partnerUser?.name;
    if (typeof name === 'string' && name.trim()) return name.trim();
  }

  return ANONYMOUS_LABEL;
};

/**
 * Build the grant rows a brand-new connection starts with.
 *
 * The asymmetry is the feature. Entering Roulette with "show my profile" ON
 * grants your partner access to YOUR profile and grants nobody access to
 * theirs — visibility is something you give, not something you receive.
 *
 * @param {{ _id: string }} viewer   the person creating the connection
 * @param {string} partnerId
 * @param {boolean} viewerShowsProfile
 * @returns {Array<object>} zero or one grant
 */
export const grantsForNewConnection = (viewer, partnerId, viewerShowsProfile) => {
  if (!viewerShowsProfile) return [];
  return [
    {
      viewerId: String(partnerId),
      subjectId: String(viewer._id),
      source: 'roulette_visible',
      grantedAt: new Date(),
    },
  ];
};

/**
 * The grants to write when both parties consent to share profiles.
 *
 * Always exactly two, in both directions — a mutual reveal that only
 * unhid one person would be a bug, not a partial success.
 *
 * @param {string} a
 * @param {string} b
 * @returns {Array<object>}
 */
export const grantsForMutualReveal = (a, b) => {
  const now = new Date();
  return [
    { viewerId: String(a), subjectId: String(b), source: 'roulette_reveal', grantedAt: now },
    { viewerId: String(b), subjectId: String(a), source: 'roulette_reveal', grantedAt: now },
  ];
};

```

### ./server/utils/publicCard.js

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

### ./server/utils/push.js

```
import webPush from 'web-push';
import User from '../models/User.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    'mailto:admin@matchalize.app',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export const sendPushNotification = async (userId, payload) => {
  try {
    // ⚠️ The status flags were never selected here, so they could never be
    // tested. Suspension blocks the *user* from acting (middleware/auth.js
    // rejects them and the deck filters them out), but it did nothing to stop
    // their device being handed inbound content: an active alignment is not
    // deactivated on suspension, so their counterpart could keep messaging them
    // and the lock screen kept showing up to 100 chars of the message text.
    // The fix is here rather than at each call site so no future caller can
    // reintroduce it by forgetting a pre-check.
    const user = await User.findById(userId).select(
      'pushSubscription name suspended isDeleted shadowbannedAt contentFrozen'
    );
    if (!user?.pushSubscription) return false;

    if (user.suspended || user.isDeleted) {
      // Moderation action, not a transient failure: drop the subscription so a
      // suspended device stops being a notification target entirely rather than
      // relying on this guard on every future send.
      await User.findByIdAndUpdate(userId, { pushSubscription: null }).catch(() => {});
      console.warn(
        `[push] Suppressed notification for ${userId} (suspended=${!!user.suspended} deleted=${!!user.isDeleted}); cleared subscription`
      );
      return false;
    }

    // Shadowbanned users still function normally in the app (that is the point of
    // a shadowban), so they keep receiving their own notifications — only the
    // sender is misled. Not treated as a suppression case.

    const notificationPayload = {
      title: payload.title || 'Matchalize',
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: payload.data || {},
      vibrate: [100, 50, 100],
    };

    await webPush.sendNotification(
      user.pushSubscription,
      JSON.stringify(notificationPayload)
    );
    return true;
  } catch (error) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired or invalid, remove it
      await User.findByIdAndUpdate(userId, { pushSubscription: null }).catch(() => {});
    }
    console.error('Push notification error:', error.message);
    return false;
  }
};

export const generateVapidKeys = () => {
  return webPush.generateVAPIDKeys();
};

```

### ./server/utils/queue.js

```
import * as Sentry from '@sentry/node';

// A zero-dependency, free background task runner.
// Detaches async tasks (push notifications, emails) from the Express response cycle.
// Concurrency-capped FIFO worker pool so a burst of tasks (e.g. push at launch)
// can't overwhelm external services or spike memory.
const MAX_CONCURRENT = 20;

// ⚠️ A task that never settles used to leak its slot FOREVER: `running` was only
// decremented in `.finally()`, which never runs if the promise never resolves.
// Twenty such tasks and `running` stayed at 20, so the `while` below never ran
// again — and every subsequent push notification, email and background job for
// the entire app silently stopped, forever, with no log line, no Sentry event and
// no metric. The worst possible failure mode: notifications just quietly quit.
//
// The timeout converts "hangs forever" into "fails loudly, then moves on", and
// the saturation log makes the condition diagnosable instead of invisible.
const TASK_TIMEOUT_MS = 15_000;

// Bound memory when producers outpace consumers. Without this, `queue.push` is
// unbounded and a traffic spike can grow the array without limit.
const MAX_QUEUE_LENGTH = 1000;

let droppedTasks = 0;
let timedOutTasks = 0;

const queue = [];
let running = 0;

const pump = () => {
  // Diagnose the wedge condition even when it happens, rather than discovering
  // it weeks later from "users say notifications stopped".
  if (queue.length > MAX_QUEUE_LENGTH / 2 && running >= MAX_CONCURRENT) {
    console.warn(
      `[Background Queue] saturated: ${queue.length} queued, ${running}/${MAX_CONCURRENT} slots in use`
    );
  }

  while (running < MAX_CONCURRENT && queue.length > 0) {
    const task = queue.shift();
    running += 1;

    // ⚠️ The slot must be released by OUR chain settling, not by the task's own
    // promise settling. `running` is decremented in `.finally()` below, and
    // `.finally()` only runs when the promise it is attached to settles. Merely
    // logging on a timer is therefore not enough — the chain stays pending and the
    // slot leaks anyway. So the task is RACED against the timer: when the timer
    // wins, our promise rejects, `.catch()` records it and `.finally()` frees the
    // slot, while the abandoned task keeps running harmlessly in the background
    // (these are fire-and-forget notifications, so there is nothing to cancel).
    // `rejectTimeout` is wired into the Promise.race below. It must be declared
    // before the timer so the timer callback can reach it.
    let rejectTimeout;
    const timer = setTimeout(() => {
      timedOutTasks += 1;
      console.error(
        `[Background Queue] task exceeded ${TASK_TIMEOUT_MS}ms; releasing its slot`
      );
      rejectTimeout?.(new Error(`task exceeded ${TASK_TIMEOUT_MS}ms`));
    }, TASK_TIMEOUT_MS);

    Promise.resolve()
      .then(() => {
        // Arm the race: whichever settles first wins.
        return Promise.race([
          Promise.resolve().then(task),
          new Promise((_, reject) => {
            rejectTimeout = reject;
          }),
        ]);
      })
      .catch((error) => {
        // The timer already logged the timeout, and an abandoned task is not an
        // application bug worth waking Sentry for — it is an infra symptom. Real
        // task failures still get reported.
        if (error?.message?.includes(`exceeded ${TASK_TIMEOUT_MS}ms`)) return;
        console.error('[Background Queue Error]', error);
        // Surface background failures in Sentry when initialized (safe no-op if DSN unset)
        Sentry.captureException(error);
      })
      .finally(() => {
        clearTimeout(timer);
        running -= 1;
        setImmediate(pump);
      });
  }
};

export const addToQueue = (task) => {
  if (queue.length >= MAX_QUEUE_LENGTH) {
    droppedTasks += 1;
    // Dropping is strictly better than growing without bound, and the counter
    // makes it visible.
    console.error(
      `[Background Queue] at capacity (${MAX_QUEUE_LENGTH}); dropped task. Total dropped: ${droppedTasks}`
    );
    return;
  }
  queue.push(task);
  setImmediate(pump);
};

/** Health counters — for debugging "notifications stopped" reports. */
export const getQueueStats = () => ({
  queued: queue.length,
  running,
  maxConcurrent: MAX_CONCURRENT,
  maxQueueLength: MAX_QUEUE_LENGTH,
  droppedTasks,
  timedOutTasks,
});
```

### ./server/utils/signalingRateLimit.js

```
/**
 * 🚦 SIGNALING RATE LIMIT — per-user, in-memory.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────────────
 * Nothing has ever touched a socket event. Every limiter in
 * `middleware/rateLimiters.js` is `express-rate-limit`, which needs a `req` —
 * sockets have none — so all six of those are invisible here.
 *
 * Stage 3 is the first feature where strangers send us arbitrary strings. SDP
 * blobs and ICE candidates are attacker-controlled and arrive at machine speed,
 * so without a ceiling one authenticated account can flood the process: every
 * relayed candidate is a socket emit to another user plus a JSON parse.
 *
 * ── WHY KEYED BY USER, NOT IP ────────────────────────────────────────────────
 * An entire college sits behind one NAT address. An IP limit on signaling would
 * throttle a whole campus during a busy evening. `verifyOtpLimiter` in
 * `middleware/rateLimiters.js` already documents this reasoning for signups;
 * the same argument applies harder here, because a call is continuous traffic
 * rather than a one-off.
 *
 * ── WHY A TOKEN BUCKET ───────────────────────────────────────────────────────
 * ICE candidates legitimately arrive in bursts — a dozen within the first
 * second after `setRemoteDescription`. A fixed window either breaks real calls
 * or is loose enough to be useless. A bucket with a burst allowance passes the
 * burst and still bounds the sustained rate, which is the actual abuse shape:
 * a loop, not a spike.
 */

/**
 * Create a rate limiter.
 *
 * @param {object} opts
 * @param {number} opts.ratePerSecond   sustained events/second allowed
 * @param {number} opts.burst           bucket depth, i.e. burst allowance
 * @param {number} opts.maxKeys         hard cap on tracked users (memory bound)
 * @param {number} [opts.idleTtlMs]     evict a user after this long unused
 * @param {() => number} [opts.now]     clock, injectable for tests
 */
export const createSignalingRateLimiter = ({
  ratePerSecond,
  burst,
  maxKeys = 5_000,
  idleTtlMs = 10 * 60 * 1000,
  now = Date.now,
}) => {
  const buckets = new Map();

  /**
   * Try to spend `cost` tokens for `key`.
   * @returns {{ ok: boolean, retryAfterMs: number }}
   */
  const take = (key, cost = 1) => {
    if (!key) return { ok: false, retryAfterMs: 0 };

    const t = now();
    let bucket = buckets.get(key);

    if (!bucket) {
      // Map is insertion-ordered, so the first key is the least recently used.
      // Dropping it on overflow is an O(1) LRU rather than a full scan.
      if (buckets.size >= maxKeys) {
        const oldest = buckets.keys().next().value;
        buckets.delete(oldest);
      }
      bucket = { tokens: burst, updatedAt: t };
      buckets.set(key, bucket);
    }

    // Refill for elapsed time, then reject if the bucket is empty.
    const elapsedMs = Math.max(0, t - bucket.updatedAt);
    bucket.tokens = Math.min(burst, bucket.tokens + (elapsedMs / 1000) * ratePerSecond);
    bucket.updatedAt = t;

    if (bucket.tokens < cost) {
      const deficit = cost - bucket.tokens;
      return { ok: false, retryAfterMs: Math.ceil((deficit / ratePerSecond) * 1000) };
    }

    bucket.tokens -= cost;
    return { ok: true, retryAfterMs: 0 };
  };

  /** Forget a user's bucket — call on disconnect so idle users don't accumulate. */
  const forget = (key) => {
    buckets.delete(key);
  };

  /** Sweep users idle beyond `idleTtlMs`. Call from a timer, not per event. */
  const sweep = () => {
    const cutoff = now() - idleTtlMs;
    for (const [key, bucket] of buckets) {
      if (bucket.updatedAt < cutoff) buckets.delete(key);
    }
  };

  return { take, forget, sweep, size: () => buckets.size };
};

export default createSignalingRateLimiter;

```

