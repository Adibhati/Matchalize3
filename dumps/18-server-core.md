# Chunk 18 — Server Core

> Matchalize · `server-core` · files 18 of 28 chunks · 20 file(s) · 96 KB · ~28,101 tokens
> Generated 2026-10-18 20:29.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./server/config/appData.js`
> - `./server/config/cloudinary.js`
> - `./server/config/db.js`
> - `./server/config/roulette.js`
> - `./server/index.js`
> - `./server/middleware/admin.js`
> - `./server/middleware/auth.js`
> - `./server/middleware/blockFilter.js`
> - `./server/middleware/rateLimiters.js`
> - `./server/middleware/sanitizeMongoInput.js`
> - `./server/middleware/validate.js`
> - `./server/models/Alignment.js`
> - `./server/models/Analytics.js`
> - `./server/models/Block.js`
> - `./server/models/College.js`
> - `./server/models/CollegeRequest.js`
> - `./server/models/DailyAlignQuota.js`
> - `./server/models/DeckImpression.js`
> - `./server/models/DiscoverSession.js`
> - `./server/models/Interaction.js`

---
### ./server/config/appData.js

```
export const PROMPT_BANK = [
  "My favorite spot to hide on campus...",
  "Meet me at the canteen if...",
  "My ideal night study session includes...",
  "The hostel rule I break most often...",
  "A hot take I have about our college...",
  "Choose me if you want to survive...",
  "Late night chai or early morning library?",
  "My branch in 3 words...",
  "If I could change one campus rule...",
  "My hidden talent...",
  "My vibe is best described as...",
  "I am looking for a partner to run...",
  "Two truths and a lie about me...",
  "The best way to my heart is...",
  "My go-to comfort food after exams...",
  "A cringe thing I still unironically enjoy...",
  "My most irrational pet peeve...",
  "The song that defines my semester...",
  "My toxic trait is...",
  "I'll fall for you if you...",
  "My 3AM thoughts usually go like...",
  "The quickest way to annoy me...",
  "My favorite procrastination method...",
  "What I'm actually looking for on here...",
  "The most impulsive thing I've done...",
  "My idea of a perfect weekend...",
  "I get overly excited about...",
  "The smallest thing that makes my day...",
  "My favourite memory from college so far...",
  "One thing I absolutely cannot live without...",
  "I'm weirdly good at...",
  "I'd swipe right if you want to teach me...",
  "My biggest flex that no one knows about...",
  "The best compliment I've ever received...",
  "A dealbreaker I didn't know I had...",
  "I'm convinced that I should be famous for...",
  "The most chaotic thing that happened in my wing...",
  "My lecture hall survival kit includes...",
  "I'm basically a professional at...",
  "DM me if you can beat my score in...",
  "My type is best described by...",
  "I finally understand why people say..."
];

export const BRANCHES = [
  "Computer Science & Engineering",
  "Mathematics & Computing",
  "Electrical Engineering",
  "Engineering Physics",
  "Mechanical Engineering",
  "Chemical Engineering",
  "Civil Engineering",
  "Aerospace Engineering",
  "Biotechnology",
  "Metallurgical & Materials Engineering",
  "Textile Technology",
  "Other"
];

export const YEARS = [
  "UG",
  "PG"
];

export const GENDERS = [
  "Male",
  "Female",
  "Non-binary",
  "Other"
];

/* Connection intents.
 *
 * "Activity Partner" replaced "Study Buddy" (a rename decided with the user, not
 * a typo fix): "Study Buddy" implies coursework, while the 22 existing interests
 * cover sport, music, gaming, volunteering and the rest, so people are looking
 * for someone to DO something with, not just to study beside.
 *
 * ⚠️ RENAME IS NOT DATA-FREE. Profiles written before the rename still hold
 * "Study Buddy" verbatim, and `intent` is a RANKING SIGNAL — so a stale value
 * silently stops matching anyone who picked "Activity Partner", which looks
 * like broken matchmaking rather than a leftover string. `scripts/migrate-intent-rename.mjs`
 * rewrites stored values; run it once after deploying this. */
export const INTENTS = [
  "Dating",
  "Friends",
  "Activity Partner",
];

/* Retired values kept ONLY so validation can normalise a stale stored value
 * instead of rejecting the profile. Never render these. */
export const DEPRECATED_INTENTS = {
  "Study Buddy": "Activity Partner",
};

export const INTEREST_TAGS = [
  "Chai Walks",
  "Coding",
  "Night Canteen",
  "Anime",
  "Gaming",
  "Photography",
  "Fitness",
  "Music Production",
  "Movies & Chill",
  "Reading",
  "Hackathons",
  "Poetry & Writing",
  "Travel & Trekking",
  "Cricket/Football",
  "Shitposting & Memes",
  "Filter Coffee",
  "Cooking",
  "Startups & Tech",
  "Web3 & Crypto",
  "AI & Robotics",
  "UI/UX Design",
  "Guitar/Instruments"
];

export const PRONOUNS_OPTIONS = [
  "he/him",
  "she/her",
  "they/them",
  "he/they",
  "she/they",
  "xe/xem",
  "ze/zir"
];

export const INTEREST_ICONS = {
  'reading': 'book',
  'books': 'book',
  'music': 'music_note',
  'cooking': 'cooking',
  'baking': 'bakery_dining',
  'travel': 'flight',
  'travelling': 'flight',
  'traveling': 'flight',
  'gaming': 'sports_esports',
  'games': 'sports_esports',
  'art': 'palette',
  'painting': 'brush',
  'drawing': 'brush',
  'sports': 'sports_soccer',
  'football': 'sports_football',
  'soccer': 'sports_soccer',
  'basketball': 'sports_basketball',
  'tennis': 'sports_tennis',
  'cricket': 'sports_cricket',
  'badminton': 'sports_tennis',
  'volleyball': 'sports_volleyball',
  'swimming': 'pool',
  'running': 'directions_run',
  'hiking': 'hiking',
  'trekking': 'hiking',
  'yoga': 'self_improvement',
  'meditation': 'self_improvement',
  'fitness': 'fitness_center',
  'gym': 'fitness_center',
  'workout': 'fitness_center',
  'movies': 'movie',
  'films': 'movie',
  'cinema': 'movie',
  'writing': 'edit',
  'coding': 'code',
  'programming': 'code',
  'technology': 'computer',
  'tech': 'computer',
  'shopping': 'shopping_bag',
  'coffee': 'coffee',
  'food': 'restaurant',
  'dining': 'restaurant',
  'dogs': 'pets',
  'cats': 'pets',
  'pets': 'pets',
  'animals': 'pets',
  'nature': 'park',
  'gardening': 'yard',
  'plants': 'yard',
  'singing': 'mic',
  'karaoke': 'mic',
  'piano': 'piano',
  'guitar': 'music_note',
  'instruments': 'music_note',
  'anime': 'tv',
  'fashion': 'checkroom',
  'camping': 'tent',
  'cycling': 'pedal_bike',
  'biking': 'pedal_bike',
  'chess': 'chess',
  'dancing': 'movement',
  'photography': 'camera_alt',
  'photos': 'camera_alt',
  'sleeping': 'bedtime',
  'napping': 'bedtime',
  'eating': 'ramen_dining',
  'drinking': 'local_bar',
  'partying': 'celebration',
  'clubbing': 'nightlife',
  'skating': 'roller_skating',
  'surfing': 'surfing',
  'skiing': 'downhill_skiing',
  'baseball': 'sports_baseball',
  'golf': 'golf_course',
  'boxing': 'sports_mma',
  'martial arts': 'sports_mma',
  'dance': 'movement',
  'theatre': 'theater_comedy',
  'theater': 'theater_comedy',
  'acting': 'theater_comedy',
  'comedy': 'theater_comedy',
  'standup': 'theater_comedy',
  'podcasts': 'podcasts',
  'astrology': 'auto_awesome',
  'star gazing': 'auto_awesome',
  'stargazing': 'auto_awesome',
  'astronomy': 'auto_awesome',
  'volunteering': 'volunteer_activism',
  'social work': 'volunteer_activism',
  'environment': 'eco',
  'sustainability': 'eco',
  'cars': 'directions_car',
  'driving': 'directions_car',
  'motorcycles': 'motorcycle',
  'bikes': 'motorcycle',
  'poetry': 'auto_stories',
  'history': 'history',
  'philosophy': 'psychology',
  'psychology': 'psychology',
  'science': 'science',
  'math': 'calculate',
  'mathematics': 'calculate',
  'board games': 'board_game',
  'cards': 'playing_cards',
  'video editing': 'videocam',
  'editing': 'videocam',
  'design': 'design_services',
  'graphic design': 'design_services',
  'ui design': 'design_services',
  '3d modeling': '3d_rotation',
};

