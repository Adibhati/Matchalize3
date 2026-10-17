# Chunk 19 — Server Core

> Matchalize · `server-core` · files 19 of 27 chunks · 18 file(s) · 93 KB · ~27,348 tokens
> Generated 2026-10-17 21:10.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./server/models/Notification.js`
> - `./server/models/OTP.js`
> - `./server/models/Report.js`
> - `./server/models/Setting.js`
> - `./server/models/User.js`
> - `./server/models/index.js`
> - `./server/scripts/audit-cloudinary-orphans.mjs`
> - `./server/scripts/backfill-age.mjs`
> - `./server/scripts/backfill-ladder.mjs`
> - `./server/scripts/drop-waitlist.mjs`
> - `./server/scripts/migrate-alignment.mjs`
> - `./server/scripts/migrate-intent-rename.mjs`
> - `./server/scripts/migrate-remove-isghost.mjs`
> - `./server/scripts/migrate-roulette-source.mjs`
> - `./server/scripts/reset-colleges.mjs`
> - `./server/scripts/reverify-sweep.mjs`
> - `./server/scripts/seed-iitb.mjs`
> - `./server/scripts/verify-deck-metrics.mjs`

---
### ./server/models/Notification.js

```
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

```

### ./server/models/OTP.js

```
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    // HMAC-SHA256 fingerprint of the code — NOT the code itself.
    // See utils/otpHash.js. The plaintext code only ever exists in memory
    // long enough to be emailed.
    otpHash: {
      type: String,
      required: true,
    },
    // The college the user PICKED before requesting the code.
    //
    // ⚠️ This is the binding between step 1 (pick your college) and step 3
    // (enter the code). It lives server-side so the client cannot re-assert a
    // different college at verification time — otherwise the picker would be
    // advisory only, since anyone could send a code request for IIT Bombay and
    // verify against whichever college they actually wanted.
    collegeCode: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Document will expire at the specified date
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for rate limiting queries (find by email within last hour)
otpSchema.index({ email: 1, createdAt: 1 });

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;

```

### ./server/models/Report.js

```
import mongoose from 'mongoose';

export const REPORT_REASONS = [
  'Inappropriate photos',
  'Harassment or bullying',
  'Fake profile or spam',
  'Underage user',
  'Other',
];

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, enum: REPORT_REASONS, required: true },
  details: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed', 'actioned'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

reportSchema.index({ reporter: 1, reported: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);
export default Report;

```

### ./server/models/Setting.js

```
import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);
```

### ./server/models/User.js

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
// platform-wide, so that leading field now only serves the card's own college
// badge — `?campusOnly=true` narrowing has been removed entirely, so nothing in
// the feed query filters on it any more. Leaving it first would mean the common
// case couldn't use this index at all, leaving the whole deck scan unindexed.
//
// Reordered so the always-present equality fields come first, `collegeCode`
// sits mid-compound, and `randomSeed`
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

### ./server/models/index.js

```
/**
 * 📦 MODEL BARREL
 *
 * Every model in one import, so `config/db.js` can verify indexes at boot
 * without depending on the import order of whatever file happens to use it.
 *
 * WHY THIS EXISTS: the boot-time index check needs a known, non-empty set of
 * registered models. Reading `mongoose.modelNames()` inside db.js works today
 * only because index.js imports every route above the connectDB() call — an
 * accident of file ordering. Import this barrel instead and the check is
 * correct no matter who calls connectDB (server boot, a script, a test).
 *
 * ⚠️ WHEN YOU ADD A NEW MODEL, ADD IT HERE TOO. Without it the new model's
 * indexes are never verified at boot, which is the exact failure this file
 * exists to prevent.
 */
export { default as Alignment } from './Alignment.js';
export { default as Analytics } from './Analytics.js';
export { default as Block } from './Block.js';
/* College and CollegeRequest were previously absent from this barrel and only
   reached modelNames() by accident of import order — routes/admin.js happens to
   import them before connectDB() runs. That is exactly the coupling this file
   exists to remove, and it meant their indexes were verified only as long as
   that import ordering held. */
export { default as College } from './College.js';
export { default as CollegeRequest } from './CollegeRequest.js';
export { default as DeckImpression } from './DeckImpression.js';
export { default as DiscoverSession } from './DiscoverSession.js';
export { default as Interaction } from './Interaction.js';
export { default as Message } from './Message.js';
export { default as Notification } from './Notification.js';
export { default as OTP } from './OTP.js';
export { default as Report } from './Report.js';
export { default as Setting } from './Setting.js';
export { default as User } from './User.js';
/* Waitlist was removed for the IIT Bombay pilot. The invite list is the gate,
   not a public queue, so the model, its routes, and its page are gone rather
   than merely unmounted — an orphaned collection with indexes still being
   verified at boot is worse than no collection. Restore all three together if
   a staged launch ever needs them back. */
```

### ./server/scripts/audit-cloudinary-orphans.mjs

```
/**
 * 🧹 CLOUDINARY ORPHAN AUDIT
 *
 * Recovers the storage lost to the deleted-message media leak
 * (routes/messages.js:286 passed no userId, so the ownership guard refused every
 * cleanup and the file stayed in Cloudinary forever).
 *
 * That bug is fixed, but the files it orphaned are still in Cloudinary and still
 * count against the storage cap. This script finds them.
 *
 * HOW IT DECIDES: every Cloudinary asset under matchalize/ is listed from the
 * Cloudinary Admin API, then compared against every media URL still referenced
 * in MongoDB. Anything in Cloudinary that no live record points at is an orphan.
 * Soft-deleted messages are excluded from the reference set because their
 * image/mediaUrl were blanked at messages.js:291-292 — so their assets are
 * correctly reported as orphans.
 *
 * 🔒 READ-ONLY BY DEFAULT. Nothing is destroyed unless you pass --execute.
 *
 * USAGE
 *   node server/scripts/audit-cloudinary-orphans.mjs
 *   node server/scripts/audit-cloudinary-orphans.mjs --execute
 *   node server/scripts/audit-cloudinary-orphans.mjs --execute --min-age-hours 48
 *
 * Before --execute, read the report and sanity-check the count. A large number
 * is expected if the leak ran for a while. A number that looks *too* high (e.g.
 * most of your library) means a reference field was missed below — abort.
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { extractCloudinaryPublicId } from '../utils/media.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadEnv = () => {
  for (const p of [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      if (!process.env[key]) process.env[key] = line.slice(idx + 1).trim();
    }
    return p;
  }
  return null;
};

const argv = process.argv.slice(2);
const EXECUTE = argv.includes('--execute');
const minAgeArg = argv.indexOf('--min-age-hours');
const MIN_AGE_HOURS = minAgeArg !== -1 ? Number(argv[minAgeArg + 1]) : 24;

const bytesToMb = (b) => (b / 1024 / 1024).toFixed(1);

/** Every media URL still referenced by a live record. */
const collectReferenced = async () => {
  const refs = new Set();
  let refCount = 0;

  const users = await User.find(
    { $or: [{ 'photos.0': { $exists: true } }, { bioPhoto: { $nin: ['', null] } }, { 'prompts.0': { $exists: true } }] },
    { photos: 1, bioPhoto: 1, prompts: 1 }
  ).lean();

  const addRef = (url) => {
    if (!url) return;
    refs.add(url);
    refCount += 1;
  };

  for (const u of users) {
    for (const url of u.photos || []) addRef(url);
    addRef(u.bioPhoto);
    for (const p of u.prompts || []) addRef(p?.photoUrl);
  }

  const messages = await Message.find(
    { $or: [{ mediaUrl: { $nin: ['', null] } }, { image: { $nin: ['', null] } }] },
    { mediaUrl: 1, image: 1 }
  ).lean();

  for (const m of messages) {
    addRef(m.mediaUrl);
    addRef(m.image);
  }

  return { refs, refCount, users: users.length, messages: messages.length };
};

/**
 * All Cloudinary assets this app owns, for both resource types.
 *
 * Prefix is `matchalize` with NO trailing slash on purpose: the current layout
 * is matchalize/photos/<userId>/, but an older one used matchalize_messages/.
 * Scanning `matchalize/` alone would silently skip the legacy folder and hide
 * its orphans. Known legacy public_ids:
 *   matchalize_messages/<file>            — pre-per-user-folder uploads
 *
 * Note the param name: the Admin API takes `resource_type` ('image' | 'video').
 * `type` means the delivery type ('upload' | 'private' | 'authenticated') —
 * passing `type: 'image'` fails with "Invalid value image for parameter type".
 */
