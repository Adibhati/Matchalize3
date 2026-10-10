# Chunk 19 — Server Core

> Matchalize · `server-core` · files 19 of 25 chunks · 5 file(s) · 17 KB · ~5,100 tokens
> Generated 2026-10-09 14:03.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./server/utils/media.js`
> - `./server/utils/otpHash.js`
> - `./server/utils/publicCard.js`
> - `./server/utils/push.js`
> - `./server/utils/queue.js`

---
### ./server/utils/media.js

```
/**
 * 🔐 MEDIA OWNERSHIP
 *
 * Every upload this app makes is traceable back to the user who uploaded it:
 *
 *   Cloudinary → matchalize/photos/<userId>/<file>   (prod)
 *                matchalize/audio/<userId>/<file>
 *   Local disk  → /uploads/<userId>-<timestamp>.<ext> (dev fallback)
 *
 * Both layouts put the uploader's id in the path, so ownership can be proven
 * from the URL alone. That matters because a URL is user-supplied data: any
 * authenticated user can POST someone else's photo URL into their own profile.
 * Without this check, saving/swapping/deleting a profile would tell the delete
 * helper to destroy a file belonging to somebody else.
 *
 * Cloudinary holds every user's media in ONE account with ONE API secret, so
 * "I have the secret" is not ownership. The folder is the only real proof.
 */

/**
 * A Cloudinary delivery URL is laid out as:
 *
 *   .../<resource_type>/upload/<transformations>/v<version>/<public_id>.<ext>
 *                                          └──────┬──────┘
 *                          everything after this marker is the public_id path,
 *                          i.e. FOLDERS — and is never guessable
 *
 * The bug this guards against: `f_images` is shaped exactly like a
 * transformation parameter (`f` + `_` + `images`), so a naive "delete anything
 * that looks like a transform" filter cannot tell a real folder from a
 * formatting instruction and will eat the folder. That yields a mangled
 * public_id, which then fails isCloudinaryFileOwnedBy() below, so the delete is
 * refused rather than wrongly performed — but the file is then never cleaned up.
 *
 * The invariant that makes this safe: transformation segments only ever appear
 * BEFORE the version marker, never after. So strip transformations only in that
 * position and leave everything after it untouched.
 *
 * Note this is a strict tightening — it strips strictly less than a naive
 * filter would, so a parse failure can only cause a *refused* delete (safe
 * leak), never destruction of someone else's file. That direction matters:
 * this function backs the ownership guard in config/cloudinary.js.
 *
 * ⚠️ This is the single source of truth for ownership. Weaken it and the guard
 * in config/cloudinary.js weakens with it. If you're ever tempted to make this
 * more permissive to fix a "cleanup didn't work" bug, the correct fix is to
 * store public_id at upload time and stop parsing URLs entirely.
 */
export const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  try {
    const uploadIdx = url.indexOf('/upload/');
    if (uploadIdx === -1) return null;
    const segments = url.slice(uploadIdx + '/upload/'.length).split('/');

    // Transformations only ever appear before the version marker, so anything at
    // or after that marker is public_id path — folders included — and is kept.
    //
    // If there is no version marker at all the URL isn't in the shape we can
    // parse safely. Rather than rejecting it (which would break a user's own
    // legitimate photo) strip nothing: the ownership check downstream will then
    // simply refuse to act on it, which is a safe outcome. Upload responses
    // from Cloudinary always include a version, so this is a fallback, not the
    // normal path.
    const versionIdx = segments.findIndex((seg) => /^v\d+$/.test(seg));

    const publicSegments = segments.filter((seg, i) => {
      if (i === versionIdx) return false; // version marker, never part of the id
      if (versionIdx !== -1 && i < versionIdx && /^[a-z]{1,4}_[a-z0-9.:]+(,[a-z]{1,4}_[a-z0-9.:]+)*$/i.test(seg)) {
        return false;
      }
      return true;
    });

    const publicId = publicSegments.join('/').replace(/\.[a-z]+$/i, '');
    return publicId || null;
  } catch {
    return null;
  }
};

/** True when this Cloudinary file sits in the given user's own folder. */
export const isCloudinaryFileOwnedBy = (url, userId) => {
  if (!userId) return false;
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return false;
  return publicId.startsWith(`matchalize/photos/${userId}/`) ||
         publicId.startsWith(`matchalize/audio/${userId}/`);
};

/** True when this is a local dev-fallback upload made by the given user. */
export const isLocalFileOwnedBy = (url, userId) => {
  if (!userId || !url || typeof url !== 'string') return false;
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(/^\/uploads\/([a-f0-9]{24})-[^/]+$/i);
    return !!match && match[1] === userId.toString();
  } catch {
    return false;
  }
};

/**
 * Is this media URL provably this user's own upload?
 * Local disk and per-user Cloudinary folders both qualify. Unsplash placeholders
 * are intentionally NOT "owned" — they live on someone else's CDN and this app
 * can never delete them, so ownership is meaningless for them.
 */
export const isOwnedMediaUrl = (url, userId) => {
  if (!userId || !url || typeof url !== 'string') return false;
  return isCloudinaryFileOwnedBy(url, userId) || isLocalFileOwnedBy(url, userId);
};

/**
 * External placeholder images (seed/demo profiles). Allowed in profiles because
 * they are read-only stock photos, but never treated as deletable assets.
 */
export const isExternalPlaceholderUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const { hostname } = new URL(url);
    return hostname === 'images.unsplash.com';
  } catch {
    return false;
  }
};

/**
 * A profile/chat media URL is acceptable if it is the user's own upload or a
 * known external placeholder. Anything else — notably another user's file — is
 * rejected so it can never reach a delete call.
 */
export const isAcceptableMediaUrl = (url, userId) =>
  isOwnedMediaUrl(url, userId) || isExternalPlaceholderUrl(url);

```

### ./server/utils/otpHash.js

```
import crypto from 'crypto';

// OTP codes are stored as an HMAC-SHA256 fingerprint, never in plaintext.
// A bare SHA-256 would be useless here: only 10^6 possible codes, so a stolen
// hash could be reversed in seconds by hashing all of them. HMAC needs the
// secret key too, so a database-only leak cannot be brute-forced.
//
// The email is bound into the HMAC input so the same code used on two accounts
// yields two different fingerprints (domain separation).
const getSecret = () => process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;

// MUST normalise: hashOtp has to be byte-identical at store time (send-otp)
// and at verify time, and the route callers are not trusted to normalise.
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const hashOtp = (email, otp) =>
  crypto
    .createHmac('sha256', getSecret())
    .update(`${normalizeEmail(email)}:${otp}`)
    .digest('hex');

// Constant-time compare so the comparison does not leak the fingerprint
// character by character. The length guard makes legacy plaintext rows fail
// safe to `false` instead of throwing on a Buffer length mismatch.
export const verifyOtp = (email, otp, storedHash) => {
  const candidate = Buffer.from(hashOtp(email, otp), 'hex');
  const stored = Buffer.from(String(storedHash || ''), 'hex');
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
};

export { normalizeEmail };

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