export const INTEREST_ICON_FALLBACKS = [
  'star', 'favorite', 'bolt', 'eco', 'spa', 'whatshot', 'explore',
  'auto_awesome', 'celebration', 'dark_mode', 'light_mode', 'grain',
  'blur_on', 'flash_on', 'wb_sunny', 'nightlight', 'palette',
  'rocket_launch', 'globe', 'water_drop', 'earthquake', 'wind_power'
];

export const COLLEGE_MAP = {
  iitd: 'IIT Delhi',
  iitb: 'IIT Bombay',
  iitk: 'IIT Kanpur',
  iitkgp: 'IIT Kharagpur',
  iitm: 'IIT Madras',
  iitr: 'IIT Roorkee',
  iitg: 'IIT Guwahati',
  iith: 'IIT Hyderabad',
  iitbhu: 'IIT BHU',
  iitism: 'IIT ISM Dhanbad',
};

export const APP_CONSTANTS = {
  // Single source of truth for the auth cookie name. Used by the auth
  // middleware, admin middleware, auth routes, and the socket handshake —
  // it used to be hardcoded in all five places.
  AUTH_COOKIE_NAME: 'matchalize_jwt',
  /* Raised from 6 to 10. The interest list has 22 tags across sport, music,
   * games, volunteering and study — six could not express a personality, and a
   * capped picker makes people pick the first few visible rather than the ones
   * that fit. Must stay in sync with the client's own cap in Onboarding.jsx and
   * Profile.jsx, or the UI will offer options the server then rejects. */
  MAX_INTERESTS: 10,
  /* ⚠️ NO MAX_INTENTS. There was one (2) and it was removed.
   *
   * The original argument was that intent is a ranking signal, so a profile
   * claiming all three matches everyone and stops discriminating. That is true of
   * the first slice and irrelevant by the second: with only three options,
   * holding all three is very close to saying "no preference", which is an
   * honest answer rather than a contradictory one. Someone who names one
   * specific goal still ranks above someone who named three — which is all the
   * signal was ever for.
   *
   * A cap also carried a real cost: a person who genuinely is open to all three
   * had to lie about one to save the deck, and a user who picked a third chip and
   * watched it silently not stick had no way to tell that from a bug.
   *
   * Nothing enforces a limit now. routes/users.js normalises intent by mapping
   * retired values and de-duplicating, and that is all it does. */
/* ⚠️ PHOTO LIMIT IS NOT HERE. It used to be `PHOTO_LIMIT: 6` in this object,
   and that constant was DEAD — nothing in the server or the client ever read
   it. The real limit is `MAX_PHOTOS = 4` in utils/ladder.js, enforced on the
   two write paths in routes/users.js, and the client renders exactly four photo
   slots. So the app has always allowed four photos while this file claimed six.

   Left as a comment rather than silently deleted, because the failure it caused
   was believing: anyone reasoning about photo limits from this config would
   have drawn the wrong conclusion, and 5th and 6th uploads would have looked
   like a missing feature rather than a number that was never enforced.

   Anyone genuinely open to all three can say so. Someone who names one still
   ranks above someone who names all three, which is what the signal was for. */
  IMAGE_MAX_DIM: 800,
  IMAGE_JPEG_QUALITY: 0.7,
  DECK_SIZE: 10,
  OTP_EXPIRY_MINUTES: 10,
  // Real values for the /api/ limiter in index.js. These used to be a lie —
  // the file said 100/15min while the code enforced 2000/min and never read
  // this file at all.
  // Generous on purpose: campus NAT means a whole hostel shares one public IP,
  // so a tight limit locks out a building. The old limit was 2000/min, i.e.
  // 10,000 per 5-minute window against this file's 1,000 per 5 minutes — 10x
  // tighter sustained, and 2x tighter on a single-minute burst (2000 vs 1000).
  // Override with API_GENERAL_MAX, no code change needed.
  API_RATE_LIMIT_MAX: 1000,
  API_RATE_LIMIT_WINDOW_MINUTES: 5,
};

```

### ./server/config/cloudinary.js

```
import { v2 as cloudinary } from 'cloudinary';
import { extractCloudinaryPublicId, isCloudinaryFileOwnedBy } from '../utils/media.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 🧹 CLOUDINARY CLEANUP HELPER
 *
 * Destroys a Cloudinary file. URLs reach this function from user-supplied data
 * (profile photos, bio photo, prompt images), so a caller can hand us a URL
 * that belongs to somebody else. Since every user's media lives in one Cloudinary
 * account under one API secret, the secret proves nothing — so ownership is
 * checked against the per-user upload folder, and a file that is not the
 * caller's is refused.
 *
 * @param url       the Cloudinary URL to destroy
 * @param userId    the user the file must belong to. Required unless `force`.
 * @param opts.force set only for server-trusted cleanup (e.g. the signed
 *                  moderation webhook), where the URL came from Cloudinary
 *                  itself rather than a client.
 */
export const deleteCloudinaryFile = async (url, userId, opts = {}) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return;

  if (!opts.force && !isCloudinaryFileOwnedBy(url, userId)) {
    console.warn(`[Cloudinary Cleanup] REFUSED to destroy a file not owned by ${userId}: ${extractCloudinaryPublicId(url)}`);
    return;
  }

  try {
    const publicId = extractCloudinaryPublicId(url);
    if (!publicId) return;
    const isAudioOrVideo = /\.(webm|mp3|wav|mp4|m4a|ogg)$/i.test(url);

    await cloudinary.uploader.destroy(publicId, {
      resource_type: isAudioOrVideo ? 'video' : 'image',
    });
    console.log(`[Cloudinary Cleanup] Destroyed orphaned artifact: ${publicId}`);
  } catch (err) {
    console.error('[Cloudinary Cleanup Error]:', err.message || err);
  }
};

export default cloudinary;

```

### ./server/config/db.js

```
import mongoose from 'mongoose';
// Importing the barrel registers every model before we try to verify it.
import './../models/index.js';

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 10000,
    maxPoolSize: 20,
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`);

  // 🔊 LOUD INDEX VERIFICATION
  //
  // Schema `.index()` calls are only *instructions*. Mongoose fires them in the
  // background on model compile via autoIndex, and it only logs failures —
  // nothing awaits them, nothing reports them. So a missing index is
  // indistinguishable from a present one until a query goes slow in production.
  //
  // `syncIndexes()` is used rather than `init()` deliberately:
  //   - init() reads the `autoIndex` option and silently returns early if it's
  //     false. Turning autoIndex off is the standard move once you notice 11
  //     models rebuilding indexes on every cold start — and that would turn
  //     this check into a lie that always passes.
  //   - syncIndexes() compares the live database against the schemas and
  //     reports anything missing, regardless of autoIndex. It also creates
  //     any index that doesn't exist yet, which is what covers the Notification
  //     30-day TTL index and the Message unique-partial index that the
  //     race-safe upserts in discover.js / notifications.js rely on.
  //
  // Failure refuses to boot: a server that quietly runs without its indexes is
  // worse than one that doesn't start, because the problem surfaces later,
  // somewhere unrelated, to whoever is on call.
  const names = mongoose.modelNames();
  if (names.length === 0) {
    throw new Error(
      'Index verification aborted: zero models registered. Import models/index.js in db.js.'
    );
  }

  const results = await Promise.allSettled(
    names.map((name) => mongoose.model(name).syncIndexes())
  );

  const failed = results
    .map((r, i) => ({ r, name: names[i] }))
    .filter(({ r }) => r.status === 'rejected');

  if (failed.length > 0) {
    for (const { name, r } of failed) {
      console.error(`❌ Index sync failed for model "${name}": ${r.reason?.message || r.reason}`);
    }
    throw new Error(
      `Index sync failed for ${failed.length}/${names.length} models — refusing to start`
    );
  }

  console.log(`✅ Verified indexes on ${names.length} models (${names.join(', ')})`);
};

export default connectDB;
```

### ./server/config/roulette.js