const listCloudAssets = async () => {
  const assets = [];
  for (const resourceType of ['image', 'video']) {
    let cursor;
    do {
      const res = await cloudinary.api.resources({
        resource_type: resourceType,
        type: 'upload',
        prefix: 'matchalize',
        max_results: 500,
        ...(cursor ? { next_cursor: cursor } : {}),
      });
      for (const r of res.resources || []) {
        assets.push({
          public_id: r.public_id,
          resource_type: r.resource_type || resourceType,
          bytes: r.bytes || 0,
          created_at: r.created_at,
        });
      }
      cursor = res.next_cursor;
    } while (cursor);
  }
  return assets;
};

const run = async () => {
  const envFile = loadEnv();
  console.log(`📄 env: ${envFile || 'none (using process env)'}`);
  console.log(`🔍 mode: ${EXECUTE ? '⚠️  EXECUTE (will destroy)' : 'read-only (report only)'}`);
  console.log(`⏳ grace period: skipping assets newer than ${MIN_AGE_HOURS}h\n`);

  const missing = ['MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    .filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`❌ Missing env: ${missing.join(', ')}`);
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);

  const { refs, refCount, users, messages } = await collectReferenced();
  console.log(`   referenced URLs: ${refCount} (from ${users} users, ${messages} messages)`);

  const assets = await listCloudAssets();
  console.log(`   Cloudinary assets under matchalize*: ${assets.length}\n`);

  const referencedIds = new Set();
  for (const url of refs) {
    const id = extractCloudinaryPublicId(url);
    if (id) referencedIds.add(id);
  }

  const cutoff = Date.now() - MIN_AGE_HOURS * 3600 * 1000;
  const tooRecent = [];
  const orphans = [];
  for (const a of assets) {
    if (new Date(a.created_at).getTime() > cutoff) tooRecent.push(a);
    else if (!referencedIds.has(a.public_id)) orphans.push(a);
  }

  const orphanBytes = orphans.reduce((s, a) => s + a.bytes, 0);
  const totalBytes = assets.reduce((s, a) => s + a.bytes, 0);

  console.log('───────────────��──────────────────────────────');
  console.log(`  Reachable      ${assets.length - orphans.length - tooRecent.length}`);
  console.log(`  Too recent      ${tooRecent.length}  (inside grace period, untouched)`);
  console.log(`  ORPHANS         ${orphans.length}  ← ${bytesToMb(orphanBytes)} MB reclaimable`);
  console.log(`  Total library   ${bytesToMb(totalBytes)} MB`);
  console.log('─────────────────────────────────────────────');

  if (!orphans.length) {
    console.log('\n✅ No orphans. Nothing to reclaim.');
    await mongoose.disconnect();
    return;
  }

  console.log('\nOldest 10 orphans:');
  orphans
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(0, 10)
    .forEach((a) => console.log(`   ${a.created_at.slice(0, 10)}  ${bytesToMb(a.bytes).padStart(6)} MB  ${a.public_id}`));
  if (orphans.length > 10) console.log(`   ... and ${orphans.length - 10} more`);

  if (!EXECUTE) {
    console.log('\n📋 Report only. Re-run with --execute to destroy these.');
    await mongoose.disconnect();
    return;
  }

  console.log(`\n⚠️  Destroying ${orphans.length} orphan(s)...`);
  let failed = 0;
  for (const a of orphans) {
    try {
      const r = await cloudinary.uploader.destroy(a.public_id, { resource_type: a.resource_type });
      if (r?.result !== 'ok') {
        failed++;
        console.warn(`   ⚠️  ${r?.result || 'unknown'} ${a.public_id}`);
      }
    } catch (e) {
      failed++;
      console.warn(`   ❌ ${a.public_id}: ${e.message}`);
    }
  }
  console.log(`\n✅ Destroyed ${orphans.length - failed}/${orphans.length} (${failed} failed).`);
  console.log(`   Reclaimed up to ${bytesToMb(orphanBytes)} MB.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  // Cloudinary SDK errors put the useful text on err.error.message and leave
  // err.message undefined, so surface both.
  console.error('❌ Audit failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});
```

### ./server/scripts/backfill-age.mjs

```
/**
 * 🎂 AGE BACKFILL
 *
 * `User.age` is written once during onboarding and never refreshed, so it drifts
 * by one year every birthday. The Discover deck and the Matches/Chat surfaces no
 * longer read it — they derive a current age from `dob` at request time (see
 * utils/age.js). But three surfaces still read the stored field, because they
 * can't compute on read:
 *
 *   - routes/notifications.js   → `.populate('senderId', '... age ...')`
 *   - GET /api/auth/me          → full document
 *   - GET /api/users/profile    → full document
 *
 * This script recomputes `age` from `dob` for every user so those three are
 * correct. Safe to re-run any time: it only writes rows whose age actually
 * differs, and reports what it changed.
 *
 * USAGE
 *   node server/scripts/backfill-age.mjs           # report only, changes nothing
 *   node server/scripts/backfill-age.mjs --execute # apply
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeAgeFromDob } from '../utils/age.js';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadEnv = () => {
  for (const p of [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      if (!process.env[key]) process.env[key] = line.slice(idx + 1).trim();
    }
    return p;
  }
  return null;
};

const EXECUTE = process.argv.includes('--execute');

const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in server/.env');
    process.exit(1);
  }
  console.log(`📄 env: ${envFile}`);
  console.log(`🔍 mode: ${EXECUTE ? '⚠️  EXECUTE (will write)' : 'report only'}`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  // Only users who actually have a dob can be recomputed. Users without one
  // keep whatever age they have (or null) — we must not invent a value.
  const users = await User.find({ dob: { $ne: null } }, { age: 1, dob: 1, name: 1, email: 1 }).lean();

  const ops = [];
  let noDob = 0;
  for (const u of users) {
    const correct = computeAgeFromDob(u.dob);
    if (correct === null) { noDob++; continue; }
    if (u.age === correct) continue;
    ops.push({
      updateOne: {
        filter: { _id: u._id },
        update: { $set: { age: correct } },
      },
      label: `${u.name || u.email || u._id}: ${u.age ?? 'null'} → ${correct}`,
    });
  }

  const [total, withDob] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ dob: { $ne: null } }),
  ]);
  const noDobAnywhere = total - withDob;

  console.log(`users total          ${total}`);
  console.log(`with a dob           ${withDob}`);
  console.log(`without a dob        ${noDobAnywhere}  (age left as-is)`);
  console.log(`unparseable dob      ${noDob}`);
  console.log(`stale ages to fix    ${ops.length}\n`);

  if (!ops.length) {
    console.log('✅ Nothing to backfill.');
    await mongoose.disconnect();
    return;
  }

  ops.slice(0, 15).forEach((o) => console.log(`   ${o.label}`));
  if (ops.length > 15) console.log(`   ... and ${ops.length - 15} more`);

  if (!EXECUTE) {
    console.log('\n📋 Report only. Re-run with --execute to apply.');
    await mongoose.disconnect();
    return;
  }

  const result = await User.bulkWrite(ops.map((o) => o.updateOne));
  console.log(`\n✅ Updated ${result.modifiedCount} document(s).`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Backfill failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});
```

### ./server/scripts/backfill-ladder.mjs

```
/**
 * 🪜 PROFILE LADDER BACKFILL
 *
 * `User.profileScore` is owned by utils/ladder.js and recomputed on every
 * profile write. But documents that existed BEFORE the field landed never go
 * through a write, so they keep the schema default of 0.
 *
 * That matters more than it looks: 0 is below LADDER.publish (45), so every
 * pre-existing user would read as "not published" the moment the deck starts
 * gating on this — they'd lose their deck until they edited their profile once.
 *
 * This script recomputes the score for every user from the fields already on
 * the document. Safe to re-run: it only writes rows whose score actually
 * differs, and reports what it changed.
 *
 * It also carries the ladder's invariants as runtime assertions. Re-weighting
 * WEIGHTS in utils/ladder.js without preserving the gate promise would ship a
 * gate that tells users "add a photo and a prompt" and then keeps them locked
 * — so this script fails loudly instead.
 *
 * USAGE
 *   node server/scripts/backfill-ladder.mjs           # report only, changes nothing
 *   node server/scripts/backfill-ladder.mjs --execute # apply
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeScore, LADDER } from '../utils/ladder.js';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadEnv = () => {
  for (const p of [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      if (!process.env[key]) process.env[key] = line.slice(idx + 1).trim();
    }
    return p;
  }
  return null;
};

const EXECUTE = process.argv.includes('--execute');

/**
 * Fail fast if the weights no longer satisfy the design. These are cheap and
 * they protect the one promise the gate makes out loud.
 */
const assertInvariants = () => {
  const photo = (n) => Array.from({ length: n }, (_, i) => `photo${i}.jpg`);
  const prompts = (n) =>
    Array.from({ length: n }, (_, i) => ({ question: `q${i}`, answer: `a${i}` }));

  const publishSet = {
    photos: photo(1),
    gender: 'Female',
    name: 'Anaya',
    year: 'UG',
    intent: ['Dating'],
  };

  const publish = computeScore(publishSet);
  if (publish !== LADDER.publish) {
    throw new Error(
      `Publish band scores ${publish}, expected ${LADDER.publish}. ` +
        `The 0→${LADDER.publish} weights no longer sum to the threshold.`,
    );
  }

  const unlocked = computeScore({ ...publishSet, photos: photo(2), prompts: prompts(1) });
  if (unlocked < LADDER.interact) {
    throw new Error(
      `GATE INVARIANT BROKEN: one photo + one prompt scores ${unlocked}, ` +
        `which is below interact (${LADDER.interact}). The gate would promise ` +
        `an unlock and then keep the user locked. photo2 + prompt1 must sum ` +
        `to ${LADDER.interact - LADDER.publish}.`,
    );
  }

  const complete = computeScore({ ...publishSet, photos: photo(4), prompts: prompts(3) });
  if (complete !== LADDER.aspirational) {
    throw new Error(
      `A fully built profile scores ${complete}, expected ${LADDER.aspirational}.`,
    );
  }

  console.log('✅ Invariants hold: publish=45, photo+prompt unlocks, full=100');
};

const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in server/.env');
    process.exit(1);
  }
  console.log(`📄 env: ${envFile}`);
  console.log(`🔍 mode: ${EXECUTE ? '⚠️  EXECUTE (will write)' : 'report only'}`);
  assertInvariants();
  console.log('');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  // Only the fields computeScore reads. Nothing else can change the score, so
  // there is no reason to pull whole documents into memory.
  const users = await User.find(
    {},
    { name: 1, email: 1, photos: 1, prompts: 1, gender: 1, year: 1, intent: 1, profileScore: 1 },
  ).lean();

  const ops = [];
  const buckets = { locked: 0, published: 0, interactable: 0, aspirational: 0 };

  for (const u of users) {
    const correct = computeScore(u);
    const band =
      correct >= LADDER.aspirational
        ? 'aspirational'
        : correct >= LADDER.interact
          ? 'interactable'
          : correct >= LADDER.publish
            ? 'published'
            : 'locked';
    buckets[band]++;
    if (u.profileScore === correct) continue;
    ops.push({
      updateOne: {
        filter: { _id: u._id },
        update: { $set: { profileScore: correct } },
      },
      label: `${u.name || u.email || u._id}: ${u.profileScore ?? 0} → ${correct} (${band})`,
    });
  }

  console.log(`users total             ${users.length}`);
  console.log(`  band locked          ${buckets.locked}`);
  console.log(`  band published       ${buckets.published}`);
  console.log(`  band interactable    ${buckets.interactable}`);
  console.log(`  band aspirational    ${buckets.aspirational}`);
  console.log(`scores to fix          ${ops.length}\n`);

  if (!ops.length) {
    console.log('✅ Nothing to backfill.');
    await mongoose.disconnect();
    return;
  }

  ops.slice(0, 15).forEach((o) => console.log(`   ${o.label}`));
  if (ops.length > 15) console.log(`   ... and ${ops.length - 15} more`);

  if (!EXECUTE) {
    console.log('\n📋 Report only. Re-run with --execute to apply.');
    await mongoose.disconnect();
    return;
  }

  const result = await User.bulkWrite(ops.map((o) => ({ updateOne: o.updateOne })));
  console.log(`\n✅ Updated ${result.modifiedCount} document(s).`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Backfill failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});
```

### ./server/scripts/drop-waitlist.mjs

```
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadEnv = () => {
  for (const p of [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      if (!process.env[key]) process.env[key] = line.slice(idx + 1).trim();
    }
    return p;
  }
  return null;
};

/**
 * 🧹 DROP THE ORPHANED WAITLIST COLLECTION.
 *
 * Removing the waitlist removed the code. This removes what the code left
 * behind: a `waitlist` collection, and the indexes it created, still sitting
 * in the database with nothing reading them.
 *
 * Why bother, since it is inert:
 *   - It holds real email addresses that people submitted. Those addresses
 *     were collected for a purpose that no longer exists, and leaving them is
 *     the kind of thing that becomes a privacy question the day you notice.
 *   - An orphaned indexed collection is invisible in every dashboard except a
 *     database browser, which is precisely why it gets forgotten.
 *
 * ── WHY THIS IS DESTRUCTIVE, AND WHY IT STILL ASKS ──────────────────────────
 * There is no undo without a backup. The dry-run default prints the exact row
 * count and the addresses involved so that decision is an informed one rather
 * than a reflex — and if the count is anything other than what you expected,
 * that is a reason to stop and read the list before passing --execute.
 *
 *   node server/scripts/drop-waitlist.mjs            # report only
 *   node server/scripts/drop-waitlist.mjs --execute  # drop it
 */

const EXECUTE = process.argv.includes('--execute');

const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found. Set it in server/.env.');
    process.exit(1);
  }
  console.log(`📄 env: ${envFile}`);
  console.log(`🔍 mode: ${EXECUTE ? '⚠️  EXECUTE — collection will be DROPPED' : 'report only'}`);

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  console.log(`🗄  db:  ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  const exists = await db.listCollections({ name: 'waitlist' }).hasNext();

  if (!exists) {
    console.log('✅ No `waitlist` collection in this database. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  const count = await db.collection('waitlist').countDocuments({});
  const indexes = await db.collection('waitlist').indexes();
  console.log(`collection: waitlist`);
  console.log(`   documents: ${count}`);
  console.log(`   indexes:   ${indexes.length}`);

  if (count > 0) {
    // These are real addresses people typed in. Print them so the decision to
    // delete is made with the data in front of you, not in the abstract.
    const rows = await db.collection('waitlist')
      .find({}, { projection: { email: 1, name: 1, tier: 1, createdAt: 1 } })
      .sort({ createdAt: 1 })
      .limit(100)
      .toArray();

    console.log('\naddresses that will be deleted:');
    for (const r of rows) {
      const when = r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '?';
      console.log(`   ${String(r.email || '(none)').padEnd(38)} ${when}  ${r.tier || ''}`);
    }
    if (rows.length < count) console.log(`   … and ${count - rows.length} more`);
  }

  if (!EXECUTE) {
    console.log('\n📋 Report only. Re-run with --execute to drop the collection.');
    await mongoose.disconnect();
    return;
  }

  await db.collection('waitlist').drop();
  console.log('\n✅ Dropped collection: waitlist (documents and indexes).');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});
```

### ./server/scripts/migrate-alignment.mjs

```
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadEnv = () => {
  const envPaths = [
    path.join(__dirname, '../.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      for (const line of lines) {
        const idx = line.indexOf('=');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
      return p;
    }
  }
  return null;
};

const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found.');
    process.exit(1);
  }
  console.log(`🌱 Migrating DB (env: ${envFile || '(process)'})`);

  await mongoose.connect(process.env.MONGODB_URI);
  const conn = mongoose.connection;

  console.log('1/5 Rename matches -> alignments collection...');
  try {
    const res = await conn.collection('matches').rename('alignments');
    console.log('   ✅ renamed', res && res.collectionName);
  } catch (err) {
    if (err.code === 48) console.log('   ℹ️  alignments already exists, skipping rename');
    else if (err.message && err.message.includes('source namespace does not exist')) console.log('   ℹ️  no matches collection, skipping');
    else { console.error('   ❌', err.message); process.exit(1); }
  }

  console.log('2/5 Rename Message.matchId -> alignmentId (field + drop old index)...');
  try {
    const msg = conn.collection('messages');
    await msg.dropIndex('matchId_1_createdAt_1').catch(() => {});
    await msg.dropIndex('matchId_1__id_-1').catch(() => {});
    await msg.dropIndex('matchId_1_type_1').catch(() => {});
    await msg.updateMany(
      { matchId: { $exists: true } },
      [{ $set: { alignmentId: '$matchId' } }, { $unset: ['matchId'] }]
    );
    await msg.createIndex({ alignmentId: 1, createdAt: 1 });
    await msg.createIndex({ alignmentId: 1, _id: -1 });
    await msg.createIndex(
      { alignmentId: 1, type: 1 },
      { unique: true, partialFilterExpression: { type: 'opening_letter' } }
    );
    console.log('   ✅ field + indexes migrated');
  } catch (err) {
    console.error('   ❌', err.message); process.exit(1);
  }

  console.log('3/5 Interaction actionType seal_stamp -> telegram, accept_seal -> accept_letter...');
  try {
    const it = conn.collection('interactions');
    await it.updateMany({ actionType: 'seal_stamp' }, { $set: { actionType: 'telegram' } });
    await it.updateMany({ actionType: 'accept_seal' }, { $set: { actionType: 'accept_letter' } });
    console.log('   ✅ migrado');
  } catch (err) {
    console.error('   ❌', err.message); process.exit(1);
  }

  console.log('4/5 Notification type priority_seal -> priority_telegram...');
  try {
    const n = conn.collection('notifications');
    await n.updateMany({ type: 'priority_seal' }, { $set: { type: 'priority_telegram' } });
    console.log('   ✅ migrado');
  } catch (err) {
    console.error('   ❌', err.message); process.exit(1);
  }

  console.log('5/5 User.year mapped to UG/PG buckets...');
  try {
    const u = conn.collection('users');
    const exists = await u.findOne({ year: { $in: ['Freshies', 'Sophies', 'Thirdies', 'Fourthies', 'Fifthies (Dual/PG)', /^\d{4}$/] } });
    if (exists) {
      await u.updateMany(
        { $or: [{ year: { $in: ['Freshies', 'Sophies', 'Thirdies', 'Fourthies'] } }, { year: { $regex: '^\\d{4}$' } }] },
        { $set: { year: 'UG' } }
      );
      await u.updateMany({ year: 'Fifthies (Dual/PG)' }, { $set: { year: 'PG' } });
      console.log('   ✅ bucketed to UG/PG');
    } else {
      console.log('   ℹ️  no legacy year values found, skipping');
    }
  } catch (err) {
    console.error('   ❌', err.message); process.exit(1);
  }

  await mongoose.disconnect();
  console.log('🎉 Migration complete.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### ./server/scripts/migrate-intent-rename.mjs

```
/**
 * 🔀 INTENT RENAME MIGRATION — "Study Buddy" → "Activity Partner"
 *
 * Why a rename needs a data migration at all: `intent` is a RANKING SIGNAL. The
 * deck boosts candidates whose intent overlaps the viewer's. A profile still
 * holding the retired string "Study Buddy" will therefore stop overlapping
 * anyone who picked "Activity Partner" — and because both values are valid
 * strings, nothing errors. It just quietly stops producing matches, which reads
 * as broken matchmaking rather than a leftover label.
 *
 * Safe to re-run: it only writes documents whose intent actually changes, and
 * `--dry-run` (the default) reports without touching anything.
 *
 * Deliberately does NOT dedupe. Someone who somehow held both "Study Buddy" and
 * "Activity Partner" ends up with one entry after mapping, which is correct —
 * they now have a single intent, and the MAX_INTENTS cap is enforced on the
 * next profile write rather than silently expanded here.
 *
 * USAGE
 *   node server/scripts/migrate-intent-rename.mjs            # report only
 *   node server/scripts/migrate-intent-rename.mjs --execute  # apply
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEPRECATED_INTENTS } from '../config/appData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const envPath = path.join(root, 'server/.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim();
  }
}

const EXECUTE = process.argv.includes('--execute');
const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error('❌ MONGODB_URI is not set. Refusing to guess a database.');
  console.error('   Set it in server/.env — never run this against an unintended target.');
  process.exit(1);
}

const mapping = Object.entries(DEPRECATED_INTENTS);
if (mapping.length === 0) {
  console.log('No deprecated intents defined — nothing to migrate.');
  process.exit(0);
}
console.log(`Mapping: ${mapping.map(([a, b]) => `"${a}" -> "${b}"`).join(', ')}`);
console.log(EXECUTE ? 'Mode: EXECUTE' : 'Mode: DRY RUN (pass --execute to apply)\n');

await mongoose.connect(URI);
const db = mongoose.connection.db;

let changed = 0;
let unchanged = 0;

for (const [oldValue, newValue] of mapping) {
  const affected = await db
    .collection('users')
    .find({ intent: oldValue }, { projection: { intent: 1 } })
    .toArray();

  if (affected.length === 0) {
    console.log(`  "${oldValue}": 0 users — nothing to do.`);
    continue;
  }

  for (const doc of affected) {
    const next = [...new Set(doc.intent.map((v) => (v === oldValue ? newValue : v)))];
    if (next.length === doc.intent.length && next.every((v, i) => v === doc.intent[i])) {
      unchanged += 1;
      continue;
    }
    changed += 1;
    console.log(`  ${String(doc._id)}: ${JSON.stringify(doc.intent)} -> ${JSON.stringify(next)}`);
    if (EXECUTE) {
      await db.collection('users').updateOne({ _id: doc._id }, { $set: { intent: next } });
    }
  }
}

console.log(`\n${EXECUTE ? 'Applied' : 'Would apply'} ${changed} change(s); ${unchanged} already correct.`);

/* Leave no profile holding a value the API no longer serves. Not an error
   either way — this is a data-hygiene report, and a failure here means the
   mapping is out of sync with config/appData.js, which IS worth failing on. */
const remaining = [];
for (const [oldValue] of mapping) {
  const n = await db.collection('users').countDocuments({ intent: oldValue });
  if (n > 0) remaining.push(`"${oldValue}" x${n}`);
}
if (remaining.length) {
  console.log(`\n⚠️  Still present: ${remaining.join(', ')}`);
  if (EXECUTE) {
    console.error('Migration did not converge. Check DEPRECATED_INTENTS against stored values.');
    await mongoose.disconnect();
    process.exit(1);
  }
} else {
  console.log('\n✅ No deprecated intent values remain.');
}

await mongoose.disconnect();

```

### ./server/scripts/migrate-remove-isghost.mjs

```
/**
 * 👻 isGhost REMOVAL MIGRATION
 *
 * `isGhost` used to be one sticker for two different facts — "moderated" and
 * "deleted" — and the admin panel only half-synced it with `shadowbannedAt`,
 * so counts and toggles disagreed. Every writer now uses the real markers
 * (`shadowbannedAt`, `isDeleted`); this script finishes the job:
 *
 *   1. Any account still carrying `isGhost: true` that is NOT deleted gets its
 *      `shadowbannedAt` set (if it lacks one), so hiding them keeps working.
 *   2. `isGhost` is $unset everywhere.
 *   3. The old deck filter index is dropped; Mongoose recreates the new one
 *      (keyed on `shadowbannedAt`) on next app boot.
 *
 * Safe to re-run. DRY RUN unless --execute is passed.
 *
 * USAGE
 *   node server/scripts/migrate-remove-isghost.mjs            # report only
 *   node server/scripts/migrate-remove-isghost.mjs --execute  # apply
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const envPath = path.join(root, 'server/.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim();
  }
}

const EXECUTE = process.argv.includes('--execute');
const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error('❌ MONGODB_URI is not set. Refusing to guess a database.');
  console.error('   Set it in server/.env — never run this against an unintended target.');
  process.exit(1);
}

console.log(EXECUTE ? 'Mode: EXECUTE' : 'Mode: DRY RUN (pass --execute to apply)\n');

await mongoose.connect(URI);
const db = mongoose.connection.db;
const users = db.collection('users');

const needsShadowbanDate = await users.countDocuments({ isGhost: true, isDeleted: { $ne: true }, shadowbannedAt: null });
const needsUnset = await users.countDocuments({ isGhost: { $exists: true } });
console.log(`Users whose isGhost=true will gain a shadowbannedAt date: ${needsShadowbanDate}`);
console.log(`Users carrying the isGhost field at all (will be unset):   ${needsUnset}`);

if (EXECUTE) {
  const r1 = await users.updateMany(
    { isGhost: true, isDeleted: { $ne: true }, shadowbannedAt: null },
    { $set: { shadowbannedAt: new Date() } },
  );
  console.log(`Set shadowbannedAt on ${r1.modifiedCount} users.`);

  const r2 = await users.updateMany({}, { $unset: { isGhost: '' } });
  console.log(`Unset isGhost on ${r2.modifiedCount} users.`);

  try {
    await users.dropIndex('discover_deck_filter_index');
    console.log('Dropped old discover_deck_filter_index — Mongoose recreates it on boot.');
  } catch {
    console.log('Old discover_deck_filter_index not present — nothing to drop.');
  }
}

await mongoose.disconnect();

```

### ./server/scripts/migrate-roulette-source.mjs

```
/**
 * 🌱 MIGRATE — Roulette identity fields.
 *
 * ── WHAT IT DOES ─────────────────────────────────────────────────────────────
 * Stage 1 added four fields to `Alignment` (source, profileGrants,
 * conversationAliases, revealRequest) plus three to `Notification` and one to
 * `Interaction`. Mongoose defaults cover new writes, but existing documents
 * predate the fields entirely, and one of them cannot be defaulted safely.
 *
 * Every pre-Roulette connection was a DECK connection, and a deck connection
 * showed both profiles openly. So each one needs:
 *
 *   source        = 'deck'
 *   profileGrants = TWO grants, one per direction, source 'legacy'
 *
 * ── WHY BACKFILL RATHER THAN A SPECIAL CASE ───────────────────────────────────
 * The obvious shortcut is to leave existing rows alone and write the resolver
 * as "if no grants, treat it as a deck connection and allow". That is a branch
 * keyed on a field being absent — and a branch is exactly what fails. The first
 * hidden Roulette row written before its grants are populated would take that
 * path and show a real name.
 *
 * Backfilling removes the branch entirely. After this runs, the resolver has
 * ONE rule: is there a grant? Absence means no, for everybody, forever.
 *
 * ── SAFE BY DEFAULT ───────────────────────────────────────────────────────────
 *   node scripts/migrate-roulette-source.mjs            # dry run, writes nothing
 *   node scripts/migrate-roulette-source.mjs --execute  # actually writes
 *
 * Rollback is `unset` of the same four fields; no data is destroyed and the
 * three Notification/Interaction fields are left untouched.
 *
 * Design source: ambitions/roulette.md §4.6
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import '../models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXECUTE = process.argv.includes('--execute');

const loadEnv = () => {
  const envPaths = [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
        const idx = line.indexOf('=');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
      return p;
    }
  }
  return null;
};

const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found.');
    process.exit(1);
  }

  const dbName = mongoose.connection.name;
  console.log(`${EXECUTE ? '🔧' : '🔍'} Roulette identity migration${EXECUTE ? '' : ' (DRY RUN)'}`);
  console.log(`   env     : ${envFile || '(process)'}`);
  console.log(`   database: ${dbName}`);

  if (EXECUTE && dbName === 'matchalize_test') {
    console.log('   ℹ️  Target is the test database — fine, but noting it.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const alignments = mongoose.connection.collection('alignments');
  const total = await alignments.countDocuments({});

  /* ── Scope ──────────────────────────────────────────────────────────────────
   * Only rows that predate the fields. A document already carrying a non-empty
   * profileGrants was either created after Stage 1 or already migrated, and
   * rewriting it would DISCARD real grants — including a granted profile a
   * user agreed to share. Skipping them is what makes re-running safe. */
  const needsWork = await alignments.countDocuments({
    $or: [
      { source: { $exists: false } },
      { source: null },
      { profileGrants: { $exists: false } },
      { profileGrants: { $size: 0 } },
    ],
  });

  const skipped = total - needsWork;
  const alreadyAliased = await alignments.countDocuments({
    conversationAliases: { $exists: true, $size: { $gt: 0 } },
  });

  console.log(`\n1/4 Alignments`);
  console.log(`   total            : ${total}`);
  console.log(`   need backfill    : ${needsWork}`);
  console.log(`   already migrated : ${skipped}`);
  console.log(`   carry an alias   : ${alreadyAliased}  (left untouched)`);

  if (needsWork === 0) {
    console.log('\n   ✅ Nothing to do.');
  } else if (!EXECUTE) {
    console.log('\n2/4 Writing pairs\n   ℹ️  DRY RUN — no writes performed. Re-run with --execute.');
  } else {
    /* ── Do it one document at a time ────────────────────────────────────────
     * Not `updateMany`. Each connection needs grants built from ITS OWN two
     * user ids, in both directions, and a bulk update cannot express that
     * without an aggregation pipeline — which would also bypass
     * Alignment.js's pre('validate') integrity hook, the very thing that
     * guarantees a grant only ever names a member of its own connection.
     *
     * Per-document writes run through validation. If a malformed row exists
     * (three users, a pairKey that disagrees with its users), it fails loudly
     * here and is reported, rather than being silently "fixed" into a document
     * that hands access to a non-member. */
    console.log('\n2/4 Writing profile grants per connection...');

    const cursor = alignments.find(
      {
        $or: [
          { source: { $exists: false } },
          { source: null },
          { profileGrants: { $exists: false } },
          { profileGrants: { $size: 0 } },
        ],
      },
      // ⚠️ isActive and unlockedByInteractionId MUST be projected. An alignment
      // that was unmatched has isActive:false, and rebuilding it with a
      // hardcoded `true` would SILENTLY REACTIVATE every severed connection —
      // resurfacing old matches in the Chats list. Both fields are carried
      // across verbatim, never reconstructed.
      {
        projection: {
          users: 1,
          pairKey: 1,
          isActive: 1,
          unlockedByInteractionId: 1,
          profileGrants: 1,
          conversationAliases: 1,
        },
      },
    );

    const grantedAt = new Date();
    let written = 0;
    let failed = 0;
    let missingInteraction = 0;
    const failures = [];

    for await (const doc of cursor) {
      const users = Array.isArray(doc.users) ? doc.users.map(String) : [];

      if (users.length !== 2) {
        failed += 1;
        failures.push({ _id: String(doc._id), reason: `${users.length} users, expected 2` });
        continue;
      }

      // The schema marks it required, so a row without it cannot be rebuilt.
      // Skip rather than invent a value — a fabricated interactionRef would
      // point the "unlocked by" provenance at an object that does not exist.
      if (!doc.unlockedByInteractionId) {
        missingInteraction += 1;
        failures.push({ _id: String(doc._id), reason: 'missing unlockedByInteractionId — skipped' });
        continue;
      }

      try {
        // Constructed through the model so pre('validate') runs.
        const Alignment = mongoose.model('Alignment');
        const alignment = new Alignment({
          _id: doc._id,
          pairKey: doc.pairKey,
          users: doc.users,
          isActive: doc.isActive,
          unlockedByInteractionId: doc.unlockedByInteractionId,
          source: 'deck',
          profileGrants: [
            { viewerId: users[0], subjectId: users[1], source: 'legacy', grantedAt },
            { viewerId: users[1], subjectId: users[0], source: 'legacy', grantedAt },
          ],
          conversationAliases: doc.conversationAliases ?? [],
          revealRequest: { state: 'none' },
        });

        await alignment.save();
        written += 1;
      } catch (err) {
        failed += 1;
        failures.push({ _id: String(doc._id), reason: err.message });
      }
    }

    console.log(`   written : ${written}`);
    console.log(`   failed  : ${failed}`);
    if (missingInteraction) {
      console.log(`   ⚠️  skipped for missing unlockedByInteractionId: ${missingInteraction}`);
    }
    if (failures.length) {
      console.log('\n   Malformed rows — NOT migrated, left as they were:');
      for (const f of failures.slice(0, 20)) console.log(`     ${f._id}  ${f.reason}`);
      if (failures.length > 20) console.log(`     …and ${failures.length - 20} more`);
    }
  }

  /* ── Notifications and Interactions ────────────────────────────────────────
   * These NEED no backfill. `source` defaults to 'deck' on both models, which
   * is correct for every existing row — a request or action that predates
   * Roulette came from the Deck. Counting them is confirmation, not a write. */
  console.log('\n3/4 Notification / Interaction defaults');
  const notifications = mongoose.connection.collection('notifications');
  const interactions = mongoose.connection.collection('interactions');
  console.log(`   notifications   : ${await notifications.countDocuments({})} (source defaults to 'deck')`);
  console.log(`   interactions    : ${await interactions.countDocuments({})} (source defaults to 'deck')`);

  console.log('\n4/4 Indexes');
  try {
    await alignments.createIndex(
      { 'profileGrants.viewerId': 1, 'profileGrants.subjectId': 1 },
      { name: 'profile_grants_lookup' },
    );
    console.log('   ✅ profile_grants_lookup');
  } catch (err) {
    console.error('   ❌', err.message);
  }
  try {
    await notifications.createIndex(
      { callSessionId: 1 },
      { sparse: true, name: 'roulette_call_expiry_sweep' },
    );
    console.log('   ✅ roulette_call_expiry_sweep');
  } catch (err) {
    console.error('   ❌', err.message);
  }

  if (EXECUTE) {
    console.log('\n✅ Done. To reverse: unset source, profileGrants, conversationAliases');
    console.log('   and revealRequest on the alignments collection.');
  } else {
    console.log('\nℹ️  DRY RUN complete. Nothing was written.');
    console.log('   Re-run with --execute to apply.');
  }

  await mongoose.connection.close();
};

run().catch((err) => {
  console.error('💥 Migration failed:', err.message);
  process.exit(1);
});

```

### ./server/scripts/reset-colleges.mjs

```
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import College from '../models/College.js';
import CollegeRequest from '../models/CollegeRequest.js';
import User from '../models/User.js';
import Alignment from '../models/Alignment.js';
import Interaction from '../models/Interaction.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import Block from '../models/Block.js';
import OTP from '../models/OTP.js';
import Analytics from '../models/Analytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadEnv = () => {
  for (const p of [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      if (!process.env[key]) process.env[key] = line.slice(idx + 1).trim();
    }
    return p;
  }
  return null;
};

const EXECUTE = process.argv.includes('--execute');

/**
 * ⚠️ DESTRUCTIVE. Wipes every user and everything hanging off them, then seeds
 * one college so the picker has something to show.
 *
 * Users only, in the app's real database. No --execute means report-only.
 *
 *   node server/scripts/reset-colleges.mjs            # dry run
 *   node server/scripts/reset-colleges.mjs --execute  # do it
 */
const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found');
    process.exit(1);
  }
  console.log(`📄 env: ${envFile}`);
  console.log(`🔍 mode: ${EXECUTE ? '⚠️  EXECUTE — THIS DELETES DATA' : 'report only'}`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  const models = [
    ['User', User],
    ['Alignment', Alignment],
    ['Interaction', Interaction],
    ['Notification', Notification],
    ['Message', Message],
    ['Report', Report],
    ['Block', Block],
    ['OTP', OTP],
    ['Analytics', Analytics],
    ['CollegeRequest', CollegeRequest],
  ];

  console.log('rows that will be deleted:');
  const counts = {};
  for (const [name, M] of models) {
    // eslint-disable-next-line no-await-in-loop
    const n = await M.countDocuments({});
    counts[name] = n;
    console.log(`   ${name.padEnd(16)} ${n}`);
  }

  const seed = {
    code: 'iitb',
    name: 'Indian Institute of Technology Bombay',
    domains: ['iitb.ac.in'],
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    active: true,
  };

  console.log('\ncollege to be seeded:');
  console.log(`   ${seed.name}  (${seed.code})  @${seed.domains[0]}`);

  if (!EXECUTE) {
    console.log('\n📋 Report only. Re-run with --execute to apply.');
    await mongoose.disconnect();
    return;
  }

  for (const [, M] of models) {
    // eslint-disable-next-line no-await-in-loop
    await M.deleteMany({});
  }
  console.log('\n✅ Wiped all user + related collections.');

  // upsert so re-running this script doesn't fail on the unique code index.
  await College.findOneAndUpdate({ code: seed.code }, { $set: seed }, { upsert: true, new: true });
  console.log(`✅ Seeded college: ${seed.name} (${seed.code})`);

  const total = await User.countDocuments({});
  const collegeCount = await College.countDocuments({});
  console.log(`\nusers: ${total}   colleges: ${collegeCount}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Reset failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});
