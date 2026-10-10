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