```
/**
 * 🎰 ROULETTE — TEST SETTINGS.
 *
 * ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────
 * Roulette is the first feature that can put a live camera in front of a
 * stranger. Every other feature fails closed: a bad deck query returns no
 * cards, a bad chat write returns no message. A bad Roulette setting does not
 * fail — it pairs a real person with a real stranger on camera.
 *
 * So the brakes are declared, named and parked BEFORE the engine exists, and
 * the defaults are the closed position. Turning Roulette on is a deliberate
 * edit, never an accident of deployment.
 *
 * ── WHAT THIS IS NOT ──────────────────────────────────────────────────────────
 * These are TEST settings. None is a commercial allowance and none is a
 * capacity claim. `MAX_CONCURRENT_CALLS: 5` is not "the product will support 5"
 * — it is "nobody may accidentally open 500 calls while we are still learning
 * what one costs". A separate decision, informed by measurement, replaces these
 * before any real launch.
 *
 * ── NOTHING READS THIS YET ────────────────────────────────────────────────────
 * Stage 0 records the settings and surfaces the feature's status at boot. No
 * queue, no call, no matching behaviour exists. This file is a declaration with
 * a resolver, not a control panel.
 *
 * Design source: ambitions/roulette.md §13
 */

/** Read an integer from the environment, falling back safely. */
const num = (key, fallback) => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  // A typo like ROULETTE_MAX_QUEUE=five must not silently become NaN and
  // poison every comparison downstream. Fall back instead.
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Read a boolean from the environment. Only the exact string 'true' enables. */
const bool = (key, fallback) => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  return raw === 'true';
};

/**
 * Parse the test-account allow-list.
 *
 * Empty is the safe position and means NOBODY may join the queue. This is the
 * opposite of the usual "empty means no restriction" convention, and that is
 * deliberate: the failure mode we are protecting against is a real account
 * reaching a live camera queue before anyone has looked at the queue code.
 */
const accounts = () => {
  const raw = process.env.ROULETTE_TEST_ACCOUNTS;
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

const TEST_ACCOUNTS = accounts();

export const ROULETTE_SETTINGS = {
  /* ── THE MASTER SWITCH ────────────────────────────────────────────────────
   * Default false. Roulette must be explicitly enabled, in exactly one place,
   * with the word 'true'. Anything else — unset, '1', 'yes', 'TRUE' — is off.
   * There is no code path that turns Roulette on by default, ever. */
  ENABLED: bool('ROULETTE_ENABLED', false),

  /* ── WHO MAY JOIN A QUEUE ──────────────────────────────────────────────────
   * ⚠️ CORRECTED 2026-10-17. This comment previously claimed the allow-list was
   * "read fresh on every call … so a test that mutates process.env must not be
   * defeated by a stale snapshot". That was not true and never had been:
   * `accounts()` runs once at module load (see `const TEST_ACCOUNTS` above), so
   * the list is a startup snapshot and mutating `process.env
   * .ROULETTE_TEST_ACCOUNTS` at runtime changes nothing.
   *
   * Fixing it properly — re-parsing per call — would move an env-var read into
   * the hot path of every socket event for no benefit: `ENABLED` and
   * `IS_TEST_MODE` are baked in at load either way, so the list would only be
   * half-fresh, which is WORSE than honestly snapshot-once. Restarting the
   * process is the correct and sufficient way to change the allow-list, and it
   * means turning Roulette on is always a deliberate act.
   *
   * Empty list = nobody. See the note on `accounts()` above. */
  TEST_ACCOUNTS,
  IS_TEST_MODE: TEST_ACCOUNTS.length > 0,

  /* ── CAPACITY ──────────────────────────────────────────────────────────────
   * Five, not fifty. The number is arbitrary on purpose: it is small enough
   * that two laptops testing together can saturate it deliberately, which is
   * how the admission-control path gets exercised before it is needed for real.
   *
   * NOTE: reaching this cap must refuse NEW sessions with a clear message. It
   * must never queue people who cannot be served — a queue that cannot drain is
   * indistinguishable from a hang. */
  MAX_CONCURRENT_CALLS: num('ROULETTE_MAX_CONCURRENT', 5),

  /* Bounds memory. Beyond this, joining users get "busy" rather than joining a
   * list that will not be served in any reasonable time. */
  MAX_QUEUE_SIZE: num('ROULETTE_MAX_QUEUE', 25),

  /* How long a user may wait before we stop pretending it is worth it. At this
   * point offer Leave — never silently expand the search radius (spec §10.4). */
  MAX_WAIT_SECONDS: num('ROULETTE_MAX_WAIT_SEC', 300),

  /* ── TIMEOUTS ──────────────────────────────────────────────────────────────
   * Twenty seconds is generous for STUN on a campus network and short enough
   * that a user on a captive portal fails with words rather than a spinner. */
  CONNECT_TIMEOUT_MS: num('ROULETTE_CONNECT_TIMEOUT_MS', 20_000),

  /* How long a pairing offer stays valid. Must comfortably exceed the connect
   * timeout, or a slow peer pairs and immediately loses the offer. */
  PAIR_TIMEOUT_MS: num('ROULETTE_PAIR_TIMEOUT_MS', 45_000),

  /* ── LONG-CALL POLICY ──────────────────────────────────────────────────────
   * Two hours. This is a RUNAWAY GUARD, not a product cap, and it is set two
   * orders of magnitude above any plausible commercial limit on purpose: it
   * exists to stop a stuck session billing TURN forever, and must never be
   * mistaken for the duration a paying user is entitled to.
   *
   * The real long-call question is answered by measurement, not by this number
   * — a 30-minute soak test in Stage 6 checks for stalls, memory growth and
   * credential expiry mid-call. The commercial duration limit is deliberately
   * UNDECIDED (spec §17). */
  TEST_CALL_CEILING_MS: num('ROULETTE_TEST_CALL_CEILING_MS', 7_200_000),

  /* ── TURN CREDENTIALS ──────────────────────────────────────────────────────
   * One hour. Cloudflare's maximum is 48h; on expiry it stops billing
   * immediately and then disconnects, so a credential must comfortably outlive
   * a single call but never linger. Refresh mid-call via
   * RTCPeerConnection.setConfiguration() when a session outlives this.
   *
   * ISSUANCE_PER_HOUR is credential-farm defence. The Cloudflare API token
   * mints unlimited short-lived credentials; without a per-user cap one
   * authenticated client can generate them in a loop. */
  TURN_CREDENTIAL_TTL_SECONDS: num('ROULETTE_TURN_TTL_SEC', 3600),
  ISSUANCE_PER_HOUR: num('ROULETTE_ICE_PER_HOUR', 10),

  /* ── SIGNALING SHAPE LIMITS (Stage 3) ─────────────────────────────────────
   * Stage 3 is the first point where untrusted clients send us large strings.
   * Every limiter in `middleware/rateLimiters.js` is `express-rate-limit`, which
   * needs a `req` — so all six of them are invisible to socket events. These
   * four numbers are what actually bound signaling traffic.
   *
   * Sized against real values, not guesses: one video + one audio offer is
   * roughly 2-4 KB, and a healthy call gathers well under 40 ICE candidates
   * across its lifetime. Every ceiling below is therefore generous by an order
   * of magnitude — they exist to stop the pathological case, not to trim the
   * normal one. A limit tight enough to threaten a real call would be a bug. */

  /* Ceiling on one SDP offer/answer, in characters (≈3× UTF-8 bytes, so this is
   * a loose upper bound by design). ~60 KB against a real ~4 KB payload. */
  MAX_SDP_BYTES: num('ROULETTE_MAX_SDP_BYTES', 60_000),

  /* Total ICE candidates relayed for one call, across its whole lifetime.
   * A trickle that stays under the per-second rate limit still accumulates, so
   * the rate limiter alone is not a total bound. */
  MAX_CANDIDATES_PER_SESSION: num('ROULETTE_MAX_CANDIDATES', 120),

  /* Sustained signaling events/second per user, with a burst allowance.
   * Keyed by USER, never by IP: an entire college sits behind one NAT address,
   * so an IP limit would throttle a whole campus mid-conversation. This is the
   * same reasoning as `verifyOtpLimiter` in `middleware/rateLimiters.js`.
   *
   * The burst is generous because ICE legitimately arrives in a dozen-at-once
   * burst right after `setRemoteDescription`. */
  SIGNAL_RATE_PER_SECOND: num('ROULETTE_SIGNAL_RATE', 40),
  SIGNAL_BURST: num('ROULETTE_SIGNAL_BURST', 150),
};

/**
 * May this user join the Roulette queue at all?
 *
 * Three gates, all of which must pass:
 *   1. The feature is on          — otherwise Roulette does not exist.
 *   2. A test allow-list is set   — an EMPTY list admits nobody.
 *   3. This user is on it         — compared as strings, because the values
 *                                   arrive from a comma-separated env var
 *                                   while callers hold an ObjectId.
 *
 * The empty-list rule is the important one. It means that turning
 * ROULETTE_ENABLED on without also configuring ROULETTE_TEST_ACCOUNTS produces
 * a feature that is on, documented, and unable to pair anybody — a loud no-op
 * rather than a live camera pointed at a stranger.
 */
export const canJoinRouletteQueue = (userId) => {
  const s = ROULETTE_SETTINGS;
  if (!s.ENABLED) return false;
  if (!s.IS_TEST_MODE) return false;
  if (!userId) return false;
  return s.TEST_ACCOUNTS.includes(String(userId));
};

/**
 * One-line summary for the boot log, so the feature's status is verifiable
 * without reading code. Mirrors the existing config warnings in index.js, which
 * is why it reads the way it does.
 */
export const describeRouletteStatus = () => {
  const s = ROULETTE_SETTINGS;
  if (!s.ENABLED) return 'disabled (ROULETTE_ENABLED is not "true")';

  if (!s.IS_TEST_MODE) {
    return 'ENABLED but unreachable — ROULETTE_TEST_ACCOUNTS is empty, so nobody may queue';
  }

  const names = ['Deck', 'Chats', 'Roulette', 'Profile'];
  return `ENABLED — ${names[2]} is reachable in test mode, `
    + `${s.TEST_ACCOUNTS.length} allow-listed account(s), `
    + `max ${s.MAX_CONCURRENT_CALLS} concurrent call(s), queue cap ${s.MAX_QUEUE_SIZE}`;
};

export default ROULETTE_SETTINGS;

```