```

### ./server/scripts/reverify-sweep.mjs

```
/**
 * ♻️ ANNUAL RE-VERIFICATION SWEEP
 *
 * Flips accounts to `reverify_due` once their annual check is past due AND the
 * grace window has expired. Runs once a day; safe to re-run.
 *
 * ⚠️ WHY THIS DOESN'T DELETE ANYTHING
 *
 * A missing email is not proof that someone is an impostor — college mail
 * servers fail, mailboxes get forwarded, alumni addresses outlive enrolment.
 * This job only changes a flag that makes the client ASK for a code. Removal is
 * always a human decision.
 *
 * Run manually:  node server/scripts/reverify-sweep.mjs
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadEnv = () => {
  for (const p of [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      if (!process.env[key]) process.env[key] = line.slice(idx + 1).trim();
    }
    return p;
  }
  return null;
};

const GRACE_DAYS = 14;
const DRY_RUN = !process.argv.includes('--execute');

const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in server/.env');
    process.exit(1);
  }
  console.log(`📄 env: ${envFile}`);
  console.log(`🔍 mode: ${DRY_RUN ? 'report only' : '⚠️  EXECUTE'}`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  const now = Date.now();
  const graceCutoff = new Date(now - GRACE_DAYS * 24 * 60 * 60 * 1000);

  const due = await User.find({
    reverifyDue: { $ne: null, $lt: graceCutoff },
    status: { $ne: 'reverify_due' },
    isDeleted: { $ne: true },
    suspended: { $ne: true },
  })
    .select('name email status reverifyDue college')
    .lean();

  console.log(`accounts past due + past ${GRACE_DAYS}-day grace   ${due.length}`);
  console.log(`(no accounts are deleted by this job — it sets status = reverify_due)\n`);

  if (!due.length) {
    console.log('✅ Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  due.slice(0, 15).forEach((u) => {
    const overdueBy = Math.round((now - new Date(u.reverifyDue).getTime()) / (24 * 60 * 60 * 1000));
    console.log(`   ${(u.name || u.email).padEnd(28)} due ${String(u.reverifyDue).slice(0, 10)}  (${overdueBy}d past)`);
  });
  if (due.length > 15) console.log(`   ... and ${due.length - 15} more`);

  if (DRY_RUN) {
    console.log('\n📋 Report only. Re-run with --execute to flag them.');
    await mongoose.disconnect();
    return;
  }

  const result = await User.updateMany(
    { _id: { $in: due.map((u) => u._id) } },
    { $set: { status: 'reverify_due' } },
  );
  console.log(`\n✅ Flagged ${result.modifiedCount} account(s) as reverify_due.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Sweep failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});
```

### ./server/scripts/seed-iitb.mjs

```
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import College from '../models/College.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadEnv = () => {
  for (const p of [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      if (!process.env[key]) process.env[key] = line.slice(idx + 1).trim();
    }
    return p;
  }
  return null;
};

/**
 * 🏫 SEED IIT BOMBAY — non-destructive.
 *
 * The safe sibling of reset-colleges.mjs, which DELETES every user and college
 * before seeding. That is the wrong tool for a pilot launch: the moment you
 * want to add the first campus is the same moment you have real signups you
 * cannot afford to lose.
 *
 * This script only touches the `colleges` collection. It never reads or writes
 * a single user row, so it is safe to run against a database that already has
 * students in it — which is exactly the situation it is for.
 *
 *   node server/scripts/seed-iitb.mjs            # dry run, reports only
 *   node server/scripts/seed-iitb.mjs --execute  # upsert the college
 */

const SEED = {
  code: 'iitb',
  name: 'Indian Institute of Technology Bombay',
  // Exact-or-subdomain matching means every department address
  // (cse.iitb.ac.in, mech.iitb.ac.in, …) verifies against this one entry.
  domains: ['iitb.ac.in'],
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
  active: true,
  // IIT Bombay main campus, Powai. This is campus data — a building's public
  // location — not a student's coordinates, so it carries none of the privacy
  // weight of User.currentLatLng. Optional: without it, students at this campus
  // rank as "unknown location" and sort last rather than being guessed at.
  latLng: [19.124, 72.914],
};

const EXECUTE = process.argv.includes('--execute');

const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found. Set it in server/.env.');
    process.exit(1);
  }
  console.log(`📄 env: ${envFile}`);
  console.log(`🔍 mode: ${EXECUTE ? '⚠️  EXECUTE' : 'report only'}`);
  console.log(`🗄  db:  ${process.env.MONGODB_URI.split('@').pop()}\n`);

  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await College.find({}).sort({ code: 1 }).lean();
  console.log(`colleges currently in the database: ${existing.length}`);
  for (const c of existing) {
    const match = c.code === SEED.code ? '  ← this script' : '';
    console.log(`   ${c.code.padEnd(10)} active=${String(c.active).padEnd(5)} ${c.name}${match}`);
  }

  const already = await College.findOne({ code: SEED.code }).lean();
  if (already) {
    // Report drift rather than silently overwriting. A difference here means
    // an operator edited the college from /admin — the admin value may be the
    // corrected one, so this prints and stops rather than winning.
    const drift = ['name', 'active'].filter((k) => String(already[k]) !== String(SEED[k]));
    const domainDrift = JSON.stringify([...(already.domains || [])].sort())
      !== JSON.stringify([...SEED.domains].sort());

    if (drift.length || domainDrift) {
      console.log('\n⚠️  IIT Bombay already exists and differs from this script:');
      if (drift.length) console.log(`     fields: ${drift.join(', ')}`);
      if (domainDrift) {
        console.log(`     domains: db has [${(already.domains || []).join(', ')}], script has [${SEED.domains.join(', ')}]`);
      }
      console.log('     Not overwriting. The value in the database is the live one.');
      console.log('     To change it, edit the college from /admin.');
      await mongoose.disconnect();
      return;
    }
    console.log('\n✅ IIT Bombay already matches. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  if (!EXECUTE) {
    console.log('\n📋 Would seed:');
    console.log(`   ${SEED.name}  (${SEED.code})  @${SEED.domains[0]}`);
    console.log('   Re-run with --execute to apply.');
    await mongoose.disconnect();
    return;
  }

  // Upsert so re-running does not collide with the unique code index.
  await College.findOneAndUpdate({ code: SEED.code }, { $set: SEED }, { upsert: true, new: true });

  const after = await College.countDocuments({});
  console.log(`\n✅ Seeded ${SEED.name} (${SEED.code})`);
  console.log(`   colleges now: ${after}`);

  const gate = process.env.ALLOWED_COLLEGES;
  if (gate) {
    const allowed = gate.split(',').map((c) => c.trim().toLowerCase());
    console.log(`\n🚪 ALLOWED_COLLEGES = "${gate}"`);
    console.log(allowed.includes(SEED.code)
      ? '   ✓ IIT Bombay can sign up.'
      : `   ✗ IIT Bombay is NOT in the gate — nobody will be able to sign up.\n     Set ALLOWED_COLLEGES=${SEED.code}`);
  } else {
    console.log('\n🚪 ALLOWED_COLLEGES is not set — every active college can sign up.');
    console.log(`   Set ALLOWED_COLLEGES=${SEED.code} to run this as an IIT-Bombay-only pilot.`);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Seed failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});