### ./server/index.js

```
import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { protect } from './middleware/auth.js';
import rateLimit from 'express-rate-limit';
import sanitizeMongoInput from './middleware/sanitizeMongoInput.js';
import { APP_CONSTANTS } from './config/appData.js';
import { describeRouletteStatus } from './config/roulette.js';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Config
import connectDB from './config/db.js';
import { seedGatedColleges } from './utils/campusSeed.js';
import { socketHandler } from './socket/chat.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import discoverRoutes from './routes/discover.js';
import alignmentRoutes from './routes/alignments.js';
import messageRoutes from './routes/messages.js';
import configRoutes from './routes/config.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/report.js';
import collegeRoutes from './routes/colleges.js';

// Initialize Sentry (must run after dotenv.config so SENTRY_DSN is loaded)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration(), Sentry.expressIntegration()],
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.2,
  });
}

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// 🔒 FAIL CLOSED on NODE_ENV.
// Several modules branch on NODE_ENV to decide how strict to be:
//   - utils/email.js  logs live OTP codes to stdout when not production
//   - middleware/auth.js marks the auth cookie Secure only when production
//   - routes/users.js + routes/messages.js require https:// photo URLs only when production
//   - corsOriginFunction below allows private LAN origins whenever NODE_ENV !== 'production'
// An unset or typo'd NODE_ENV silently selected the PERMISSIVE branch in all
// four. Refuse to boot instead: relaxed mode only when explicitly asked for.
const NODE_ENV = process.env.NODE_ENV;
const VALID_ENVS = ['development', 'production', 'test'];
if (!VALID_ENVS.includes(NODE_ENV)) {
  console.error(`❌ NODE_ENV must be one of: ${VALID_ENVS.join(' | ')} — got ${JSON.stringify(NODE_ENV)}`);
  console.error('   local dev → add NODE_ENV=development to server/.env');
  console.error('   deployed  → set NODE_ENV=production in the server environment');
  process.exit(1);
}
const IS_PROD = NODE_ENV === 'production';

// Warn about missing optional services
if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️  Resend API key not configured — OTP codes will be logged to console only (users won\'t receive emails)');
}

// 🛑 THE SILENT-FAILURE CHECK.
//
// An API key WITHOUT a verified sending domain is the worst combination in this
// file, and it fails completely silently:
//
//   - Resend ACCEPTS the send. It returns HTTP 200. Nothing errors, anywhere.
//   - `onboarding@resend.dev` is Resend's sandbox sender. It delivers ONLY to
//     the address that owns the Resend account.
//   - So the OTP is accepted, discarded, and never reaches the student. The
//     server's success path runs exactly as it would if email had been
//     delivered, because from this side, it was.
//
// The symptom is "signups silently don't work", which reads as a bug in the
// app and costs hours of debugging code that is perfectly fine. Worse than the
// missing-key case above: with NO key, `sendOTP` prints the code to the log
// and someone can relay it. With a key but no domain, the code is gone and
// nothing local knows where it went.
if (process.env.RESEND_API_KEY) {
  const sender = (process.env.RESEND_SENDER_EMAIL || '').trim().toLowerCase();
  const isSandbox =
    sender === 'onboarding@resend.dev'
    || sender === 'onboarding@sendgrid.com'
    || sender.endsWith('@resend.dev');

  if (isSandbox) {
    console.error(
      '\n' +
      '🛑🛑🛑  OTP EMAILS WILL NOT ARRIVE  🛑🛑🛑\n\n' +
      `   RESEND_API_KEY is set, but RESEND_SENDER_EMAIL is "${sender}".\n` +
      '   That is Resend\'s SANDBOX sender — it delivers only to the email\n' +
      '   address that owns your Resend account. Resend will accept every\n' +
      '   send and return 200. No error will appear. No student will get a\n' +
      '   code, and nobody will be able to sign up.\n\n' +
      '   Fix — pick one:\n' +
      '     • Verify a domain (Resend → Domains → Add Domain) and set\n' +
      '       RESEND_SENDER_EMAIL=you@yourdomain.com\n' +
      '     • UNSET RESEND_API_KEY entirely. OTP codes then print to this\n' +
      '       log and can be relayed by hand, which is fine for a small\n' +
      '       pilot cohort.\n\n',
    );
  }
}
if (!process.env.OTP_HASH_SECRET) {
  console.warn('⚠️  OTP_HASH_SECRET not configured — falling back to JWT_SECRET for OTP hashing. Set a dedicated secret in production.');
}
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠️  Cloudinary not configured — photo uploads will fail');
}
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn('⚠️  VAPID keys not configured — web push notifications will be disabled');
}
// Roulette status. Always printed, unlike the warnings above, because "is it on?"
// must be answerable from the boot log without reading code — and because the
// dangerous state is not "off" but "on with an empty allow-list", which looks
// identical to "off" until you read the flag. config/roulette.js explains it.
console.log(`🎰 Roulette: ${describeRouletteStatus()}`);
// ⚠️ ALLOW_ALL_EMAILS no longer gates anything. The old global `.ac.in` rule was
// removed when the college picker landed — verification is now per-college,
// matched against the domains stored on each College record. This flag is left
// in place only so existing .env files don't break startup, but it is a no-op
// and the warning would otherwise be actively misleading.
console.log('🔒 College email verification active (per-college domain match)');

// Connect to Database — refuse to serve traffic until ready
try {
  await connectDB();
} catch (err) {
  console.error(`❌ Server failed to start: ${err.message}`);
  process.exit(1);
}

// 🏫 Seed any gated campus that does not exist yet.
//
// Runs AFTER connectDB (which has verified every index) and BEFORE the server
// listens, so a picker query can never race it. Never throws — see the file for
// why an empty picker is survivable and an unbootable server is not.
try {
  await seedGatedColleges();
} catch (err) {
  console.error(`⚠️  Campus seed skipped: ${err.message}`);
}

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 🔒 STRICT CORS WHITELIST: Prevents unauthorized third-party apps from making credentialed requests
const corsOrigins = new Set([
  FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const isPrivateOrigin = (origin) => {
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    if (hostname.startsWith('10.')) return true;
    if (hostname.startsWith('192.168.')) return true;
    if (hostname.startsWith('172.')) {
      const second = parseInt(hostname.split('.')[1], 10);
      return second >= 16 && second <= 31;
    }
    return false;
  } catch {
    return false;
  }
};

const corsOriginFunction = (origin, callback) => {
  // Allow requests with no origin (mobile apps, curl, or local dev)
  if (!origin) return callback(null, true);

  if (corsOrigins.has(origin)) {
    return callback(null, true);
  }

  // Automatically allow private LAN/Wi-Fi origins ONLY outside production.
  // Safe to rely on IS_PROD now: boot already exits on an invalid NODE_ENV.
  if (!IS_PROD && isPrivateOrigin(origin)) {
    return callback(null, true);
  }

  console.warn(`[CORS Blocked] Unauthorized origin attempted connection: ${origin}`);
  callback(new Error('Not allowed by CORS'));
};

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: corsOriginFunction,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    /* 🔒 REQUIRED, AND ITS ABSENCE BREAKS EVERY CONNECTION.
     * The client connects with `withCredentials: true` because auth is a
     * cookie, and Socket.io DEFAULTS THIS TO FALSE. The browser then rejects
     * the handshake with:
     *
     *   Access-Control-Allow-Credentials header is '' which must be 'true'
     *
     * which is why this looked like a server outage rather than a config gap —
     * HTTP requests kept working while every socket silently failed to connect.
     * `credentials` is NOT inherited from the express `cors()` below; the two
     * are independent configurations and this one had to be set separately.
     *
     * Safe alongside the same `corsOriginFunction` allowlist used above: the
     * browser still refuses to expose a credentialed response to any origin
     * that function rejects, and `Access-Control-Allow-Credentials: true` on
     * its own does not permit an origin — it only permits the paired
     * `Access-Control-Allow-Origin` to be a specific origin rather than `*`.
     */
    credentials: true,
  },
});

// Attach socket server to express app so it can be accessed in routing files
app.set('io', io);

// Configure Socket event handlers
socketHandler(io);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // REMOVED 'unsafe-inline'/'unsafe-eval' — build emits external module scripts only.
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https://*.cloudinary.com', 'https://images.unsplash.com', 'https://res.cloudinary.com'],
      connectSrc: [
        "'self'",
        'https://*.onrender.com', 'wss://*.onrender.com',
        // 🔒 THE FRONTEND ORIGIN, DERIVED.
        //
        // This was hardcoded to the Render wildcard above, which works only
        // while the client is served from an *.onrender.com domain. Attach a
        // custom domain — or serve the client from Vercel/Cloudflare Pages, or
        // a different host entirely — and the browser blocks every API call
        // and every socket handshake, with no server-side error to explain it:
        // the request is never made.
        //
        // So the deployed FRONTEND_URL is added here, expanded to BOTH the
        // https:// (REST) and wss:// (socket) transports. Deriving it from the
        // same variable that drives the CORS allowlist means there is exactly
        // one place to change when the domain changes, instead of a CSP list
        // that quietly rots.
        //
        // Written as two independent replacements rather than a chained pair
        // on purpose. `x.replace(/^http:/,'https:').replace(/^http:/,'ws:')`
        // looks right and is not: the first pass turns `http:` into `https:`,
        // which no longer matches the second pattern, so the wss:// origin is
        // silently never emitted and sockets fail only in the browser.
        ...(FRONTEND_URL
          ? [
              FRONTEND_URL.replace(/^http:/, 'https:'),
              FRONTEND_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:'),
            ]
          : []),
        // Loopback is dev-only. These four used to sit outside the IS_PROD
        // guard, which shipped them to production: harmless in practice (a
        // script would have to run on someone's own laptop to make use of
        // them), but it's a directive that means nothing in prod and shouldn't
        // be there.
        ...(IS_PROD ? [] : [
          'http://localhost:*', 'ws://localhost:*',
          'http://127.0.0.1:*', 'ws://127.0.0.1:*',
          'http://10.*:*', 'ws://10.*:*',
          'http://192.168.*:*', 'ws://192.168.*:*',
          // NOTE: the CSP cannot express a CIDR range, so 172.* also matches
          // 172.0.0.0–172.15.255.255, which is public address space. CORS does
          // gate this properly (see isPrivateOrigin, which restricts 172. to
          // 16–31), so this is belt-and-braces rather than the real control.
          'http://172.*:*', 'ws://172.*:*',
        ]),
      ],

      // NEW DEFENSIVE DIRECTIVES
      frameAncestors: ["'self'"], // Prevents clickjacking
      formAction: ["'self'"],     // Prevents form hijacking
      baseUri: ["'self'"],        // Prevents base tag injection
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  originAgentCluster: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: corsOriginFunction,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: [],
}));
app.use(compression());
app.use(cookieParser());

// Simple request log (reception-desk log: method, path, status, duration)
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
  });
  next();
});

// Apply the global API limit before reading request bodies, so bursts of large
// payloads are rejected without first parsing and allocating their contents.
const limiter = rateLimit({
  windowMs: APP_CONSTANTS.API_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: Number(process.env.API_GENERAL_MAX) || APP_CONSTANTS.API_RATE_LIMIT_MAX,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// 🛡️ RAW BODY FOR THE CLOUDINARY SIGNATURE CHECK — must be registered BEFORE
// express.json() below.
//
// The moderation webhook verifies Cloudinary's signature as
// SHA1(rawBody + timestamp + API_SECRET). It therefore needs the exact bytes.
//
// express.json() sets req._body = true after parsing, and body-parser's json
// parser bails out on an already-parsed request
// (body-parser/lib/types/json.js:102 — `if (req._body) { next(); return; }`).
// So with the webhook mounted after the global parser, its own express.raw()
// never ran, req.body was already a plain object, `req.body.toString()` produced
// the literal string "[object Object]", and the computed digest could never match
// a real signature — the route returned 401 for every single request and the
// rejected-upload cleanup it performs has never once run.
//
// Scoped to the one path and the one content type so it cannot swallow bodies
// for the rest of the API.
app.use('/api/upload/moderation-status', express.raw({ type: 'application/json', limit: '100kb' }));

// JSON bodies only. Photos go through the multipart /api/upload
// route, which multer handles with its own fileSize limit — so 1mb is plenty
// for every text payload here (profiles, messages, prefs, onboarding answers).
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(sanitizeMongoInput);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/alignments', alignmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/colleges', collegeRoutes);

// JSON 404 for unknown API endpoints (must come AFTER all /api route mounts)
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// 🔎 HEALTH — mounted BEFORE express.static so it always answers, and so a
// keep-alive ping never downloads the SPA shell to prove the server is up.
//
// This route exists because of a specific Render behaviour: while a free web
// service is asleep, Render answers /robots.txt itself and never forwards it.
// A monitor pointed there reports green on a sleeping service. Point pings
// here instead — it is a real route on this app.
//
// Deliberately cheap: it does NOT touch the database. If Atlas is briefly
// unreachable the process is still listening and still able to serve, and a
// liveness probe that fails on a dependency outage just triggers a pointless
// restart of a healthy process. Readiness is a separate question from liveness.
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    env: NODE_ENV,
  });
});

// Protect local uploads fallback (Prod uses Cloudinary URLs, so this mostly protects dev/staging)
app.use('/uploads', protect, express.static(path.join(__dirname, 'uploads')));

// Serve production client build
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// Base Status Route
app.get('/', (req, res) => {
  res.json({ status: 'active', message: 'Matchalize API Server is running' });
});

// Serve client app for all non-API routes (SPA fallback). A RegExp route works
// across Express 4 and 5, avoiding path-to-regexp's incompatible wildcard syntax.
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// Sentry error handler (v8+ API; must be after routes, before the generic handler)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Centralized Error Handler
app.use((err, req, res, next) => {
  // 1. Our custom AppError → structured response
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // 2. Body-parser errors (malformed/too large/too many)
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large' || err.type === 'entity.too.many') {
    return res.status(err.status || (err.type === 'entity.too.large' ? 413 : 400)).json({
      success: false,
      message: err.type === 'entity.too.large' ? 'Request body too large.' : 'Invalid request body.',
      code: err.type === 'entity.too.large' ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
    });
  }

  // 3. CORS rejections → 403, not 500
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Not allowed by CORS',
      code: 'FORBIDDEN',
    });
  }

  // 4. Unexpected crash → report to Sentry, then generic plain-words response
  console.error('💥 UNEXPECTED ERROR:', err);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  res.status(500).json({
    success: false,
    message: 'Something went wrong on our side. Please try again.',
    code: 'INTERNAL_SERVER_ERROR',
  });
});

// Start Server
const PORT = process.env.PORT || 5005;

/**
 * Bind the port, but fail in a way that tells the operator what to actually do.
 *
 * `server.listen` emits an error asynchronously, and by the time an
 * 'uncaughtException' handler sees EADDRINUSE the stack is full of Node
 * internals and the real cause — another server already on this port — is easy
 * to miss. Under nodemon that reads as a crash-loop waiting on a file change,
 * which looks like a code bug and isn't one.
 *
 * Exiting deliberately instead means the terminal states the problem in one
 * line and stops, rather than sitting there looking crashed.
 */
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n❌ Port ${PORT} is already in use.\n` +
      `   Another Matchalize server is already running on it.\n\n` +
      `   Find it:  lsof -nP -iTCP:${PORT} -sTCP:LISTEN\n` +
      `   Stop it:  kill <PID>\n\n` +
      `   (If that is your other terminal's \`npm run dev:server\`, switch to\n` +
      `   that one instead — two servers cannot share a port.)\n`,
    );
    process.exit(1);
  }
  console.error('❌ Server failed to start:', err.message);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Dev-only: without a Resend key, OTPs are printed here instead of emailed.
  // Saying so explicitly stops the "why can't I see the code" question.
  if (!process.env.RESEND_API_KEY) {
    console.log('📬 No RESEND_API_KEY — OTP codes print below, they are not emailed');
  }
});