```

### ./server/scripts/verify-deck-metrics.mjs

```
/**
 * 🃏 REGRESSION TEST — deck metrics and the distance preference.
 *
 * Run: node server/scripts/verify-deck-metrics.mjs      (server must be on :5005)
 *
 * ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────
 * Two bugs in this area were both invisible to "did it break?" tests:
 *
 *   1. `deckPosition` came from the CLIENT's own `?served=` total. When the
 *      app-open location check discarded a deck because the viewer had
 *      travelled, the deck was rebuilt correctly but the client's counter was
 *      never reset — so a fresh deck's first page logged as cards 41–50. The
 *      cards were right; only the recorded depth was wrong, which corrupts the
 *      one number the impression log exists for.
 *
 *   2. Settings derived "is location on" from `locationSource`, which is
 *      truthy for a STALE reading. A location ignored by ranking for 94 days
 *      displayed as "On", with a "Turn off" button for something already off.
 *
 * Both passed every existing suite. The rule they share: assert the value is
 * CORRECT, never merely that nothing threw.
 *
 * ── THE TESTING TRAPS THIS FILE ALSO STEERS AROUND ──────────────────────────
 * Three of these assertions failed first for reasons that had nothing to do with
 * the code under test, and all three would have looked like real failures:
 *
 *   • ObjectIds do not `===` strings. Card ids arrive from JSON as strings, so
 *     `ids.includes(card._id)` is ALWAYS false, and "the archived card was
 *     excluded" fails while the card is in fact on the page.
 *   • `pass` is deliberately NOT an exclusion. Only archive/letter/telegram
 *     remove someone from the deck; asserting otherwise tests the wrong thing.
 *   • Deleting a session does not delete its impressions. Wiping one and then
 *     asserting on all rows mixes two sessions and looks like a position bug.
 *
 * The server writes impressions fire-and-forget, so every read waits for the
 * write to land before asserting.
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(HERE, '..');
const REPO_DIR = path.resolve(SERVER_DIR, '..');
const API = process.env.API_ORIGIN || 'http://127.0.0.1:5005';
const VIEWER_EMAIL = process.env.VIEWER_EMAIL || 'nigga@iitb.ac.in';
const MARK = 'zz_verify_';

const env = Object.fromEntries(
  fs.readFileSync(path.join(SERVER_DIR, '.env'), 'utf8')
    .split('\n').filter(Boolean)
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1)]; }),
);

let pass = 0; let fail = 0;
const ok = (label, cond) => {
  if (cond) { pass += 1; console.log(`  PASS ${label}`); }
  else { fail += 1; console.log(`  FAIL ${label}`); }
};
const section = (t) => console.log(`\n── ${t} ──`);
/* Impressions are written without awaiting, so a read can race the write. */
const settle = () => new Promise((r) => setTimeout(r, 700));

await mongoose.connect(env.MONGODB_URI);
const db = mongoose.connection.db;

const viewer = await db.collection('users').findOne({ email: VIEWER_EMAIL });
if (!viewer) {
  console.error(`No viewer with email ${VIEWER_EMAIL}. Set VIEWER_EMAIL and retry.`);
  await mongoose.disconnect();
  process.exit(1);
}
const token = jwt.sign({ id: viewer._id }, env.JWT_SECRET, { expiresIn: '1h' });
const auth = { Cookie: `matchalize_jwt=${token}` };

const deck = async (served = 0) =>
  (await fetch(`${API}/api/discover?limit=10&served=${served}`, { headers: auth })).json();
const wipeDeck = async () => {
  await db.collection('discoversessions').deleteMany({ viewerId: viewer._id });
  await db.collection('deckimpressions').deleteMany({ viewerId: viewer._id });
};
const positions = async () =>
  (await db.collection('deckimpressions').find({ viewerId: viewer._id })
    .sort({ deckPosition: 1 }).toArray()).map((r) => r.deckPosition);
const resetViewerLocation = async () => {
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $unset: { currentLatLng: 1 }, $set: { locationSource: null, locationUpdatedAt: null } },
  );
};

const CANDIDATE = {
  gender: 'Male',
  interestedIn: ['Everyone'],
  college: 'Indian Institute of Technology Bombay',
  collegeCode: 'iitb',
  isVerified: true,
  isOnboarded: true,
  photos: ['a', 'b', 'c', 'd'],
  prompts: ['p', 'p', 'p'],
  bio: 'a long enough bio here',
  profileScore: 90,
  intent: ['Dating'],
};