// ─── GRACEFUL SHUTDOWN & FATAL ERROR HANDLERS ───
let shuttingDown = false;
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received — shutting down gracefully...`);
  // Disconnect websockets FIRST and AWAIT it. Otherwise open chat sockets hold
  // the server open until the 10s force-kill, so every deploy waits it out.
  // Awaiting also lets each socket's 'disconnect' handler finish its Mongo
  // write (lastActive) before mongoose closes underneath it.
  io.close()
    .catch(() => {})
    .then(() => {
      return new Promise((resolve) => server.close(resolve));
    })
    .then(() => mongoose.connection.close())
    .then(() => {
      console.log('MongoDB disconnected. Process exiting.');
      process.exit(0);
    })
    .catch(() => {
      console.log('Shutdown steps failed; exiting anyway.');
      process.exit(0);
    });

  // Force kill if graceful shutdown takes too long (e.g., stuck sockets)
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(reason);
  }
  // Report to Sentry, then keep running. Self-hosted may not have automatic
  // restarts configured yet, so don't force-exit here.
});

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err);
  // Capture then FLUSH before dying. process.exit() is immediate, so without
  // this the crash report never finishes uploading and Sentry stays empty.
  Sentry.captureException(err);
  Sentry.close(2000).finally(() => process.exit(1));
  // Backstop in case Sentry.close() itself hangs or rejects.
  setTimeout(() => process.exit(1), 3000).unref();
});

```

### ./server/middleware/admin.js

```
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { APP_CONSTANTS } from '../config/appData.js';

const COOKIE_NAME = APP_CONSTANTS.AUTH_COOKIE_NAME;

export const adminProtect = async (req, res, next) => {
  let token = null;
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // No .lean(): req.user is a full mongoose doc, so any future code that
    // saves it works instead of throwing. (Nothing saves it today — cleanup only.)
    const user = await User.findById(decoded.id).select('email name suspended isDeleted');

    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.suspended) return res.status(403).json({ message: 'Account suspended' });
    if (user.isDeleted) return res.status(403).json({ message: 'Account deleted' });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('ADMIN_EMAIL not set in .env — admin routes are disabled');
      return res.status(503).json({ message: 'Admin access not configured' });
    }

    if (user.email.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(403).json({ message: 'Not an admin' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error.message);
    return res.status(401).json({ message: 'Token invalid' });
  }
};

```

### ./server/middleware/auth.js

```
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { APP_CONSTANTS } from '../config/appData.js';

const COOKIE_NAME = APP_CONSTANTS.AUTH_COOKIE_NAME;
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Extracts the JWT from httpOnly cookie (primary) or Authorization header (fallback).
 */
const extractToken = (req) => {
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

/**
 * Sets the JWT as an httpOnly cookie. Called on login and token refresh.
 */
export const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax', // 'lax' allows cookies on top-level navigation (push notifications, shared links)
                     // while still blocking cross-site POST/PUT/DELETE (CSRF protection)
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clears the auth cookie. Called on logout.
 */
export const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax', // Must match setAuthCookie for the browser to recognize the cookie
    path: '/',
  });
};

export const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /* ⚠️ `intent` IS IN THIS LIST BECAUSE routes/discover.js READS IT OFF
       `req.user`, AND IT WAS MISSING FOR A LONG TIME.

       The deck ranks by `_intentMatch`, computed from the intersection of the
       viewer's intent and each candidate's. With `intent` absent from this
       projection, `currentUser.intent` was `undefined`, `myIntent` collapsed to
       `[]`, and the expression short-circuited to a constant `0`. The sort key
       still existed and still looked correct in the pipeline — it just never
       varied. Intent ranking was inert: no error, no warning, plausible-looking
       code.

       The lesson worth keeping: a ranking key that is CONSTANT still sorts
       successfully. Assert that a signal CHANGES the order, not merely that it
       compiles. Tests here now fail if a matched-intent card and an unmatched
       one can come back in either order.

       `+currentLatLng +locationSource +locationUpdatedAt` are additive to the
       schema's `select: false`, which exists to keep this sensitive pair out of
       any query that did not ask for it by name.

       This query IS one that needs it: the deck ranks by distance between the
       viewer and each candidate, so the viewer's own position has to be
       available on `req.user` or every card would compute as unknown-distance
       and sort last. Additive selection (`+field`) is required — listing them
       plainly would silently drop the fields already chosen above.

       These are named here and nowhere else. Do NOT add them to CARD_FIELDS in
       utils/publicCard.js; that is the projection every OTHER user sees, and
       this pair must never travel in it. */
    req.user = await User.findById(decoded.id).select('name suspended isDeleted lastLogoutAt collegeCode interestedIn interests gender intent +currentLatLng +locationSource +locationUpdatedAt');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // SUSPENDED CHECK: Reject suspended users immediately on every request
    if (req.user.suspended) {
      return res.status(403).json({ message: 'Account suspended. Please contact support.', suspended: true });
    }

    // DELETED CHECK: Reject soft-deleted users on every request
    if (req.user.isDeleted) {
      return res.status(403).json({ message: 'Account has been deleted.', deleted: true });
    }

    // MULTI-DEVICE CHECK: Reject tokens issued before the last global logout
    const issuedAt = decoded.iat * 1000;
    if (req.user.lastLogoutAt && issuedAt < req.user.lastLogoutAt.getTime()) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    // SLIDING EXPIRATION: If token is older than 6 days, issue a new one
    const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
    if (Date.now() - issuedAt > sixDaysMs) {
      const newToken = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      setAuthCookie(res, newToken);
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

```

### ./server/middleware/blockFilter.js

```
import Block from '../models/Block.js';

/**
 * Returns a MongoDB query fragment that excludes blocked users
 * from any query that fetches users by _id.
 *
 * @param {ObjectId} userId - The authenticated user's ID
 * @returns {Promise<Object>} - Query fragment like { _id: { $nin: [...] } }
 */
export async function getBlockExclusionQuery(userId) {
  const blocks = await Block.find({
    $or: [{ blocker: userId }, { blocked: userId }],
  }).lean();

  const blockedIds = blocks.map((b) =>
    b.blocker.toString() === userId.toString() ? b.blocked : b.blocker
  );

  if (blockedIds.length === 0) return {};
  return { _id: { $nin: blockedIds } };
}

/**
 * Checks if two specific users have a block relationship.
 *
 * @param {ObjectId} userA
 * @param {ObjectId} userB
 * @returns {Promise<boolean>}
 */
export async function areBlocked(userA, userB) {
  const block = await Block.findOne({
    $or: [
      { blocker: userA, blocked: userB },
      { blocker: userB, blocked: userA },
    ],
  });
  return !!block;
}

/**
 * Which way a block runs between two users — `areBlocked` only says one exists.
 *
 * @param {ObjectId} userA - the authenticated user (the "you" in the copy)
 * @param {ObjectId} userB
 * @returns {Promise<null|'you_blocked_them'|'they_blocked_you'>}
 */
export async function getBlockDirection(userA, userB) {
  const block = await Block.findOne({
    $or: [
      { blocker: userA, blocked: userB },
      { blocker: userB, blocked: userA },
    ],
  }).lean();
  if (!block) return null;
  return block.blocker.toString() === userA.toString() ? 'you_blocked_them' : 'they_blocked_you';
}

```

### ./server/middleware/rateLimiters.js