await db.collection('users').deleteMany({ email: { $regex: `^${MARK}` } });
await db.collection('users').insertMany(
  Array.from({ length: 120 }, (_, i) => ({
    ...CANDIDATE,
    email: `${MARK}${i}@x.com`,
    name: `V${String(i).padStart(3, '0')}`,
    lastActive: new Date(Date.now() - i * 60_000),
  })),
);

try {
  /* ═══ 1. IMPRESSION POSITIONS ═══════════════════════════════════════════ */
  section('impression positions are server-owned');

  await wipeDeck();
  let d = await deck(0); await settle();
  let p = await positions();
  ok('page 1 logs positions 0–9', p.length === 10 && p[0] === 0 && p[9] === 9);
  ok('response `served` is 10', d.served === 10);

  d = await deck(d.served); await settle();
  p = await positions();
  ok('page 2 logs positions 10–19', p[10] === 10 && p[19] === 19);

  /* The actual bug: the client lies about its count. */
  d = await deck(9999); await settle();
  p = await positions();
  ok('a lying ?served=9999 cannot corrupt positions', p[20] === 20);
  ok('response `served` stays server-truth (30)', d.served === 30);
  ok('session.cardsServed is 30',
    (await db.collection('discoversessions').findOne({ viewerId: viewer._id })).cardsServed === 30);

  /* The real-world path: travelled, session discarded, client's stale total reused. */
  await wipeDeck();
  await deck(0); await deck(0); await deck(0); await settle();
  await db.collection('discoversessions').deleteMany({ viewerId: viewer._id });
  await db.collection('deckimpressions').deleteMany({ viewerId: viewer._id });
  const rebuilt = await deck(9999); await settle();
  p = await positions();
  ok('after a rebuild the log restarts at 0', p.length === 10 && p[0] === 0 && p[9] === 9);
  ok('and `served` restarts at 10', rebuilt.served === 10);
  ok('cards really are the new deck, from the top', rebuilt.users.length === 10);

  /* ═══ 2. EXCLUSIONS MUST NOT INFLATE THE COUNT ═══════════════════════════ */
  section('cards served counts cards, not scanned ids');

  await db.collection('interactions').deleteMany({});
  await wipeDeck();
  const target = await db.collection('users').findOne({ email: { $regex: `^${MARK}` } });
  await db.collection('interactions').insertOne({
    /* Both ids as real ObjectIds — a string targetId matches nothing. */
    actorId: viewer._id,
    targetId: target._id,
    actionType: 'archive',
    origin: 'archive',
    createdAt: new Date(),
  });
  await wipeDeck();
  d = await deck(0); await settle();
  const session = await db.collection('discoversessions').findOne({ viewerId: viewer._id });
  const logged = await db.collection('deckimpressions').countDocuments({ viewerId: viewer._id });
  ok('served equals the cards actually returned', session.cardsServed === d.users.length);
  ok('and equals the number of impressions written', d.users.length === logged);
  ok('the archived card is excluded',
    !d.users.some((u) => String(u._id) === String(target._id)));

  /* ═══ 3. THE DECK STILL BEHAVES ══════════════════════════════════════════ */
  section('deck integrity unchanged');

  await db.collection('interactions').deleteMany({});
  await wipeDeck();
  let served = 0; const seen = []; let page = await deck(0); let guard = 0;
  while (page.users.length && guard < 60) {
    seen.push(...page.users.map((u) => String(u._id)));
    served = page.served;
    if (page.deckExhausted) break;
    page = await deck(served); guard += 1;
  }
  /* ⚠️ MUST count what the SERVER counts, not "everyone on the platform".

     This assertion compared the drained deck against every onboarded user, which
     silently included people the mutual-interest filter is designed to hide —
     the viewer's own gender, and anyone not interested in the viewer's gender.
     It read as "the deck dropped 369 people" when the deck had in fact served
     every person it was ever allowed to serve. Mirrors the three filters the
     route applies: gender the viewer wants, mutual preference, exclusions. */
  const myGenders = (viewer.interestedIn || []).filter((g) => g !== 'Everyone');
  const eligible = await db.collection('users').countDocuments({
    _id: { $ne: viewer._id },
    isOnboarded: true, isVerified: true,
    shadowbannedAt: null, isDeleted: { $ne: true }, suspended: { $ne: true },
    ...(myGenders.length ? { gender: { $in: myGenders } } : {}),
    ...(viewer.gender ? {
      $or: [
        { interestedIn: { $in: [viewer.gender, 'Everyone'] } },
        { interestedIn: { $size: 0 } },
        { interestedIn: { $exists: false } },
      ],
    } : {}),
  });
  ok('deck is zero-repeat across the drain', new Set(seen).size === seen.length);
  ok(`every ELIGIBLE person seen exactly once (${seen.length}/${eligible})`,
    seen.length === eligible && new Set(seen).size === eligible);

  /* ═══ 4. DISTANCE PREFERENCE REPORTING ═══════════════════════════════════ */
  section('distance preference reports honestly');

  const GET = async () =>
    (await fetch(`${API}/api/users/location`, { headers: auth })).json();
  const PUT = (body) => fetch(`${API}/api/users/location`, {
    method: 'PUT',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  await resetViewerLocation();
  let r = await GET();
  ok('nothing stored reports the campus choice (null)', r.locationSource === null);
  ok('and is not "active"', r.active === false);

  await PUT({ latLng: [19.08, 72.88], source: 'gps' });
  r = await GET();
  ok('a fresh reading round-trips as gps', r.locationSource === 'gps');
  ok('fresh means active, 0 days old', r.active === true && r.storedDaysAgo === 0);

  /* The Bug 1 case, in full. */
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $set: { locationUpdatedAt: new Date(Date.now() - 94 * 86_400_000) } },
  );
  r = await GET();
  ok('a 94-day-old reading still reports source=gps', r.locationSource === 'gps');
  ok('but active is FALSE — Settings reads this, not source', r.active === false);
  ok('storedDaysAgo surfaces the age so the UI can say so', r.storedDaysAgo === 94);

  await PUT({ latLng: null });
  r = await GET();
  ok('choosing campus clears the source', r.locationSource === null);
  ok('and genuinely deletes the stored coordinates',
    await db.collection('users').countDocuments({ _id: viewer._id, currentLatLng: { $exists: true } }) === 0);

  await PUT({ source: 'campus' });
  r = await GET();
  ok('an explicit campus marker round-trips', r.locationSource === 'campus');
  ok('campus stores no coordinates',
    await db.collection('users').countDocuments({ _id: viewer._id, currentLatLng: { $exists: true } }) === 0);
  ok('campus is not "active"', r.active === false);

  /* Campus-as-base must still rank, which is the reason the option exists. */
  await resetViewerLocation();
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $set: { locationSource: 'campus', locationUpdatedAt: new Date() } },
  );
  await wipeDeck();
  d = await deck(0);
  /* ⚠️ A missing label is NOT a missing band.

     `_bandIndex` is 0–3 for every card whenever the viewer has a point, but
     band 3 deliberately renders NOTHING: labelling every distant stranger
     "Elsewhere in India" is noise, and the college badge already says it. So
     asserting `every(u => u.distanceBand !== undefined)` was asserting that
     every card is within 300km — which fails for any viewer whose campus has no
     neighbour college nearby. With 21 campuses spread across India, that is
     almost everyone: the seeded data puts 249 of 260 eligible people in band 3.

     The correct check is that the BAND is computed and ordered, which is
     observable as: some cards carry a label, and every labelled card is nearer
     than every unlabelled one. A deck with zero labels AND a viewer whose campus
     has close neighbours would be the real failure. */
  /* The right check is simply: are there labelled cards? A viewer whose campus has
     close neighbours MUST produce labels, so "zero labels across a full page" is
     the real failure signal. Band order within the page is deliberately NOT
     asserted — the own-college share and the cold-start reserve both STEP
     reserved cards through the window rather than front-loading them, so a 0km
     card legitimately appears at position 1 with a 500km card at position 0. */
  const labelled = d.users.filter((u) => u.distanceBand !== undefined);
  ok('distance bands still work with no GPS at all',
    d.users.length > 0 && labelled.length > 0);
  ok('a label means a named band, never raw kilometres',
    labelled.every((u) => typeof u.distanceBand === 'string' && !/\d/.test(u.distanceBand)));
  ok('and no coordinates leak into the deck',
    d.users.every((u) => !('currentLatLng' in u) && !('latLng' in u)));
} finally {
  await db.collection('users').deleteMany({ email: { $regex: `^${MARK}` } });
  await db.collection('interactions').deleteMany({});
  await wipeDeck();
  await resetViewerLocation();
  await db.collection('users').updateOne({ _id: viewer._id }, { $set: { intent: ['Dating'] } });
  await mongoose.disconnect();
}

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

```