```
import rateLimit from 'express-rate-limit';

// Limit message sending to 30 messages per 10 minutes per user
export const messageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many messages sent. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const destructiveActionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many destructive actions. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit discover actions (likes/passes) to 100 per 10 minutes per user
export const discoverLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many actions. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit OTP verification attempts to prevent brute-force.
// KEYED BY EMAIL (not IP): brute force is per-email anyway (each email has
// its own OTP + 3-attempt cap in DB). This lets students across ANY Indian
// college — behind shared campus NAT — verify without blocking each other.
export const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.OTP_VERIFY_MAX) || 15,
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toString().toLowerCase().trim();
    return email || `no-email-${req.ip}`;
  },
  message: {
    message: 'Too many verification attempts. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit OTP send requests BY EMAIL (not IP).
// With potentially hundreds of Indian colleges behind NAT, IP-based limiting
// would lock out entire campuses. Per-email keying means every student gets
// their own bucket. Real anti-spam protection stays in the send-otp route:
// 5 codes/hour/email DB check + .ac.in domain restriction.
export const otpEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.OTP_EMAIL_LIMIT_MAX) || 5,
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toString().toLowerCase().trim();
    return email || `no-email-${req.ip}`;
  },
  message: { message: 'Too many verification requests for this email. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Add a per-source cap before the per-email cap so one client cannot consume
// arbitrary OTP sends for many addresses. Keep this generous for shared campus
// networks; the per-email limiter remains as a separate delivery-abuse guard.
export const otpIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.OTP_IP_LIMIT_MAX) || 20,
  message: { message: 'Too many verification requests from this device. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 📨 COLLEGE REQUEST limiter — protects the public "add my college" form.
 *
 * Keyed by IP, NOT email: the threat here is someone scripting thousands of
 * submissions to bury real requests under fake ones, which is an IP-shaped
 * problem. (College requests are also deduped by email at the DB layer, so one
 * person cannot pad a campus's count by submitting repeatedly.)
 *
 * IP-based is safe here precisely because it doesn't gate signups — an IP
 * limiter on otpEmailLimiter would lock out a whole NAT'd campus.
 */
export const collegeRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.COLLEGE_REQUEST_LIMIT_MAX) || 5,
  message: { message: 'Too many college requests from this device. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * ♻️ RE-VERIFICATION limiter — the yearly student re-check.
 *
 * Keyed by user id, not IP or email: every student sits behind shared campus
 * NAT, so an IP limiter here would lock out a whole college at once on the same
 * day their re-verification came due. A user needs exactly one code, so a tight
 * budget is safe.
 */
export const reverifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.REVERIFY_MAX) || 10,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many re-verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

```

### ./server/middleware/sanitizeMongoInput.js

```
const sanitizeObject = (value) => {
  if (!value || typeof value !== 'object') return value;

  const pending = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    if (Array.isArray(current)) {
      for (const item of current) {
        if (item && typeof item === 'object') pending.push(item);
      }
      continue;
    }

    for (const key of Object.keys(current)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete current[key];
      } else if (current[key] && typeof current[key] === 'object') {
        pending.push(current[key]);
      }
    }
  }

  return value;
};

const sanitizeMongoInput = (req, res, next) => {
  req.body = sanitizeObject(req.body);
  req.params = sanitizeObject(req.params);
  req.headers = sanitizeObject(req.headers);
  Object.defineProperty(req, 'query', {
    configurable: true,
    enumerable: true,
    value: sanitizeObject(req.query),
    writable: true,
  });
  next();
};

export { sanitizeObject };
export default sanitizeMongoInput;

```

### ./server/middleware/validate.js

```
import { body, validationResult } from 'express-validator';

export { body };

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const list = errors.array();
    // `message` is what the client's api.js reads (and toasts). Without it the
    // user only ever saw the generic fallback instead of the real validator text
    // ("Please enter a valid email address", "Name is required", …).
    return res.status(400).json({ message: list[0]?.msg, errors: list });
  }
  next();
};

```

### ./server/models/Alignment.js

```
import mongoose from 'mongoose';

const alignmentSchema = new mongoose.Schema(
  {
    pairKey: {
      type: String,
      required: true,
      unique: true,
      // Always formatted as 'LowerObjectId__HigherObjectId'
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    unlockedByInteractionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interaction',
      required: true,
      // Points back to the exact letter that sparked the alignment
    },

    /* ═══════════════════════════════════════════════════════════════════════
     * 🛡️ IDENTITY & PRIVACY  (Roulette, Stage 1)
     *
     * Three problems this solves, all found by inspection:
     *
     * 1. "Can this person see my profile?" was decided independently by each
     *    screen — Chat.jsx showed the name, NotificationDrawer the name AND
     *    photo, the push notification used the sender's name as the lock
     *    screen TITLE, and Chats search filtered on the real name. 22 inline
     *    render sites, no single rule. A promise of "your profile is hidden"
     *    is unkeepable when there is nothing to break.
     *
     * 2. `showCollege` is the ONLY identity field with a server-side strip
     *    (utils/publicCard.js:64-69). `name` and `photos` are on the
     *    CARD_FIELDS allowlist and are always sent. There was no way to say
     *    "you may not see this person's profile" — only "you may not see
     *    their college".
     *
     * 3. Roulette connections are profile-hidden by default, and a Deck
     *    connection and a Roulette connection land in the SAME document,
     *    because `pairKey` is unique per unordered pair. Whatever grants
     *    access therefore has to live on the document, not be inferred from
     *    which flow produced it.
     *
     * ⚠️ SOURCE IS PROVENANCE ONLY. It records where a connection was born and
     * NEVER authorises access. `source: 'roulette'` does not mean "hidden" and
     * `source: 'deck'` does not mean "visible". Only `profileGrants` decides
     * that. Keeping the two separate is what lets a hidden-Roulette pair that
     * later meets again on the Deck keep its original permissions instead of
     * being silently upgraded by the newer flow.
     * ═══════════════════════════════════════════════════════════════════════ */
    source: {
      type: String,
      enum: ['deck', 'roulette'],
      default: 'deck',
      /* Where the connection was born. Provenance, never authority.
       * Defaults to 'deck' rather than null on purpose: a row that somehow
       * arrives without this must not read as "unknown origin, treat
       * differently". Backfill (scripts/migrate-roulette-source.mjs) sets it
       * explicitly on existing rows; the default is only the safety net for
       * a future write that forgets it. */
    },

    profileGrants: {
      type: [
        {
          viewerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            // The person who gained the right to look.
          },
          subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            // Whose public profile they may now see.
          },
          source: {
            type: String,
            enum: ['legacy', 'deck', 'roulette_visible', 'roulette_reveal'],
            required: true,
            /* WHY the access exists. 'legacy' = backfilled from a pre-Roulette
             * deck connection, which showed both profiles openly. 'deck' = a new
             * deck align. 'roulette_visible' = the person entered Roulette with
             * "show my profile" already on, so anyone they meet may see it.
             * 'roulette_reveal' = both parties explicitly agreed to share.
             *
             * Recorded rather than inferred so that a future question — "why
             * can this person see that profile?" — has an answer in the
             * database instead of requiring us to reconstruct history from
             * request timestamps. */
          },
          grantedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
      /* DELIBERATELY EMPTY BY DEFAULT. Absence of a grant means NO ACCESS.
       *
       * The alternative — treating "no grant yet" as "it's a deck connection,
       * so allow it" — is a special case keyed on a field, and a special case
       * is exactly what fails: the first hidden-Roulette row written before
       * its grants are populated would silently show the real name. An empty
       * array fails closed with no branch to get wrong. */
    },

    conversationAliases: {
      type: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            // This person.
          },
          alias: {
            type: String,
            trim: true,
            maxlength: 24,
            default: null,
            // The name the OTHER party sees for them in this conversation.
            /* Copied ONCE when the connection is created and never written
             * again. That is what makes it safe: a new Roulette session can
             * never rename an existing conversation, because an
             * already-connected pair never gets a new Align request at all
             * (spec §9.1) — so there is no code path that could overwrite
             * this. 24 chars is a display name, not a profile field. */
          },
        },
      ],
      default: [],
      /* Absent for connections that predate Roulette: those show the real name
       * via profileGrants, so no alias is needed and none is invented. */
    },

    revealRequest: {
      state: {
        type: String,
        enum: ['none', 'pending', 'accepted', 'declined', 'expired'],
        default: 'none',
        /* none → pending → (accepted | declined | expired)
         *
         * Transitions are single-document atomic findOneAndUpdate calls whose
         * filter includes the expected prior state, retried on a miss. NOT
         * transactions: MongoDB M0 and the local standalone mongod do not
         * support them, and none are used anywhere in this codebase. The
         * established pattern to copy is discover.js:1488-1516
         * (DECK_RACE_RETRIES + isConcurrentDeckRace). */
      },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      requestedAt: {
        type: Date,
        default: null,
      },
      resolvedAt: {
        type: Date,
        default: null,
      },
      consents: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          /* Accumulated atomically. Reaching two entries IS mutual acceptance —
           * there is no separate "both clicked" flag that could disagree with
           * the list. */
        },
      ],
      /* A subdocument with defaults rather than an optional field, so the state
       * machine always has a defined state and callers never need `?.`. */
    },
  },
  {
    timestamps: true,
  }
);

alignmentSchema.index({ users: 1, isActive: 1 });

/* Serves the only query the resolver makes: "is there a grant from this viewer
 * to this subject on this connection?" Without it that lookup is a collection
 * scan on every render of a chat header. Compound on both ids so the index can
 * be used as a prefix match in either direction. */
alignmentSchema.index({ 'profileGrants.viewerId': 1, 'profileGrants.subjectId': 1 });

/**
 * 🛡️ ALIGNMENT INTEGRITY
 *
 * An alignment is by definition two people, and `pairKey` must describe exactly
 * those two. Nothing enforced either: `users` was an unbounded array, so a stray
 * `$push` could add a third person and the chat would silently become a
 * three-way conversation while `pairKey` still said two — no error anywhere,
 * just a silently wrong document.
 *
 * Sorting note: both construction sites build pairKey with a bare
 * `[a, b].sort().join('__')` (routes/discover.js, routes/notifications.js) —
 * default lexicographic sort on 24-char hex ObjectId strings. This hook must use
 * the identical expression or it will reject valid alignments. If either site
 * ever switches to an explicit comparator, change it here too.
 *
 * `pre('validate')` covers both `save()` and an explicit `.validate()`.
 */
alignmentSchema.pre('validate', function (next) {
  const users = Array.isArray(this.users) ? this.users : [];
  if (users.length !== 2) {
    return next(new Error(`Alignment must have exactly 2 users, got ${users.length}`));
  }
  const expected = users.map(String).sort().join('__');
  if (this.pairKey !== expected) {
    return next(new Error(`pairKey does not match users: expected "${expected}", got "${this.pairKey}"`));
  }

  /* 🛡️ GRANT INTEGRITY
   *
   * Same class of bug the two-user check above exists to prevent. Nothing
   * stopped a `$push` onto `profileGrants` naming a THIRD person, at which
   * point a two-person connection would hand out permission to see someone
   * who is not in it — and the failure would be silent, because a grant is
   * just two ids and nothing downstream ever checks who they belong to.
   *
   * Both ends of every grant must be one of this alignment's two users.
   */
  const memberIds = new Set(users.map(String));
  for (const grant of this.profileGrants || []) {
    const viewer = String(grant.viewerId);
    const subject = String(grant.subjectId);
    if (!memberIds.has(viewer)) {
      return next(new Error(`profileGrants viewerId ${viewer} is not a member of this alignment`));
    }
    if (!memberIds.has(subject)) {
      return next(new Error(`profileGrants subjectId ${subject} is not a member of this alignment`));
    }
    if (viewer === subject) {
      return next(new Error('profileGrants cannot grant a user access to their own profile'));
    }
  }

  next();
});

const Alignment = mongoose.model('Alignment', alignmentSchema);
export default Alignment;
```

### ./server/models/Analytics.js

```
import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    event: {
      type: String,
      required: true,
      enum: ['ONBOARDING_STEP', 'ONBOARDING_COMPLETE', 'ONBOARDING_ABANDONED'],
    },
    step: {
      type: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

analyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
analyticsSchema.index({ user: 1, event: 1 });

export default mongoose.model('Analytics', analyticsSchema);
```

### ./server/models/Block.js

```
import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  blocker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  blocked: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

// Fast lookup: "everyone who blocked ME" (used to filter the swipe deck).
// Without this, that half of the query reads the entire blocks table.
blockSchema.index({ blocked: 1 });

const Block = mongoose.model('Block', blockSchema);
export default Block;

```

### ./server/models/College.js

```
import mongoose from 'mongoose';

/**
 * 🏫 COLLEGE — a campus that students can be verified against.
 *
 * Lives in the database, not in source code: an operator adds a campus from
 * /admin without a deploy. The frontend never hardcodes a college.
 *
 * The `domains` array is the entire verification mechanism. A college with no
 * domain cannot be saved (see the route-level validation) because a college
 * without a domain would have nothing to check an email against — and would
 * therefore accept anyone.
 */
const collegeSchema = new mongoose.Schema(
  {
    // Short internal key stored on every user (`User.collegeCode`). NOT shown
    // to users — they search the full `name`. Never editable once users exist:
    // renaming the key would split one campus into two in the user data.
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 30,
      match: [/^[a-z0-9-]+$/, 'Code must be lowercase letters, numbers and dashes only'],
    },

    // Full official name — this is what users type to search ("Indian
    // Institute of Technology Bombay"). Not a short/abbreviated name, so a
    // typed official name always matches.
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // One or more official mail domains. Stored WITHOUT a leading @ and
    // lowercased. Matching is exact-or-subdomain (see utils/collegeDomain.js),
    // so `cse.iitb.ac.in` validates against `iitb.ac.in` without every
    // department domain having to be listed here.
    domains: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A college needs at least one email domain, otherwise anyone could verify as a student there',
      },
    },

    // Search helpers only. Displayed on the card when present, but they exist
    // so someone who knows "Delhi" can still find their campus.
    city: { type: String, trim: true, default: '', maxlength: 100 },
    state: { type: String, trim: true, default: '', maxlength: 100 },
    country: { type: String, trim: true, default: '', maxlength: 100 },

    // 📍 Where this campus actually is, as [latitude, longitude].
    //
    // OPTIONAL by design. Without it a college still works completely — it just
    // has no position, so distance banding treats anyone at it as "unknown
    // location" and sorts them last rather than guessing. That is the honest
    // failure, and it means adding campuses to the picker never blocks on this
    // field being filled in.
    //
    // This is campus data, not user data: it is a building's location, published
    // information, and carries none of the privacy weight of a person's own
    // coordinates. That asymmetry is the reason distance ranking is viable at
    // all — see models/User.js `currentLatLng`.
    latLng: {
      type: [Number],
      default: undefined,
      validate: {
        validator: (v) => v === undefined || v === null
          || (Array.isArray(v)
            && v.length === 2
            && v.every((n) => Number.isFinite(n))
            && v[0] >= -90 && v[0] <= 90
            && v[1] >= -180 && v[1] <= 180),
        message: 'latLng must be [latitude, longitude] with latitude in -90..90 and longitude in -180..180',
      },
    },

    // Hiding a college blocks NEW signups and hides it from the picker, but
    // never touches students already verified through it. Deactivation is a
    // data-correction tool, not a punishment — see routes/colleges.js.
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Case-insensitive search across the fields a student is likely to know.
collegeSchema.index({ name: 1 });
collegeSchema.index({ city: 1 });
collegeSchema.index({ state: 1 });

export default mongoose.model('College', collegeSchema);
```

### ./server/models/CollegeRequest.js

```
import mongoose from 'mongoose';

/**
 * 📨 COLLEGE REQUEST — "I can't find my college, please add it."
 *
 * A student at an unlisted campus submits this. It does NOT get them into the
 * product: nobody can sign up until an operator verifies the domain and adds
 * the college. The request is a waiting list, not a back door.
 *
 * That distinction matters — if a requester could self-declare a college and a
 * domain, anyone could invent a fake campus and verify against it.
 */
const collegeRequestSchema = new mongoose.Schema(
  {
    // What they typed. Deliberately structured (not one free-text blob) so the
    // same campus can't hide behind three differently-spelled names in the
    // operator's grouped queue.
    collegeName: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, trim: true, default: '', maxlength: 100 },
    state: { type: String, trim: true, default: '', maxlength: 100 },
    country: { type: String, trim: true, default: '', maxlength: 100 },

    // Their institutional address. Two jobs: it is the only real evidence the
    // requester belongs to that campus, and its domain usually tells the
    // operator what domain to verify. Never emailed a sign-in link (see
    // routes/colleges.js) — doing so would let someone use this form to
    // hijack an arbitrary inbox.
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    name: { type: String, trim: true, default: '', maxlength: 100 },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },

    // Set when the operator notifies them, so nobody gets emailed twice.
    notifiedAt: { type: Date, default: null },

    // Which college this request became, if it was approved.
    collegeCode: { type: String, default: '' },
  },
  { timestamps: true }
);

// Operator queue: pending first, grouped/sorted by collegeName.
collegeRequestSchema.index({ status: 1, collegeName: 1 });
// One request per email, so a campus with 200 students doesn't produce 200
// rows and doesn't distort the count that drives operator prioritisation.
collegeRequestSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('CollegeRequest', collegeRequestSchema);
```

### ./server/models/DailyAlignQuota.js

```
import mongoose from 'mongoose';

const dailyAlignQuotaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dayKey: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    required: true,
    min: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

dailyAlignQuotaSchema.index({ userId: 1, dayKey: 1 }, { unique: true });
dailyAlignQuotaSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const DailyAlignQuota = mongoose.model('DailyAlignQuota', dailyAlignQuotaSchema);
export default DailyAlignQuota;

```

### ./server/models/DeckImpression.js

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

### ./server/models/DiscoverSession.js

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

```

### ./server/models/Interaction.js

```
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

```

