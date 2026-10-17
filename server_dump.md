# Matchalize — Server Codebase Dump

> Verbatim contents of all project source and configuration files.
> Generated 2026-10-17 20:14.
> Server source only. Excludes: .env, node_modules/, uploads/, dist/, build/, and package-lock.json.
> Matchalize is an INTRA + INTER college network for all the colleges of India: users connect within their own campus (intra) AND across campuses (inter). Every user signs in via their own college academic email system (`.ac.in`), making each campus a private, verified community.

> **This file is not paste-safe.** At this size a chat UI truncates the
> paste silently and the reader cannot tell what it lost. To share this
> codebase, paste `dumps/00-INDEX.md` and only the chunks you need.

## Section — Server Source

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
// ⚠️ EXPRESS 5 UPGRADE — two landmines in this file:
//
// 1. express-mongo-sanitize is Express-4-only. Installed here is ^2.2.0, whose
//    middleware reaches into connect's app/router internals that Express 5
//    removed. It will throw at boot, not degrade. Replace it with either
//    `express-mongo-sanitize` v3+ or a hand-rolled req.query/body scrubber
//    before bumping the major.
// 2. app.get('*') below is not a valid path pattern under Express 5 —
//    path-to-regexp v8 requires a named wildcard, so bare '*' throws
//    `TypeError: Missing parameter name` at startup. It must become '*splat'
//    (or '{*splat}' to also match the root path).
//
// Nothing here is broken today: installed express is 4.22.x. Both are only
// landmines for whoever runs `npm i express@5`.
import mongoSanitize from 'express-mongo-sanitize';
import { APP_CONSTANTS } from './config/appData.js';
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
const IS_DEV = NODE_ENV === 'development';
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
  if (!origin || IS_DEV) return callback(null, true);

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

// JSON bodies only. Photos/voice notes go through the multipart /api/upload
// route, which multer handles with its own fileSize limit — so 1mb is plenty
// for every text payload here (profiles, messages, prefs, onboarding answers).
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(mongoSanitize());

// Rate Limiting — reads APP_CONSTANTS so the settings file and the limiter agree.
const limiter = rateLimit({
  windowMs: APP_CONSTANTS.API_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: Number(process.env.API_GENERAL_MAX) || APP_CONSTANTS.API_RATE_LIMIT_MAX,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

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

// Serve client app for all non-API routes (SPA fallback)
// ⚠️ EXPRESS 5: bare '*' is invalid under path-to-regexp v8 and throws
// `Missing parameter name` at boot. Becomes app.get('*splat', ...) — or
// '{*splat}' if the root path must match too. See the note at the
// express-mongo-sanitize import above.
app.get('*', (req, res, next) => {
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
  },
  {
    timestamps: true,
  }
);

alignmentSchema.index({ users: 1, isActive: 1 });

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

// Onboarding analytics are write-only — nothing in this codebase reads them
// back, they're only inspected by hand in Atlas. So exactly one index, matching
// the one query that actually runs: the deleteMany({ user }) in
// routes/users.js that fires on every account deletion. Without it that is a
// full collection scan on each account removal.
//
// Deliberately NOT added:
//   - { event, createdAt } — for funnel reporting that does not exist.
//   - a TTL on createdAt  — this would permanently delete onboarding history
//     with no undo and no way to recover it. Retention is a product decision,
//     not a performance one; make it deliberately, not as a side effect of
//     adding indexes.
//
// Note: this schema carries two timestamps — the explicit `timestamp` field
// above and the automatic `createdAt`/`updatedAt` from `timestamps: true`. They
// differ by milliseconds. Left as-is because nothing reads either one today;
// if funnel reporting ever gets built, pick one before trusting the numbers.

analyticsSchema.index({ user: 1 });

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

### ./server/models/Message.js

```
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    alignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alignment',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'opening_letter', 'audio'],
      default: 'text',
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },
    clientMsgId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // ⚠️ DEPRECATED — `image` is a legacy duplicate of `mediaUrl`. Every writer used
    // to set both to the identical value, so ~half of each message's media bytes
// were stored twice and nothing read the copy. Writers no longer set it
    // (routes/messages.js, routes/discover.js, routes/notifications.js).
    //
    // It is KEPT in the schema on purpose: existing documents still carry a value
    // here, and the delete route reads `message.mediaUrl || message.image` so
    // old messages still get their Cloudinary asset destroyed. Dropping the
    // field is a separate change, to be done only after confirming no legacy
    // document has an empty mediaUrl.
    image: {
      type: String,
      default: '',
    },
    // The single source of truth for message media. Photos and voice notes both
    // live here; the client's type field decides which player to use.
    mediaUrl: {
      type: String,
      default: '',
    },
    // ⚠️ DEPRECATED — `caption` is a dead field. No route ever wrote a value here
    // and the client never read it; the caption under a photo is always rendered
    // from `text`. Retained so existing documents still load. The search route's
    // `caption` branch was removed too, since it could never match.
    caption: {
      type: String,
      default: '',
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'read'],
      default: 'sent',
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ alignmentId: 1, createdAt: 1 });
// 🚀 COLLISION-PROOF PAGINATION: Instant ObjectId-based cursor queries
messageSchema.index({ alignmentId: 1, _id: -1 });

// Speeds up moderation queries and global user cleanup operations
messageSchema.index({ senderId: 1, createdAt: -1 });
// 🔒 ONE opening letter per alignment, enforced at the DB level.
// Partial filter → normal text/image/audio messages are NOT affected
// (an alignment can still have thousands of those). This index is what makes
// the upserts in discover.js + notifications.js truly race-safe.
messageSchema.index(
  { alignmentId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'opening_letter' } }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;

```

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
  },
  {
    timestamps: true,
  }
);

// Extremely fast lookup for the active Instagram-style tray
notificationSchema.index({ recipientId: 1, isCleared: 1, createdAt: -1 });

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

### ./server/scripts/verify-location-swap.mjs

```
/**
 * Proves the location swap end to end against the real /api/discover route.
 *
 * The scenario: one viewer, registered at a Delhi college, who turns location
 * on while physically in Mumbai. Nothing about the viewer changes except their
 * coordinates, so the deck must flip from entirely-Delhi to entirely-Mumbai.
 *
 * The two clusters are ~1,400km apart, so this is not a re-ordering. If any
 * Delhi profile survives the second fetch, the session was not invalidated and
 * the feed is still serving the frozen first page.
 *
 * The test owns its viewer: it clears any stored position directly in the
 * database before it starts, and restores it with `$unset` (not
 * `$set: {field: undefined}`, which the driver writes as null) when it finishes.
 * Without that, a leftover reading from an earlier run silently invalidates the
 * scenario — the viewer is already in Mumbai, so there is nothing left to move.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: './.env' });

const PORT = process.env.PORT || 5005;
const BASE = `http://127.0.0.1:${PORT}/api`;
const MUMBAI = [19.1334, 72.9133];

const DELHI_MARK = ['Delhi', 'Jamia', 'IIT Delhi', 'Netaji', 'Indraprastha'];
const MUMBAI_MARK = ['Mumbai', 'Bombay', 'Veermata', 'Chemical Technology', 'Narsee',
  'Xavier', 'Sardar Patel', 'Bharatiya'];

async function fetchDeck(token) {
  const r = await fetch(`${BASE}/discover`, { headers: { Cookie: `matchalize_jwt=${token}` } });
  if (!r.ok) throw new Error(`GET /discover -> ${r.status} ${await r.text()}`);
  return r.json();
}

async function putLocation(token, body) {
  const r = await fetch(`${BASE}/users/location`, {
    method: 'PUT',
    headers: { Cookie: `matchalize_jwt=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

/** The state `GET /users/location` reports — the same signal the notice mounts on. */
async function readLocation(token) {
  const r = await fetch(`${BASE}/users/location`, { headers: { Cookie: `matchalize_jwt=${token}` } });
  if (!r.ok) throw new Error(`GET /users/location -> ${r.status}`);
  return r.json();
}

function classify(users) {
  const byCity = { delhi: 0, mumbai: 0, other: 0 };
  const colleges = new Map();
  const bands = new Map();
  for (const u of users) {
    const c = u.college || '(hidden)';
    colleges.set(c, (colleges.get(c) || 0) + 1);
    bands.set(u.distanceBand ?? 'unbanded', (bands.get(u.distanceBand ?? 'unbanded') || 0) + 1);
    if (DELHI_MARK.some((m) => c.includes(m))) byCity.delhi += 1;
    else if (MUMBAI_MARK.some((m) => c.includes(m))) byCity.mumbai += 1;
    else byCity.other += 1;
  }
  return { byCity, colleges, bands };
}

const fmt = (b) => [...b].map(([k, n]) => `${k}:${n}`).join('  ');
const top = (c, n = 4) => [...c].slice(0, n).map(([k, v]) => `${k} (${v})`).join(', ');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const viewerCode = process.env.VIEWER_COLLEGE || 'iitd';
  const viewer = await db.collection('users').findOne({ collegeCode: viewerCode, isOnboarded: true });
  if (!viewer) throw new Error(`no ${viewerCode} user seeded`);

  /* Own the starting state: no personal reading, campus basis, no saved deck. */
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $set: { locationSource: 'campus', locationUpdatedAt: new Date() }, $unset: { currentLatLng: 1 } },
  );
  await db.collection('discoversessions').deleteMany({ viewerId: viewer._id });

  const token = jwt.sign({ id: viewer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const fresh = await db.collection('users').findOne(
    { _id: viewer._id },
    { projection: { locationSource: 1, currentLatLng: 1 } },
  );

  console.log(`viewer   : ${viewer.name}  <${viewer.email}>`);
  console.log(`college  : ${viewer.college}`);
  console.log(`start    : source=${fresh.locationSource}  latLng=${JSON.stringify(fresh.currentLatLng ?? null)}`);

  // ── 1. campus fallback ──
  console.log('\n=== 1. LOCATION OFF — campus fallback to IIT Delhi ===');
  const first = await fetchDeck(token);
  const a = classify(first.users);
  console.log(`   deck size    : ${first.users.length}`);
  console.log(`   city split   : Delhi ${a.byCity.delhi}   Mumbai ${a.byCity.mumbai}   other ${a.byCity.other}`);
  console.log(`   top colleges : ${top(a.colleges)}`);
  console.log(`   bands        : ${fmt(a.bands)}`);

  // ── 2. same viewer, now standing in Mumbai ──
  console.log('\n=== 2. LOCATION ON — same viewer, standing in Mumbai ===');
  const put = await fetch(`${BASE}/users/location`, {
    method: 'PUT',
    headers: { Cookie: `matchalize_jwt=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ latLng: MUMBAI, source: 'gps' }),
  });
  const putBody = await put.json().catch(() => ({}));
  console.log(`   PUT /users/location -> ${put.status}  ${JSON.stringify(putBody)}`);

  const after = await db.collection('users').findOne(
    { _id: viewer._id },
    { projection: { locationSource: 1, currentLatLng: 1 } },
  );
  console.log(`   anchor in DB  : source=${after.locationSource} latLng=${JSON.stringify(after.currentLatLng)}`);

  const second = await fetchDeck(token);
  const b = classify(second.users);
  console.log(`   deck size    : ${second.users.length}`);
  console.log(`   city split   : Delhi ${b.byCity.delhi}   Mumbai ${b.byCity.mumbai}   other ${b.byCity.other}`);
  console.log(`   top colleges : ${top(b.colleges)}`);
  console.log(`   bands        : ${fmt(b.bands)}`);

  // ── 3. the anti-churn case ──
  console.log('\n=== 3. LOCATION ON but standing ON campus — deck must survive ===');
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $set: { locationSource: 'campus', locationUpdatedAt: new Date() }, $unset: { currentLatLng: 1 } },
  );
  await db.collection('discoversessions').deleteMany({ viewerId: viewer._id });
  const onCampusDeck = await fetchDeck(token);
  const c = classify(onCampusDeck.users);
  console.log(`   deck 3 city split : Delhi ${c.byCity.delhi}   Mumbai ${c.byCity.mumbai}   other ${c.byCity.other}`);

  const stayPut = await fetch(`${BASE}/users/location`, {
    method: 'PUT',
    headers: { Cookie: `matchalize_jwt=${token}`, 'Content-Type': 'application/json' },
    /* IIT Delhi's own campus position — a few km from where the viewer already
       is, well inside the 25km drift threshold. */
    body: JSON.stringify({ latLng: [28.5450, 77.1926], source: 'gps' }),
  });
  const stayBody = await stayPut.json().catch(() => ({}));
  const sessions = await db.collection('discoversessions').countDocuments({ viewerId: viewer._id });
  console.log(`   PUT same-campus coords -> ${stayPut.status}  ${JSON.stringify(stayBody)}`);
  console.log(`   saved sessions after   : ${sessions}  ${sessions === 1 ? '(kept)' : '(lost)'}`);

  // ── 4. one-time grant lapse ──
  console.log('\n=== 4. LAPSED ONE-TIME GRANT — released on the next launch ===');
  /* Reproduce the whole sequence the client performs on a launch:
     a position stored under a temporary grant, then that grant lapsing so the
     browser no longer has it. The expiry is a browser fact we cannot trigger
     from here, so the equivalent server-visible state is written directly — a
     stored `gps` reading that no longer has a live grant behind it. */
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $set: { locationSource: 'gps', currentLatLng: MUMBAI, locationUpdatedAt: new Date() } },
  );
  const held = await readLocation(token);
  console.log(`   before lapse : source=${held.locationSource} active=${held.active}`);

  /* What `releaseEphemeralLocation()` sends when the browser reports `prompt`. */
  const released = await putLocation(token, { latLng: null, source: null, ephemeral: true });
  const afterLapse = await readLocation(token);
  console.log(`   release call -> ${released.status} ${JSON.stringify(released.body)}`);
  console.log(`   after lapse  : source=${afterLapse.locationSource} active=${afterLapse.active}`);
  /* Read the coordinates straight from the database: the endpoint reports state,
     not storage, so it cannot prove the value is gone from the row. */
  const stored = await db.collection('users').findOne(
    { _id: viewer._id },
    { projection: { currentLatLng: 1 } },
  );
  const coordsGone = !Array.isArray(stored?.currentLatLng);
  console.log(`   coordinates removed from the row : ${coordsGone}`);

  const refusalDeck = await fetchDeck(token);
  const d = classify(refusalDeck.users);
  console.log(`   deck city split : Delhi ${d.byCity.delhi}   Mumbai ${d.byCity.mumbai}   other ${d.byCity.other}`);

  // ── assertions ──
  console.log('\n=== ASSERTIONS ===');
  const firstIds = new Set(first.users.map((u) => u._id || u.id));
  const overlap = second.users.filter((u) => firstIds.has(u._id || u.id)).length;
  const anchorIsMumbai = after.locationSource === 'gps'
    && Math.abs(after.currentLatLng[0] - MUMBAI[0]) <= 0.01
    && Math.abs(after.currentLatLng[1] - MUMBAI[1]) <= 0.01;

  const checks = [
    ['deck is populated both times', first.users.length > 0 && second.users.length > 0],
    ['deck 1 is Delhi-dominated', a.byCity.delhi > a.byCity.mumbai],
    ['deck 1 has zero Mumbai profiles', a.byCity.mumbai === 0],
    ['stored anchor is Mumbai GPS', anchorIsMumbai],
    ['route reports the deck was rebuilt', putBody.moved === true],
    ['deck 2 is Mumbai-dominated', b.byCity.mumbai >= 7],
    /* ⚠️ NOT "zero Delhi profiles" — that assertion was wrong and flaked.
     *
     * The cold-start reserve tops each page up from OUTSIDE the distance-ranked
     * batch, and that query filters only on `seenInBatch`, `skipSet`,
     * `excludedIds` and `isCold` — distance is deliberately not one of them.
     * Giving newcomers exposure regardless of where they are is the entire point
     * of the reserve, so a Delhi newcomer landing in a Mumbai page is correct
     * behaviour, roughly one card in ten by COLD_START_SHARE.
     *
     * The seed makes it easy to hit: a male viewer's eligible pool is 200, of
     * which only 62 are in Mumbai, so the reserve's over-fetch reaches Delhi
     * profiles readily. The contract worth asserting is that the DECK moved —
     * Mumbai-dominant, not Mumbai-exclusive. */
    ['deck 2 has at most reserved newcomers from Delhi', b.byCity.delhi <= 2],
    ['deck 2 is all in the near band', (b.bands.get('Near you') ?? 0) === second.users.length],
    ['deck 1 is all in the near band', (a.bands.get('Near you') ?? 0) === first.users.length],
    ['deck overlap is negligible', overlap <= 2],
    ['same-campus enable keeps the deck', stayBody.moved === false && sessions === 1],
    ['campus-only viewer stays Delhi-only', c.byCity.mumbai === 0],
    /* The lapse case. `active` is what decides which of the two notices renders,
       so it has to go false the moment the position is gone — otherwise the deck
       is campus-ordered while the UI still claims live location. */
    ['stored position was live before the lapse', held.active === true],
    /* The endpoint deliberately does NOT expose hasCoords — confirming a
       position exists is not something the client needs to be told, and the
       absence of one is already fully described by `active: false`. */
    ['lapse removes the coordinates from the row', coordsGone],
    ['lapse leaves the basis as campus, not null', afterLapse.locationSource === 'campus'],
    ['lapse reports NOT active (warning variant)', afterLapse.active === false],
    ['lapse does not report as a refusal', afterLapse.locationSource !== null],
    ['deck falls back to the campus ordering', d.byCity.delhi > 0 && d.byCity.mumbai === 0],
  ];
  let fail = 0;
  for (const [label, ok] of checks) {
    console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${label}`);
    if (!ok) fail += 1;
  }
  console.log(`\n   ${checks.length - fail}/${checks.length} passed`);

  // restore: `$unset`, because `$set: {currentLatLng: undefined}` writes null.
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $set: { locationSource: 'campus' }, $unset: { currentLatLng: 1 } },
  );
  await db.collection('discoversessions').deleteMany({ viewerId: viewer._id });
  await mongoose.disconnect();
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

### ./server/seedRealistic.js

```
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import College from './models/College.js';
import { computeScore } from './utils/ladder.js';

dotenv.config({ path: './.env' });

/**
 * 🛑 FAKE DATA IS NOT PRODUCTION DATA.
 *
 * This script generates invented people — names, photos from a stock image
 * service, bios, prompts — and DELETES every real user and college before doing
 * it. It is a local development convenience and nothing else.
 *
 * The guard below is deliberately at the very top and deliberately fatal. The
 * failure this prevents is not subtle: `deleteMany({})` runs against whatever
 * `MONGODB_URI` points at, so one `npm run seed` typed against a copied Atlas
 * string replaces a real cohort with imaginary students who will happily match
 * with, message, and report each other.
 *
 * Two independent conditions, so this cannot be undone by accident:
 *   1. NODE_ENV must not be 'production'.
 *   2. --allow-fake-data must be passed explicitly.
 *
 * Condition 2 exists because NODE_ENV is often unset in a local shell (it is
 * set in server/.env, which this script loads, but not in every environment
 * that can reach this file), and "unset" must not read as "fine".
 */
if (process.env.NODE_ENV === 'production') {
  console.error(
    '\n🛑 REFUSING TO RUN. NODE_ENV=production.\n\n' +
    '   This script deletes all users and colleges, then fills the database\n' +
    '   with invented profiles and stock photos. That is local development\n' +
    '   data. If it reached a deployed database, real students would be\n' +
    '   matching and messaging people who do not exist.\n\n' +
    '   If you genuinely need to reseed production, that is a decision that\n' +
    '   should not be made by a stray `npm run seed`.\n',
  );
  process.exit(1);
}

if (!process.argv.includes('--allow-fake-data')) {
  console.error(
    '\n🛑 REFUSING TO RUN without --allow-fake-data.\n\n' +
    '   This script DELETES every user and college in MONGODB_URI, then seeds\n' +
    '   invented profiles with stock photos.\n\n' +
    '   Check the database it is about to touch before agreeing:\n' +
    '     node server/seedRealistic.js --allow-fake-data\n',
  );
  process.exit(1);
}

/**
 * SEED — realistic population across three tiers.
 *
 * ── WHY THE CODES ARE LOWERCASE ──
 * `College.code` has `lowercase: true`, so Mongoose lowercases it on write. An
 * earlier seeder wrote `IITB` into `User.collegeCode`, and the discover
 * pipeline joins on `collegeCode -> College.code`. `'IITB' !== 'iitb'`, so the
 * $lookup missed for 600 of 602 users: `$_c` came back empty, `_lat1/_lng1`
 * fell through to the (0,0) placeholder in the Gulf of Guinea, every candidate
 * landed in band 3 at 0.1x, and distance ranking was silently meaningless for
 * the entire seeded population.
 *
 * That is why `collegeCode` is derived from `College.code` below and never
 * typed by hand. Every user row is `c.code.toLowerCase()`.
 *
 * ── WHY FULL OFFICIAL NAMES ──
 * `College` has ONE `name` field and no short-name field anywhere, so an
 * abbreviation in the data is the only name that can ever be displayed — on the
 * card, in search results, and in the location notice ("Sorted according to
 * <name>"). "SPIT Andheri" is therefore not a cosmetic choice; it is the whole
 * string users would see.
 */

const CLUSTERS = {
  delhi: {
    label: 'Delhi',
    colleges: [
      ['iitd', 'Indian Institute of Technology Delhi', 28.5450, 77.1926, 'iitd.ac.in', 'New Delhi', 'Delhi'],
      ['dtu', 'Delhi Technological University', 28.5614, 77.2731, 'dtu.ac.in', 'Delhi', 'Delhi'],
      ['dtu-rohini', 'Delhi Technological University, Rohini Campus', 28.7412, 77.1376, 'dtu.ac.in', 'Rohini', 'Delhi'],
      ['nsut', 'Netaji Subhas University of Technology', 28.5480, 77.2730, 'nsut.ac.in', 'Delhi', 'Delhi'],
      ['ip', 'Indraprastha College of Engineering and Technology', 28.5455, 77.2725, 'ip.ac.in', 'Delhi', 'Delhi'],
      ['jmi', 'Jamia Millia Islamia', 28.5614, 77.2916, 'jmi.ac.in', 'Delhi', 'Delhi'],
    ],
  },
  mumbai: {
    label: 'Mumbai',
    colleges: [
      ['iitb', 'Indian Institute of Technology Bombay', 19.1334, 72.9133, 'iitb.ac.in', 'Mumbai', 'Maharashtra'],
      ['spit', 'Sardar Patel Institute of Technology', 19.1196, 72.8464, 'spit.ac.in', 'Andheri West', 'Maharashtra'],
      ['bvcoe', 'Bharatiya Vidya Bhavans College of Engineering', 19.1196, 72.8464, 'bvu.ac.in', 'Andheri West', 'Maharashtra'],
      ['nmims', 'Narsee Monjee Institute of Management Studies', 19.1000, 72.8400, 'nmims.edu', 'Vile Parle West', 'Maharashtra'],
      ['vjti', 'Veermata Jijabai Technological Institute', 19.0222, 72.8561, 'vjti.ac.in', 'Matunga', 'Maharashtra'],
      ['ict', 'Institute of Chemical Technology, Mumbai', 19.0235, 72.8357, 'ictmumbai.edu.in', 'Matunga', 'Maharashtra'],
      ['xavier', 'Saint Xavier College, Mumbai', 18.9430, 72.8315, 'xavier.ac.in', 'Mumbai', 'Maharashtra'],
      ['univ-mumbai', 'University of Mumbai', 18.9647, 72.8106, 'mumbai.ac.in', 'Mumbai', 'Maharashtra'],
    ],
  },
  /* Near Mumbai but outside 30km, so band 2 and band 3 are genuinely exercised
     rather than every non-local candidate sitting in band 4. */
  pune: {
    label: 'Pune / Nashik',
    colleges: [
      ['coep', 'College of Engineering, Pune', 18.5293, 73.8565, 'coeptech.ac.in', 'Pune', 'Maharashtra'],
      ['pict', 'Pune Institute of Chemical Technology', 18.4575, 73.8508, 'pict.edu', 'Pune', 'Maharashtra'],
      ['sit-lon', 'Sinhgad Institute of Technology and Management, Lonavala', 18.7516, 73.4286, 'sit.ac.in', 'Lonavala', 'Maharashtra'],
      ['kkwagh', 'K. K. Wagh Institute of Engineering and Technology', 20.0117, 73.8236, 'kkwagh.edu.in', 'Nashik', 'Maharashtra'],
    ],
  },
  nationwide: {
    label: 'Nationwide',
    colleges: [
      ['iitkp', 'Indian Institute of Technology Kharagpur', 22.3197, 87.3100, 'iitkgp.ac.in', 'Kharagpur', 'West Bengal'],
      ['iitm', 'Indian Institute of Technology Madras', 12.9915, 80.2336, 'iitm.ac.in', 'Chennai', 'Tamil Nadu'],
      ['iitk', 'Indian Institute of Technology Kanpur', 26.5114, 80.2349, 'iitk.ac.in', 'Kanpur', 'Uttar Pradesh'],
      ['iitg', 'Indian Institute of Technology Guwahati', 26.1872, 91.6917, 'iitg.ac.in', 'Guwahati', 'Assam'],
      ['iitr', 'Indian Institute of Technology Roorkee', 29.8644, 77.8964, 'iitr.ac.in', 'Roorkee', 'Uttarakhand'],
      ['iiith', 'Indian Institute of Technology Hyderabad', 17.4928, 78.1378, 'iith.ac.in', 'Hyderabad', 'Telangana'],
      ['iitgn', 'Indian Institute of Technology Gandhinagar', 23.2114, 72.6821, 'iitgn.ac.in', 'Gandhinagar', 'Gujarat'],
      ['iiti', 'Indian Institute of Technology Indore', 22.5279, 75.9236, 'iiti.ac.in', 'Indore', 'Madhya Pradesh'],
      ['iitj', 'Indian Institute of Technology Jodhpur', 26.4750, 73.1150, 'iitj.ac.in', 'Jodhpur', 'Rajasthan'],
      ['iitmandi', 'Indian Institute of Technology Mandi', 31.7717, 76.9836, 'iitmandi.ac.in', 'Mandi', 'Himachal Pradesh'],
      ['iitp', 'Indian Institute of Technology Patna', 25.5325, 84.8517, 'iitp.ac.in', 'Patna', 'Bihar'],
      ['iitrp', 'Indian Institute of Technology Ropar', 30.9716, 76.4732, 'iitrpr.ac.in', 'Ropar', 'Punjab'],
      ['iitbbs', 'Indian Institute of Technology Bhubaneswar', 20.3030, 85.8240, 'iitbbs.ac.in', 'Bhubaneswar', 'Odisha'],
      ['iittp', 'Indian Institute of Technology Tirupati', 13.7144, 79.5953, 'iittp.ac.in', 'Tirupati', 'Andhra Pradesh'],
      ['iitpk', 'Indian Institute of Technology Palakkad', 10.7939, 76.8267, 'iitpkd.ac.in', 'Palakkad', 'Kerala'],
      ['iitdh', 'Indian Institute of Technology Dharwad', 15.4874, 74.9345, 'iitdh.ac.in', 'Dharwad', 'Karnataka'],
      ['iitbh', 'Indian Institute of Technology Bhilai', 21.2446, 81.3182, 'iitbh.ac.in', 'Bhilai', 'Chhattisgarh'],
      ['iitgoa', 'Indian Institute of Technology Goa', 15.4230, 73.9800, 'iitgoa.ac.in', 'Goa', 'Goa'],
      ['iitjammu', 'Indian Institute of Technology Jammu', 32.8037, 74.8959, 'iitjammu.ac.in', 'Jammu', 'Jammu and Kashmir'],
      ['vnit', 'Visvesvaraya National Institute of Technology, Nagpur', 21.1233, 79.0515, 'vnit.ac.in', 'Nagpur', 'Maharashtra'],
      /* No coordinates on purpose. Exercises the un-positioned-campus path: it
         must render band 3 with no label rather than throwing the aggregation
         down, which is what took the whole deck offline once. */
      ['ghost', 'Institute of Emerging District Technologies', null, null, 'iedt.ac.in', 'Gandhinagar', 'Gujarat'],
    ],
  },
};

const ALL = Object.values(CLUSTERS).flatMap((c) => c.colleges);

const POPULATION = {
  delhi: 400,
  mumbai: 400,
  nationwide: 400,
};

const INTENTS = ['Dating', 'Friends', 'Activity Partner'];
const FIRST_M = ['Aarav', 'Aditya', 'Arjun', 'Devansh', 'Ishaan', 'Kabir', 'Krish', 'Neel', 'Rohan', 'Shaan', 'Ved', 'Yash', 'Ayaan', 'Dhruv', 'Kian', 'Vihaan'];
const FIRST_F = ['Aanya', 'Diya', 'Ira', 'Kiara', 'Myra', 'Navya', 'Riya', 'Saisha', 'Tara', 'Zara', 'Anika', 'Kavya', 'Meera', 'Nitya', 'Prisha'];
const FIRST_NB = ['Alex', 'Avery', 'Casey', 'Jordan', 'Morgan', 'Riley', 'Sahil', 'Quinn'];
const LAST = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Joshi', 'Shah', 'Desai', 'Patil', 'Rao', 'Menon', 'Chowdhury'];
const BIOS = [
  'Coffee addict, sunset chaser.',
  'Late-night coder. Usually arguing with a compiler.',
  'Hiker, foodie, and dog person. Ask me trails.',
  'Bookworm. Tea over coffee, mostly.',
  'Travel junkie with a camera I do not know how to use.',
  'Gym rat. Protein shake connoisseur.',
  'Sarcasm fluent. Opinions available on request.',
  'Plant parent. Currently losing a war with a fern.',
  'Midnight thinker. Somehow functional in the morning.',
  'Gamer and part-time ramen critic.',
];
const PROMPTS = [
  ['Your ideal Sunday?', 'Sleeping till noon, then pancakes.'],
  ['Song on repeat?', 'Anything by Divine, honestly.'],
  ['Best travel memory?', 'Sunset at Marine Drive with bad chai.'],
  ['Go-to comfort food?', 'Butter chicken, no contest.'],
  ['A skill you want to learn?', 'Surfing. Still have not managed it.'],
  ['Morning person or night owl?', 'Night owl. Firmly.'],
  ['One thing you are good at?', 'Finding the one good seat in a lecture hall.'],
  ['Guilty pleasure show?', 'The Office. For the ninth time.'],
];
const PHOTOS_M = [
  'photo-1507003211169-0a1dd7228f2d', 'photo-1500648767791-00dcc994a43e',
  'photo-1472099645785-5658abf4ff4e', 'photo-1506794778202-cad84cf45f1d',
  'photo-1519085360753-af0119f7cbe7', 'photo-1531384441138-2736e62e0919',
];
const PHOTOS_F = [
  'photo-1494790108377-be9c29b29330', 'photo-1438761681033-6461ffad8d80',
  'photo-1534528741775-53994a69daeb', 'photo-1531746020798-e6953c6e8e04',
  'photo-1544005313-94ddf0286523', 'photo-1488426862026-3ee34a7d66df',
];
const PHOTOS_NB = [
  'photo-1535713875002-d1d0cf377fde', 'photo-1529665253569-6d01c0e87baf',
  'photo-1517841905240-472988babdf9', 'photo-1524504388940-b1c1722653e1',
];
const R2 = () => (Math.random() + Math.random()) / 2;

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => ({ v, k: Math.random() })).sort((x, y) => x.k - y.k).map((x) => x.v);
const sub = (a, n) => shuffle(a).slice(0, Math.max(0, n));
const uniq = (a) => [...new Set(a)];

/**
 * Gender split, scaled from the previous 600-user population (456 / 100 / 44)
 * up to 1,200 so the ratio holds: ~76.7% male, ~16.7% female, ~6.7% non-binary.
 *
 * The ratio is not cosmetic — `interestedIn` is derived from gender, so a skewed
 * population starves the mutual-Align path. A female-heavy pool matches far
 * fewer male viewers, and the match test then fails for reasons that look like
 * a bug in the Align logic.
 */
const GENDER_PLAN = [['Male', 920], ['Female', 200], ['Non-binary', 80]];
const GENDERS = (() => {
  const out = GENDER_PLAN.flatMap(([g, n]) => Array(n).fill(g));
  return shuffle(out);
})();

const photoPool = (g) => (g === 'Male' ? PHOTOS_M : g === 'Female' ? PHOTOS_F : PHOTOS_NB);

function buildUser(gender, college, i) {
  const first = gender === 'Male' ? pick(FIRST_M) : gender === 'Female' ? pick(FIRST_F) : pick(FIRST_NB);
  const name = `${first} ${pick(LAST)}`;
  const domain = college[4];

  /* Photo count drives the ladder score, which is what the newcomer reserve and
     the blended ranking both read. 15% get none so the reserve has something
     real to promote. */
  const pool = photoPool(gender);
  const photoRoll = R2();
  const photoCount = photoRoll < 0.15 ? 0 : photoRoll < 0.40 ? 1 : photoRoll < 0.75 ? 2 : 4;
  const photos = sub(pool, photoCount).map(
    (id) => `https://images.unsplash.com/${id}?w=600&auto=format&fit=crop&q=80`,
  );

  const promptCount = photoRoll < 0.30 ? 0 : photoRoll < 0.60 ? 1 : 3;
  const prompts = sub(PROMPTS, promptCount).map(([question, answer]) => ({ question, answer }));

  /* ── LOCATION ──
     40% fresh GPS, 30% stale GPS (past the 30-day TTL, so the candidate-side
     freshness gate falls through to college coordinates), 30% campus-only (no
     coordinates at all — exercises the fallback itself). */
  const locRoll = R2();
  let locationSource = 'campus';
  let currentLatLng = undefined;
  let locationUpdatedAt = null;

  if (college[2] !== null) {
    if (locRoll < 0.40) {
      currentLatLng = [
        college[2] + (Math.random() - 0.5) * 0.02,
        college[3] + (Math.random() - 0.5) * 0.02,
      ];
      locationSource = 'gps';
      locationUpdatedAt = new Date();
    } else if (locRoll < 0.70) {
      currentLatLng = [
        college[2] + (Math.random() - 0.5) * 0.02,
        college[3] + (Math.random() - 0.5) * 0.02,
      ];
      locationSource = 'gps';
      locationUpdatedAt = new Date(Date.now() - (45 + Math.floor(Math.random() * 45)) * 86400000);
    }
  }

  const user = {
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}.${1000 + i}@${domain}`,
    /* Display name, full official form. This is the string that reaches the
       card, the search result and the location notice. */
    college: college[1],
    /* Match key. From the roster, never hand-typed — see the file header. */
    collegeCode: college[0].toLowerCase(),
    gender,
    year: pick(['FE', 'SE', 'TE', 'BE']),
    intent: sub(INTENTS, 1 + Math.floor(R2() * 3)),
    interestedIn: gender === 'Male'
      ? (Math.random() < 0.7 ? ['Female'] : ['Female', 'Everyone'])
      : gender === 'Female'
        ? (Math.random() < 0.7 ? ['Male'] : ['Male', 'Everyone'])
        : ['Everyone'],
    photos,
    prompts,
    bio: Math.random() < 0.7 ? pick(BIOS) : '',
    isOnboarded: true,
    isVerified: true,
    isDeleted: false,
    suspended: false,
    showCollege: Math.random() < 0.92,
    locationSource,
    currentLatLng,
    locationUpdatedAt,
    lastActive: new Date(Date.now() - Math.floor(R2() * 90) * 86400000),
  };
  user.profileScore = computeScore(user);
  return user;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set. Refusing to seed an unknown database.');
    console.error('   Set it in server/.env. NOTE: this script DELETES all users and colleges.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log('── Clearing ──');
  await User.deleteMany({});
  await College.deleteMany({});
  console.log('   users and colleges cleared');

  console.log('\n── Colleges ──');
  const roster = [];
  for (const cluster of Object.values(CLUSTERS)) {
    for (const c of cluster.colleges) {
      roster.push({
        code: c[0].toLowerCase(),
        name: c[1],
        domains: [c[4]],
        city: c[5],
        state: c[6],
        country: 'India',
        active: true,
        ...(c[2] !== null ? { latLng: [c[2], c[3]] } : {}),
      });
    }
  }
  await College.insertMany(roster);
  console.log(`   ${roster.length} colleges inserted (all codes lowercase)`);

  console.log('\n── Users ──');
  const users = [];
  let emailN = 0;
  for (const [key, count] of Object.entries(POPULATION)) {
    const colleges = CLUSTERS[key].colleges;
    for (let i = 0; i < count; i++) {
      /* Weighted so a handful of campuses carry the bulk and the rest stay
         small — that is what a real city looks like, and it is what makes the
         own-college cap observable. */
      const roll = Math.random();
      const college = roll < 0.30 ? colleges[0] : roll < 0.50 ? colleges[1] : pick(colleges);
      users.push(buildUser(GENDERS[users.length], college, emailN++));
    }
    console.log(`   ${String(count).padStart(4)}  ${CLUSTERS[key].label} (${colleges.length} colleges)`);
  }
  await User.insertMany(users);
  console.log(`   ${users.length} users inserted`);

  // ── verify ──
  const codes = await db.collection('colleges').distinct('code');
  const matched = await db.collection('users').countDocuments({ collegeCode: { $in: codes } });
  const scores = await db.collection('users').aggregate([
    { $bucket: { groupBy: '$profileScore', boundaries: [0, 45, 75, 100, 101], default: 'other', output: { n: { $sum: 1 } } } },
  ]).toArray();
  const loc = await db.collection('users').aggregate([
    {
      $group: {
        _id: {
          source: '$locationSource',
          fresh: { $gte: ['$locationUpdatedAt', new Date(Date.now() - 30 * 86400000)] },
        },
        n: { $sum: 1 },
      },
    },
  ]).toArray();
  const genders = await db.collection('users').aggregate([{ $group: { _id: '$gender', n: { $sum: 1 } } }]).toArray();

  console.log('\n── Verify ──');
  console.log(`   college lookup matches : ${matched}/${users.length}   ${matched === users.length ? 'PASS' : 'FAIL'}`);
  console.log(`   score bands            : ${scores.map((s) => `${s._id}:${s.n}`).join('  ')}`);
  console.log(`   location source        : ${loc.map((l) => `${l._id.source}${l._id.fresh ? ' fresh' : ' stale'}:${l.n}`).join('  ')}`);
  console.log(`   gender                 : ${genders.map((g) => `${g._id}:${g.n}`).join('  ')}`);

  const bad = await db.collection('users').aggregate([
    { $match: { college: { $regex: '^(IIT|SPIT|NMIMS|VJTI|PICT|KKWAGH|VNIT|XAVIER|COEP)' } } },
    { $count: 'n' },
  ]).toArray();
  console.log(`   abbreviated names      : ${bad[0]?.n ?? 0}   ${!bad.length ? 'PASS' : 'FAIL — check the roster'}`);

  await mongoose.disconnect();
  console.log('\n   done');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

### ./server/socket/chat.js

```
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Alignment from '../models/Alignment.js';
import Message from '../models/Message.js';
import { areBlocked } from '../middleware/blockFilter.js';
import { APP_CONSTANTS } from '../config/appData.js';

const onlineUsers = new Map(); // userId -> Set<socketId>

// How often to re-check suspension/deletion status from the DB per connected socket.
const SUSPENSION_CHECK_INTERVAL = 60 * 1000;

/**
 * Parse a raw cookie header string into a { name: value } map.
 */
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((pair) => {
    const [name, ...rest] = pair.split('=');
    if (name) cookies[name.trim()] = rest.join('=').trim();
  });
  return cookies;
};

export const socketHandler = (io) => {
  // ─── MIDDLEWARE 1: Auth (runs at connect/handshake) ───
  io.use(async (socket, next) => {
    try {
      let token = null;
      const cookies = parseCookies(socket.handshake.headers.cookie);
      if (cookies[APP_CONSTANTS.AUTH_COOKIE_NAME]) {
        token = cookies[APP_CONSTANTS.AUTH_COOKIE_NAME];
      } else {
        token = socket.handshake.auth.token || socket.handshake.query.token;
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // ─── MIDDLEWARE 2: Connect-time suspension check ───
  // Blocks suspended/deleted users from establishing a connection at all.
  // NOTE: io.use() runs only during the handshake — per-event enforcement
  // for already-connected sockets lives in socket.use() inside the connection handler.
  io.use(async (socket, next) => {
    try {
      const user = await User.findById(socket.user._id)
        .select('suspended isDeleted')
        .lean();

      if (!user || user.isDeleted || user.suspended) {
        return next(new Error(user?.suspended ? 'Account suspended' : 'Account unavailable'));
      }

      next();
    } catch (err) {
      console.error('Suspension check error:', err);
      next(); // Let it pass on DB error — don't lock everyone out
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(userId);
    console.log(`User connected: ${socket.user.name} (${userId})`);

    // ─── CACHED SUSPENSION STATE ───
    // Middleware 2 already verified the user is clean at connect time, so the
    // cache starts clean. socket.data is Socket.IO's standard per-socket store.
    socket.data.suspended = false;
    socket.data.deleted = false;
    socket.data.lastSuspensionCheck = Date.now();

    // ─── PER-EVENT SUSPENSION CHECK (CACHED) ───
    // Runs before EVERY inbound event on an already-connected socket, but only
    // hits MongoDB once per SUSPENSION_CHECK_INTERVAL per user. Mid-session
    // suspensions are caught on the first event after the interval elapses;
    // admin kicks stay instant (admin.js emits force-disconnect directly).
    socket.use(async (packet, next) => {
      try {
        // Refresh only when the TTL has elapsed — no DB hit on most events.
        if (Date.now() - socket.data.lastSuspensionCheck > SUSPENSION_CHECK_INTERVAL) {
          const user = await User.findById(userId)
            .select('suspended isDeleted')
            .lean();
          socket.data.lastSuspensionCheck = Date.now();
          socket.data.deleted = !user || user.isDeleted;
          socket.data.suspended = !!user?.suspended;
        }

        if (socket.data.deleted || socket.data.suspended) {
          socket.emit('force-disconnect', {
            reason: socket.data.suspended ? 'Account suspended' : 'Account unavailable',
          });
          socket.disconnect(true);
          return next(new Error('Account suspended or deleted'));
        }

        next();
      } catch (err) {
        console.error('Suspension check error:', err);
        next(); // Fail open on DB error — keep cached state, don't lock everyone out
      }
    });

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec()
      .catch(err => console.error('Failed to update lastActive:', err));

    socket.on('join-alignment', async (alignmentId) => {
      if (!alignmentId || typeof alignmentId !== 'string') return;

      try {
        const match = await Alignment.findOne({ _id: alignmentId, users: userId, isActive: true });
        if (!match) return socket.emit('error', { message: 'Not authorized for this alignment' });

        const otherUserId = match.users.find(u => u.toString() !== userId);
        if (otherUserId && await areBlocked(userId, otherUserId)) {
          return socket.emit('error', { message: 'Cannot join chat — user is blocked' });
        }
      } catch (err) {
        console.error('join-alignment validation error:', err);
        return;
      }

      socket.join(alignmentId);
      io.to(alignmentId).emit('online-update', {
        userId,
        online: true,
        lastActive: new Date().toISOString(),
      });
    });

    // 🛡️ PAYLOAD SHAPE IS ATTACKER-CONTROLLED
    // `socket.emit('typing')` with no argument is a valid Socket.IO frame:
    // packet.data becomes [], dispatch passes `undefined`, and destructuring
    // `({ alignmentId })` from undefined throws a TypeError. Socket.IO
    // dispatches with no try/catch, so that TypeError escapes into a
    // process.nextTick and becomes an uncaughtException — which index.js
    // handles by calling process.exit(1). One malformed packet from any
    // authenticated socket takes the entire server down.
    //
    // Every handler below therefore takes the raw payload and pulls fields off
    // it with optional access, so a missing/wrong-shaped field is ignored and
    // logged instead of fatal.

    socket.on('typing', (payload) => {
      const alignmentId = payload?.alignmentId;
      if (!alignmentId || typeof alignmentId !== 'string') return;
      // Authorized at join-alignment; room membership replaces the per-keystroke DB query
      if (!socket.rooms.has(alignmentId)) return;
      socket.to(alignmentId).emit('user-typing', { userName: socket.user.name });
    });

    socket.on('stop-typing', (payload) => {
      const alignmentId = payload?.alignmentId;
      if (!alignmentId || typeof alignmentId !== 'string') return;
      if (!socket.rooms.has(alignmentId)) return;
      socket.to(alignmentId).emit('user-stop-typing');
    });

    socket.on('check-online', async (payload) => {
      // Read inside the try: destructuring used to happen in the parameter list,
      // where a missing payload threw before any guard could run.
      const alignmentId = payload?.alignmentId;
      const targetUserId = payload?.targetUserId;
      try {
        if (!alignmentId || !targetUserId) return;

        // 🔒 STALKING PREVENTION: Verifies active alignment membership before disclosing online activity
        const validMatch = await Alignment.findOne({
          _id: alignmentId,
          users: { $all: [userId, targetUserId] },
          isActive: true,
        });

        if (!validMatch) return; // Silently drop unauthorized stalking queries

        const isOnline = onlineUsers.has(targetUserId) && onlineUsers.get(targetUserId).size > 0;
        const targetUser = await User.findById(targetUserId).select('lastActive');
        socket.emit('online-status', {
          userId: targetUserId,
          online: isOnline,
          lastActive: targetUser?.lastActive,
        });
      } catch (err) {
        console.error('check-online error:', err);
      }
    });

    socket.on('read-messages', async (payload) => {
      const alignmentId = payload?.alignmentId;
      if (!alignmentId || typeof alignmentId !== 'string') return;

      // Validate alignment membership
      try {
        const match = await Alignment.findOne({ _id: alignmentId, users: userId, isActive: true });
        if (!match) return;

        await Message.updateMany(
          { alignmentId, senderId: { $ne: userId }, readAt: null },
          { $set: { readAt: new Date(), deliveryStatus: 'read' } }
        );
        socket.to(alignmentId).emit('messages-read', { readerId: userId });
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);

      // Multi-device: remove this socket, keep others
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }

      // Skip entirely if we're already shutting down — mongoose is closing, so
      // this fire-and-forget write could only fail.
      if (mongoose.connection.readyState === 1) {
        User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec()
          .catch((err) => {
            // Expected during shutdown: the pool closed under an in-flight
            // write. Not worth a stack trace on every deploy.
            if (err?.name !== 'MongoClientClosedError') {
              console.error('Failed to update lastActive:', err);
            }
          });
      }

      // Only emit offline if no other sockets for this user
      const stillOnline = onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
      if (!stillOnline) {
        for (const [room] of socket.rooms) {
          if (room !== socket.id) {
            io.to(room).emit('user-stop-typing', { userId });
            io.to(room).emit('online-update', {
              userId,
              online: false,
              lastActive: new Date().toISOString(),
            });
          }
        }
      }
    });
  });
};

```

### ./server/utils/AppError.js

```
export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

```

### ./server/utils/campusGate.js

```
/**
 * 🚪 CAMPUS GATE — which campuses may currently sign up.
 *
 * The closed, verified-student network is only meaningful if the gate is
 * actually closed. An IIT Bombay pilot has no use for a student from another
 * campus: the entire product thesis is a dense, verified pool, and one
 * outsider in a small pool is a stranger, not a feature.
 *
 * Two independent mechanisms exist, and it is worth being precise about why
 * BOTH are needed rather than either:
 *
 *   1. This gate (`ALLOWED_COLLEGES`). An allow-list applied at the point a
 *      signup is authorised — `resolveCollege()` in routes/auth.js. This is the
 *      security control. It does not care what the database contains.
 *
 *   2. `College.active` in the database, which decides what the picker shows.
 *
 * The reason this is not just "set every other college inactive" is that the
 * database is mutable at runtime: an operator can activate a campus from
 * /admin, or approve a CollegeRequest, and the pilot gate would silently stop
 * applying. This file is configuration — it only changes when someone edits
 * the environment and redeploys — so it is the layer that cannot be talked out
 * of its job by a click in the admin panel.
 *
 * ── WHY AN ALLOW-LIST AND NOT A BLOCK-LIST ───────────────────────────────────
 * A block-list ("these campuses are closed") has to be updated every time a new
 * campus is added, and the failure mode is opening the gate: forget the entry,
 * and the campus is quietly live. An allow-list fails closed instead — an
 * unlisted campus is refused, so the mistake costs you one new user rather than
 * an unintended public launch.
 *
 * ── UNSET MEANS OPEN ────────────────────────────────────────────────────────
 * With no `ALLOWED_COLLEGES` set, every active college can sign up. That is
 * the pre-pilot behaviour and it is the correct default for local development,
 * where seeding one college and pointing the picker at it is already the
 * intended workflow. The gate is opt-IN, so a developer who never hears of it
 * gets a working app rather than a confusing one.
 */

/**
 * The parsed allow-list, or null when no gate is configured.
 *
 * Normalised on read rather than at module load, because a test that mutates
 * `process.env` between cases would otherwise read a stale snapshot frozen at
 * import time. The cost is trivial: the list is a handful of strings and this
 * is called on signup, not on a hot path.
 *
 * @returns {Set<string>|null} lowercased college codes, or null when open
 */
export const getAllowedColleges = () => {
  const raw = process.env.ALLOWED_COLLEGES;

  // Empty string and whitespace both mean "not configured". An operator who
  // blanks the variable expects the app to behave as it did before, not to
  // lock every student out of a campus they never named.
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;

  const codes = String(raw)
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  // A variable containing only separators (" ,, ") parses to an empty list.
  // That is NOT the same as unset: returning null here would open the gate
  // when the operator clearly intended to restrict it. An empty set closes it.
  return new Set(codes);
};

/**
 * @param {string} collegeCode
 * @returns {boolean} true when this college may sign up (always true when no
 *                    gate is configured)
 */
export const isCollegeAllowed = (collegeCode) => {
  const allowed = getAllowedColleges();
  if (allowed === null) return true;
  return allowed.has(String(collegeCode || '').trim().toLowerCase());
};

/**
 * The message a student sees when their campus is outside the gate.
 *
 * Deliberately does NOT say "this app is invite-only" or "not available in your
 * region". It tells them what to do: use the college email and try again, or
 * that their campus is not yet open. Naming a hard boundary invites people to
 * look for a way around it; naming the next step does not.
 */
export const COLLEGE_GATE_MESSAGE =
  'Sign-ups for your college are not open yet. If you have a college email address, please try again.';

/**
 * Build the Mongo filter fragment that limits a college query to the gate.
 *
 * Used by the two list endpoints so the picker only ever shows colleges a
 * student could actually verify against. Showing a selectable campus that
 * signup then rejects is the worst version of this: the student picks it,
 * types their real college email, and is told no at the last step.
 *
 * @returns {{code?: {$in: string[]}}} `{}` when the gate is open
 */
export const collegeGateFilter = () => {
  const allowed = getAllowedColleges();
  if (allowed === null) return {};
  return { code: { $in: [...allowed] } };
};
```

### ./server/utils/campusSeed.js

```
import mongoose from 'mongoose';
import College from '../models/College.js';
import { getAllowedColleges } from './campusGate.js';

/**
 * 🏫 BOOT-TIME CAMPUS SEED.
 *
 * Why this exists: on a free Render plan there is no shell, so there is no way
 * to run a script against the database the first time. That collides with the
 * app's own design — the college picker reads from the `colleges` collection,
 * so an empty database means an empty picker, which means no signup, which
 * means there is no account that could ever reach /admin to add the first
 * college. The two halves each need the other to exist first.
 *
 * Seeding at boot breaks that cycle: the service comes up with a usable campus
 * already present, and /admin becomes reachable the moment an operator logs in.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ────────────────────────────────────────
 * It inserts MISSING colleges only. It never updates or overwrites an existing
 * row, because an existing row means an operator has already seen it and may
 * have corrected its name, domains or coordinates from /admin. A boot seed that
 * "ensured" its own values would silently undo that edit on every deploy — and
 * it would do it silently, which is the worst time for it to happen.
 *
 * ── WHY IT IS TIED TO ALLOWED_COLLEGES ──────────────────────────────────────
 * The catalogue below is a fixed list of real campuses, but seeding them all
 * would repopulate a picker that is meant to show one campus during the pilot.
 * Reading the gate means the set of campuses that exists and the set that can
 * sign up can never drift apart: open a campus by adding its code to
 * ALLOWED_COLLEGES, and it exists. Nothing else to remember.
 */

/**
 * Known campuses, keyed by `College.code`.
 *
 * Domains are the whole verification mechanism, so they must be the real
 * institutional domains — `iitb.ac.in` covers every department address via
 * exact-or-subdomain matching (see utils/collegeDomain.js), so no per-department
 * list is needed.
 *
 * latLng is the campus location, not a student's: it is a building's published
 * coordinates and carries none of the privacy weight of User.currentLatLng.
 * Optional in the schema — without it, students at that campus simply rank as
 * "unknown location" rather than being guessed at.
 */
const CATALOGUE = {
  iitb: {
    name: 'Indian Institute of Technology Bombay',
    domains: ['iitb.ac.in'],
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    latLng: [19.124, 72.914],
  },
  iitd: {
    name: 'Indian Institute of Technology Delhi',
    domains: ['iitd.ac.in'],
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    latLng: [28.545, 77.192],
  },
  iitk: {
    name: 'Indian Institute of Technology Kanpur',
    domains: ['iitk.ac.in'],
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    country: 'India',
    latLng: [26.487, 80.331],
  },
  iitkgp: {
    name: 'Indian Institute of Technology Kharagpur',
    domains: ['iitkgp.ac.in'],
    city: 'Kharagpur',
    state: 'West Bengal',
    country: 'India',
    latLng: [22.256, 87.232],
  },
  iitm: {
    name: 'Indian Institute of Technology Madras',
    domains: ['iitm.ac.in'],
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    latLng: [12.991, 80.235],
  },
  iitr: {
    name: 'Indian Institute of Technology Roorkee',
    domains: ['iitr.ac.in'],
    city: 'Roorkee',
    state: 'Uttarakhand',
    country: 'India',
    latLng: [29.869, 80.312],
  },
  iitg: {
    name: 'Indian Institute of Technology Guwahati',
    domains: ['iitg.ac.in'],
    city: 'Guwahati',
    state: 'Assam',
    country: 'India',
    latLng: [26.144, 91.736],
  },
  iith: {
    name: 'Indian Institute of Technology Hyderabad',
    domains: ['iith.ac.in'],
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    latLng: [17.593, 78.271],
  },
  iitbhu: {
    name: 'Indian Institute of Technology (BHU) Varanasi',
    domains: ['iitbhu.ac.in'],
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    country: 'India',
    latLng: [25.135, 83.0],
  },
  iitism: {
    name: 'Indian Institute of Technology (ISM) Dhanbad',
    domains: ['iitism.ac.in'],
    city: 'Dhanbad',
    state: 'Jharkhand',
    country: 'India',
    latLng: [23.815, 86.436],
  },
};

/**
 * Insert any gated campus that is missing.
 *
 * Never throws. A seed that prevents the server from booting would be strictly
 * worse than an empty picker: the app is a social network, and it still works
 * for every already-registered campus if this quietly does nothing. It logs what
 * it did and returns what it created.
 *
 * @returns {Promise<{created: string[], skipped: string[]}>}
 */
export const seedGatedColleges = async () => {
  const result = { created: [], skipped: [] };

  const allowed = getAllowedColleges();
  if (allowed === null) {
    // No gate configured — the pre-pilot behaviour is every active college can
    // sign up, and seeding the whole catalogue would quietly pre-load ten
    // campuses nobody asked for. Nothing to do.
    return result;
  }

  for (const code of allowed) {
    const record = CATALOGUE[code];
    if (!record) {
      // A gated code with no catalogue entry is an operator error worth
      // shouting about: the campus is allowed to sign up but nothing can tell
      // the picker what it is called or which domains to verify against.
      console.error(
        `⚠️  ALLOWED_COLLEGES includes "${code}", which is not in the campus catalogue. ` +
        `Add it to CATALOGUE in server/utils/campusSeed.js, or add the campus from /admin.`,
      );
      continue;
    }

    try {
      // insertOne would throw E11000 on the unique code index if a concurrent
      // instance seeded first — which is exactly what happens on a rolling
      // deploy with two instances briefly running. updateOne with upsert is
      // idempotent and needs no error handling.
      const res = await College.updateOne(
        { code },
        { $setOnInsert: { code, ...record, active: true } },
        { upsert: true },
      );

      if (res.upsertedCount > 0) {
        result.created.push(code);
        console.log(`🏫 Seeded campus "${record.name}" (${code}) from ALLOWED_COLLEGES.`);
      } else {
        result.skipped.push(code);
      }
    } catch (err) {
      console.error(`⚠️  Could not seed campus "${code}": ${err.message}`);
    }
  }

  if (result.created.length > 0) {
    console.log(
      `🏫 Boot seed created ${result.created.length} campus(es): ${result.created.join(', ')}. ` +
      `Sign up at / with an email on that domain, then open /admin.`,
    );
  }

  return result;
};

export default seedGatedColleges;
```

### ./server/utils/email.js

```
/**
 * 📧 "Your college is live" — sent ONLY when an operator presses Notify on a
 * college request group. Never automatically, and never at request time.
 *
 * ⚠️ Why that restraint matters: this is the one email we ever send to an
 * address that arrived from a public, unauthenticated web form. Sending it
 * automatically on college-creation would mean a single typo in a college name
 * emails every student who requested it — including a typo that silently splits
 * one campus's requests across two names. An explicit press means the operator
 * has looked at the grouped list and confirmed the spelling first.
 *
 * There is deliberately NO sign-in or verification link in this email. A link
 * would turn the request form into an account-takeover primitive: submit
 * someone else's address, have a link sent to them, click it.
 */
/**
 * 📧 EMAIL TRANSPORT — Resend.
 *
 * ── WHY RESEND_SENDER_EMAIL MUST BE A BARE ADDRESS ──────────────────────────
 * The `from` header is composed as `${senderName} <${senderEmail}>`, so
 * RESEND_SENDER_EMAIL must be ONLY the address — `otp@huh.app`. Setting it to
 * the full display form (`huh? <otp@huh.app>`) produces
 *
 *     from: "huh? <huh? <otp@huh.app>>"
 *
 * which Resend rejects with a validation error, and the failure surfaces only
 * as an OTP that never arrives. The default below is deliberately bare for the
 * same reason.
 */
const senderEmail = () => process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
const senderName = () => process.env.RESEND_SENDER_NAME || 'huh?';

// ⚠️ `onboarding@resend.dev` is Resend's sandbox sender. It delivers ONLY to
// the email address that owns the Resend account. Every real student is
// silently unreachable while it is in use, and nothing errors — Resend accepts
// the send and delivers it to the wrong place. Set a verified domain.
const brand = () => senderName();

export const sendCollegeLive = async (email, collegeName) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[DEV MODE] College-live email for ${email}: ${collegeName} is now on ${brand()}`);
    return true;
  }

  // Escape before interpolation into HTML — the name comes from user input.
  const safeName = String(collegeName || 'your college').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );

  const htmlContent = `
    <div style="font-family: 'Inter', sans-serif; background-color: #0A0A0C; color: #F5F5F7; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);">
      <h1 style="color: #D4A853; font-size: 28px; margin-bottom: 8px; font-weight: 700; letter-spacing: 2px;">${brand().toUpperCase()}</h1>
      <p style="color: #6E6E80; font-size: 14px; margin-bottom: 24px;">Your Campus. Your People.</p>
      <div style="background-color: #141418; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.03);">
        <p style="font-size: 18px; color: #F5F5F7; margin: 0 0 8px 0; font-weight: 600;">${safeName} is live</p>
        <p style="font-size: 14px; color: #6E6E80; margin: 0; line-height: 1.5;">
          You asked us to add your campus, and we have. You can now sign up and start matching with students there.
        </p>
      </div>
      <p style="font-size: 12px; color: #6E6E80; line-height: 1.5;">
        ${brand()} is for verified students only. You will need your campus email address to sign up.
      </p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${senderName()} <${senderEmail()}>`,
      to: [email],
      subject: `${collegeName} is now on ${brand()}`,
      html: htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend API error:', err);
    throw new Error(`Resend API error: ${err}`);
  }

  return true;
};

export const sendOTP = async (email, otp) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n----------------------------------------`);
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    console.log(`----------------------------------------\n`);
    return true;
  }

  const htmlContent = `
    <div style="font-family: 'Inter', sans-serif; background-color: #0A0A0C; color: #F5F5F7; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);">
      <h1 style="color: #D4A853; font-size: 28px; margin-bottom: 8px; font-weight: 700; letter-spacing: 2px;">${brand().toUpperCase()}</h1>
      <p style="color: #6E6E80; font-size: 14px; margin-bottom: 24px;">Your Campus. Your People.</p>
      <div style="background-color: #141418; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.03);">
        <p style="font-size: 16px; color: #F5F5F7; margin-top: 0;">Here is your verification code:</p>
        <div style="font-size: 36px; font-weight: 700; color: #D4A853; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
        <p style="font-size: 12px; color: #6E6E80; margin-bottom: 0;">This code is valid for 10 minutes and can only be used once.</p>
      </div>
      <p style="font-size: 12px; color: #6E6E80; line-height: 1.5;">If you did not request this code, you can safely ignore this email.</p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${senderName()} <${senderEmail()}>`,
      to: [email],
      subject: `Your ${brand()} Login Code`,
      html: htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend API error:', err);
    throw new Error(`Resend API error: ${err}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n----------------------------------------`);
    console.log(`[OTP] For ${email}: ${otp}`);
    console.log(`----------------------------------------\n`);
  }

  return true;
};

```

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

### ./server/routes/admin.js

```
import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Report from '../models/Report.js';
import Alignment from '../models/Alignment.js';
import Message from '../models/Message.js';
import Setting from '../models/Setting.js';
import College from '../models/College.js';
import CollegeRequest from '../models/CollegeRequest.js';
import { normaliseDomain } from '../utils/collegeDomain.js';
import { sendCollegeLive } from '../utils/email.js';
import { adminProtect } from '../middleware/admin.js';

const router = express.Router();
router.use(adminProtect);

// ─── Helpers ───
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const VALID_REPORT_STATUSES = ['pending', 'reviewed', 'dismissed', 'actioned'];
const ALLOWED_SETTING_KEYS = new Set([
  'supportEmail',
  'maintenanceMode',
  'shadowbanThreshold',
  'autoShadowban',
  'appConfig',
]);

// ─── STATS ───
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, newToday, active7d, active30d, pendingReports, activeBans, shadowbannedUsers] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false, createdAt: { $gte: todayStart } }),
      User.countDocuments({ isDeleted: false, lastActive: { $gte: sevenDaysAgo } }),
      User.countDocuments({ isDeleted: false, lastActive: { $gte: thirtyDaysAgo } }),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ isDeleted: false, suspended: true }),
      User.countDocuments({ isDeleted: false, shadowbannedAt: { $ne: null } }),
    ]);

    res.json({
      totalUsers,
      newToday,
      active7d,
      active30d,
      pendingReports,
      activeBans,
      activeShadowbans: shadowbannedUsers,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// ─── REPORTS ───
router.get('/reports', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(Number(req.query.perPage) || 15, 100);
    const { status, search, reason } = req.query;
    const skip = (page - 1) * perPage;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (reason && reason !== 'all') filter.reason = reason;

    if (search) {
      const safeSearch = escapeRegex(search);
      const searchUsers = await User.find({
        $or: [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ],
      }).select('_id').lean();
      const userIds = searchUsers.map(u => u._id);
      filter.$or = [
        { reporter: { $in: userIds } },
        { reported: { $in: userIds } },
      ];
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'name email photos')
        .populate('reported', 'name email photos suspended shadowbannedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Report.countDocuments(filter),
    ]);

    const reportedIds = [...new Set(reports.map(r => r.reported?._id?.toString()))];
    const reportCounts = {};
    if (reportedIds.length) {
      const counts = await Report.aggregate([
        { $match: { reported: { $in: reportedIds }, status: { $ne: 'dismissed' } } },
        { $group: { _id: '$reported', count: { $sum: 1 } } },
      ]);
      counts.forEach(c => { reportCounts[c._id.toString()] = c.count; });
    }

    const data = reports.map(r => ({
      _id: r._id,
      reporter: {
        name: r.reporter?.name || 'Unknown',
        email: r.reporter?.email || '',
        photo: r.reporter?.photos?.[0] || '',
      },
      reported: {
        name: r.reported?.name || 'Unknown',
        email: r.reported?.email || '',
        photo: r.reported?.photos?.[0] || '',
        suspended: r.reported?.suspended || false,
        shadowbanned: !!r.reported?.shadowbannedAt,
        reportCount: reportCounts[r.reported?._id?.toString()] || 0,
      },
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
    }));

    res.json({
      data,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    console.error('Admin reports error:', err);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

router.put('/reports/bulk', async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length || !status) {
      return res.status(400).json({ message: 'ids (array) and status required' });
    }
    if (ids.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'One or more invalid report IDs' });
    }
    if (!VALID_REPORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_REPORT_STATUSES.join(', ')}` });
    }
    await Report.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );
    res.json({ message: `${ids.length} reports updated to ${status}` });
  } catch (err) {
    console.error('Admin bulk update error:', err);
    res.status(500).json({ message: 'Failed to bulk update' });
  }
});

router.put('/reports/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }

    const { status } = req.body;
    if (status && !VALID_REPORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_REPORT_STATUSES.join(', ')}` });
    }

    const update = {};
    if (status) update.status = status;

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });

    res.json({ message: 'Report updated', report });
  } catch (err) {
    console.error('Admin report update error:', err);
    res.status(500).json({ message: 'Failed to update report' });
  }
});

// ─── USERS ───
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(Number(req.query.perPage) || 15, 100);
    const { status, search } = req.query;
    const skip = (page - 1) * perPage;

    const filter = { isDeleted: false };
    if (status === 'active') { filter.suspended = false; filter.shadowbannedAt = null; }
    else if (status === 'suspended') filter.suspended = true;
    else if (status === 'shadowbanned') filter.shadowbannedAt = { $ne: null };

    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email college year gender photos suspended suspendedReason shadowbannedAt isDeleted lastActive createdAt adminNotes')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      User.countDocuments(filter),
    ]);

    const userIds = users.map(u => u._id);
    const reportCounts = {};
    if (userIds.length) {
      const counts = await Report.aggregate([
        { $match: { reported: { $in: userIds } } },
        { $group: {
          _id: '$reported',
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        } },
      ]);
      counts.forEach(c => { reportCounts[c._id.toString()] = c; });
    }

    const data = users.map(u => ({
      ...u,
      reportStats: {
        count: reportCounts[u._id.toString()]?.total || 0,
        pendingCount: reportCounts[u._id.toString()]?.pending || 0,
      },
    }));

    res.json({
      data,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-onboardingData -pushSubscription +adminNotes +suspendedReason')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const reportCount = await Report.countDocuments({ reported: user._id });
    const pendingReports = await Report.countDocuments({ reported: user._id, status: 'pending' });
    const matchCount = await Alignment.countDocuments({ users: user._id, isActive: true });

    res.json({
      ...user,
      reportStats: { count: reportCount, pendingCount: pendingReports },
      matchCount,
    });
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const { suspended, suspendedReason, shadowbanned, adminNotes } = req.body;
    const update = {};

    if (suspended !== undefined) {
      if (typeof suspended !== 'boolean') {
        return res.status(400).json({ message: 'suspended must be a boolean' });
      }
      update.suspended = suspended;
      update.suspendedAt = suspended ? new Date() : null;
      update.suspendedReason = suspended ? (suspendedReason || null) : null;
      // Revoke push on the way IN, not only on account deletion. A suspended
      // user's alignment stays `isActive: true`, so without this their counterpart
      // can keep messaging them and their lock screen keeps lighting up with the
      // message preview. Clearing it here means suspension actually stops contact
      // on suspension day — restoring `suspended: false` leaves it null, so they
      // simply re-enable notifications themselves.
      if (suspended) update.pushSubscription = null;
    }
    if (shadowbanned !== undefined) {
      if (typeof shadowbanned !== 'boolean') {
        return res.status(400).json({ message: 'shadowbanned must be a boolean' });
      }
      update.shadowbannedAt = shadowbanned ? new Date() : null;
      if (!shadowbanned) update.contentFrozen = false;
    }
    if (adminNotes !== undefined) {
      if (typeof adminNotes !== 'string') {
        return res.status(400).json({ message: 'adminNotes must be a string' });
      }
      update.adminNotes = adminNotes;
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('name email suspended suspendedReason shadowbannedAt adminNotes');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (suspended) {
      const io = req.app.get('io');
      if (io) {
        io.to(req.params.id.toString()).emit('force-disconnect', {
          reason: suspendedReason || 'Account suspended',
        });
        // Force-close every socket belonging to this user (all their devices).
        // `force-disconnect` above is emitted on their personal room, but a
        // suspended user must stop both sending and RECEIVING realtime frames —
        // otherwise "…" typing indicators and presence keep flowing. socket/chat.js
        // stores identity as `socket.user._id`, not `socket.data.userId`.
        for (const s of io.sockets.sockets.values()) {
          if (String(s.user?._id) === String(req.params.id)) {
            s.disconnect(true);
          }
        }
      }
    }

    res.json({ message: 'User updated', user });
  } catch (err) {
    console.error('Admin user update error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

router.post('/users/:id/disconnect', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(req.params.id.toString()).emit('force-disconnect', {
        reason: 'Admin forced disconnect',
      });
    }
    res.json({ message: 'Disconnect signal sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to disconnect user' });
  }
});

// ─── ANALYTICS ───
router.get('/analytics', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [dailySignups, dailyReports, dailyMatches, dailyMessages, dailyActive] = await Promise.all([
      User.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Report.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Alignment.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Message.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, deleted: false } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { isDeleted: false, lastActive: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastActive' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      dailySignups: dailySignups.map(d => ({ date: d._id, count: d.count })),
      dailyReports: dailyReports.map(d => ({ date: d._id, count: d.count })),
      dailyMatches: dailyMatches.map(d => ({ date: d._id, count: d.count })),
      dailyMessages: dailyMessages.map(d => ({ date: d._id, count: d.count })),
      dailyActive: dailyActive.map(d => ({ date: d._id, count: d.count })),
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// ─── COLLEGES ────────────────────────────────────────────────────────────
// Colleges live in the DATABASE so an operator can add a campus without a
// deploy. This is the whole reason `COLLEGE_MAP` in appData.js stopped being
// the source of truth.
//
// Two rules are enforced here rather than trusted to the UI:
//   1. At least one valid domain. A college with no domain has nothing to
//      verify an email against, so it would accept anyone.
//   2. `code` is immutable once students exist. It is the join key on every
//      user document; renaming it splits one campus into two in the data.

/** Normalise + validate a list of domains into storage form. */
const sanitiseDomains = (raw) => {
  const list = Array.isArray(raw) ? raw : String(raw || '').split(',');
  const out = [];
  for (const item of list) {
    const d = normaliseDomain(item);
    if (d && !out.includes(d)) out.push(d);
  }
  return out;
};

/* 📍 Parse a campus map position from the admin form.
 *
 * Accepts an already-paired `[lat, lng]` (how the API receives it) or the two
 * separate string fields the form posts, because an operator types "19.076" into
 * a latitude box and a comma-separated pair is awkward to validate by eye.
 *
 * Returns null for anything unusable so callers can distinguish "not supplied"
 * from "supplied and wrong" — those two need different handling: the first is
 * normal, the second is a data-entry error worth reporting.
 *
 * Rounding is deliberately NOT applied here. Campus coordinates are public
 * building locations, not user data, so they keep full precision — the privacy
 * rounding in `sanitizeLatLng` exists to protect a person's home coordinates
 * and a campus does not need it. */
const parseCollegeLatLng = (raw, rawLng) => {
  let pair = null;
  if (Array.isArray(raw)) {
    pair = raw;
  } else if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    const parts = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
    pair = rawLng !== undefined && parts.length === 1 ? [parts[0], rawLng] : parts;
  }
  if (!pair || pair.length !== 2) return null;
  const [lat, lng] = pair.map((n) => Number(n));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
};

router.get('/colleges', async (req, res) => {
  try {
    const colleges = await College.find().sort({ name: 1 }).lean();
    // Student counts come from the user index on collegeCode, so this is one
    // aggregation rather than a query per college.
    const counts = await User.aggregate([
      { $match: { collegeCode: { $nin: ['', null] } } },
      { $group: { _id: '$collegeCode', n: { $sum: 1 } } },
    ]);
    const byCode = Object.fromEntries(counts.map((c) => [c._id, c.n]));

    res.json({
      colleges: colleges.map((c) => ({
        ...c,
        studentCount: byCode[c.code] || 0,
      })),
    });
  } catch (err) {
    console.error('Admin colleges list error:', err);
    res.status(500).json({ message: 'Failed to fetch colleges' });
  }
});

router.post('/colleges', async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim().toLowerCase();
    const name = String(req.body?.name || '').trim();
    const domains = sanitiseDomains(req.body?.domains);
    const latLngFromBody = parseCollegeLatLng(req.body?.latLng);

    /* Reject a malformed coordinate pair rather than silently discarding it.
       This is an operator data-entry form, so a typo here would otherwise
       quietly leave the campus unranked by distance with nothing to indicate
       why. Absent is fine; present-and-wrong is an error. */
    if (req.body?.latLng !== undefined && req.body?.latLng !== null && req.body?.latLng !== '' && !latLngFromBody) {
      return res.status(400).json({
        message: 'Map position must be a latitude and longitude between -90/90 and -180/180',
      });
    }

    if (!/^[a-z0-9-]{2,30}$/.test(code)) {
      return res.status(400).json({ message: 'Code must be 2-30 lowercase letters, numbers or dashes' });
    }
    if (name.length < 3) {
      return res.status(400).json({ message: 'Enter the full official college name' });
    }
    if (domains.length === 0) {
      return res.status(400).json({
        message: 'Add at least one email domain. Without one, anyone could verify as a student there.',
      });
    }

    if (await College.findOne({ code })) {
      return res.status(400).json({ message: `A college with code "${code}" already exists` });
    }

    const college = await College.create({
      code,
      name,
      domains,
      city: String(req.body?.city || '').trim(),
      state: String(req.body?.state || '').trim(),
      country: String(req.body?.country || '').trim(),
      // 📍 Optional campus position for distance ranking. Validated by
      // sanitizeLatLng() and omitted entirely when blank — a college with no
      // position is fully functional, its students just sort as unknown
      // distance rather than being guessed at.
      ...(latLngFromBody ? { latLng: latLngFromBody } : {}),
      active: req.body?.active !== false,
    });

    res.status(201).json({ college: { ...college.toObject(), studentCount: 0 } });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: 'That college code is already taken' });
    }
    console.error('Admin college create error:', err);
    res.status(500).json({ message: 'Failed to create college' });
  }
});

router.put('/colleges/:code', async (req, res) => {
  try {
    const college = await College.findOne({ code: req.params.code });
    if (!college) return res.status(404).json({ message: 'College not found' });

    const studentCount = await User.countDocuments({ collegeCode: college.code });

    // The join key. Renaming it after students exist would orphan every one of
    // them onto a college that no longer exists, and split them from their peers.
    if (req.body?.code && String(req.body.code).trim().toLowerCase() !== college.code) {
      if (studentCount > 0) {
        return res.status(400).json({
          message: `Cannot change the code — ${studentCount} student(s) already use it. The code is a permanent identifier.`,
        });
      }
      college.code = String(req.body.code).trim().toLowerCase();
    }

    if (req.body?.name !== undefined) {
      const n = String(req.body.name).trim();
      if (n.length < 3) return res.status(400).json({ message: 'Enter the full official college name' });
      college.name = n;
    }

    if (req.body?.domains !== undefined) {
      const domains = sanitiseDomains(req.body.domains);
      if (domains.length === 0) {
        return res.status(400).json({ message: 'A college needs at least one email domain' });
      }
      college.domains = domains;
    }

    for (const k of ['city', 'state', 'country']) {
      if (req.body?.[k] !== undefined) college[k] = String(req.body[k]).trim();
    }

    /* 📍 Map position. Setting it to null/'' CLEARS it, which is how an operator
       removes a coordinate that was entered against the wrong campus. */
    if (req.body?.latLng !== undefined) {
      const parsed = parseCollegeLatLng(req.body.latLng);
      if (!parsed && req.body.latLng !== null && req.body.latLng !== '') {
        return res.status(400).json({
          message: 'Map position must be a latitude and longitude between -90/90 and -180/180',
        });
      }
      college.latLng = parsed ?? undefined;
    }
    if (req.body?.active !== undefined) college.active = Boolean(req.body.active);

    await college.save();
    res.json({ college: { ...college.toObject(), studentCount } });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: 'That college code is already taken' });
    }
    console.error('Admin college update error:', err);
    res.status(500).json({ message: 'Failed to update college' });
  }
});

router.delete('/colleges/:code', async (req, res) => {
  try {
    const college = await College.findOne({ code: req.params.code });
    if (!college) return res.status(404).json({ message: 'College not found' });

    // Deleting a college with students would orphan them — no college to
    // display, no domain to re-verify against. Deactivate instead: that hides
    // it from new signups and leaves existing students intact.
    const studentCount = await User.countDocuments({ collegeCode: college.code });
    if (studentCount > 0) {
      return res.status(400).json({
        message: `Cannot delete — ${studentCount} student(s) verified through this college. Deactivate it instead to stop new signups.`,
      });
    }

    await college.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin college delete error:', err);
    res.status(500).json({ message: 'Failed to delete college' });
  }
});

// ─── COLLEGE REQUESTS ────────────────────────────────────────────────────
// Students who can't find their campus submit one. They do NOT get access:
// an operator must verify the domain and add the college first.
//
// Grouped by collegeName and sorted by request count, because for a solo
// operator the count IS the priority queue — it tells you which campus has the
// most people waiting.

router.get('/college-requests', async (req, res) => {
  try {
    const requests = await CollegeRequest.find().sort({ createdAt: -1 }).lean();

    const groups = {};
    for (const r of requests) {
      const key = r.collegeName.trim();
      if (!groups[key]) {
        groups[key] = {
          collegeName: key,
          count: 0,
          city: r.city,
          state: r.state,
          country: r.country,
          domains: new Set(),
          status: r.status,
          oldest: r.createdAt,
          requesters: [],
        };
      }
      const g = groups[key];
      g.count += 1;
      // Fill blanks from later rows rather than leaving them empty.
      g.city = g.city || r.city;
      g.state = g.state || r.state;
      g.country = g.country || r.country;
      // The submitted address hints at the domain to verify. Masked in the
      // list so the queue doesn't display a wall of full addresses.
      const d = String(r.email || '').split('@')[1];
      if (d) g.domains.add(d);
      if (r.status === 'pending') g.requesters.push({
        _id: r._id,
        name: r.name,
        email: r.email.replace(/^(.{2}).*(@.*)$/, '$1•••$2'),
        createdAt: r.createdAt,
      });
    }

    const list = Object.values(groups)
      .map((g) => ({
        ...g,
        domains: [...g.domains],
        // Age of the oldest pending request — the "old requests" view is just
        // this list filtered to 30+ days, so nothing sits forgotten.
        ageDays: Math.floor((Date.now() - new Date(g.oldest).getTime()) / 86400000),
      }))
      // Most requests first: that ordering is the operator's to-do list.
      .sort((a, b) => b.count - a.count || new Date(a.oldest) - new Date(b.oldest));

    res.json({ groups: list, total: requests.length });
  } catch (err) {
    console.error('Admin college requests error:', err);
    res.status(500).json({ message: 'Failed to fetch college requests' });
  }
});

router.post('/college-requests/:id/approve', async (req, res) => {
  try {
    const request = await CollegeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const domain = String(request.email || '').split('@')[1];
    const code = String(req.body?.code || request.collegeName).trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, '').slice(0, 30);
    if (!code) return res.status(400).json({ message: 'Provide a college code' });

    const domains = sanitiseDomains(req.body?.domains || [domain]);
    if (domains.length === 0) {
      return res.status(400).json({ message: 'A college needs at least one email domain' });
    }

    // Upsert so re-approving a group the operator already added is a no-op
    // rather than a duplicate-key 500.
    const college = await College.findOneAndUpdate(
      { code },
      {
        $set: {
          name: request.collegeName,
          domains,
          city: request.city || '',
          state: request.state || '',
          country: request.country || '',
          active: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Mark every pending request for this college as approved, so the operator
    // can then press Notify once for the whole group.
    await CollegeRequest.updateMany(
      { collegeName: request.collegeName, status: 'pending' },
      { $set: { status: 'approved', collegeCode: college.code } },
    );

    res.json({ ok: true, college: { ...college.toObject(), studentCount: 0 } });
  } catch (err) {
    console.error('Admin approve request error:', err);
    res.status(500).json({ message: 'Failed to approve request' });
  }
});

router.post('/college-requests/:id/reject', async (req, res) => {
  try {
    const request = await CollegeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    await CollegeRequest.updateOne(
      { _id: request._id },
      { $set: { status: 'rejected' } },
    );
    // No email is sent on rejection, by design: a silent rejection is
    // indistinguishable from being ignored.
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin reject request error:', err);
    res.status(500).json({ message: 'Failed to reject request' });
  }
});

// Manual, explicit — never automatic. Notifying is the one moment we email an
// address someone typed into a public form, which is exactly why it must be a
// deliberate press rather than a side effect of adding the college: an operator
// who mistypes a college name would otherwise email everyone who requested it.
router.post('/college-requests/:id/notify', async (req, res) => {
  try {
    const request = await CollegeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const targets = await CollegeRequest.find(
      { collegeName: request.collegeName, status: 'approved' },
    ).lean();

    const college = request.collegeCode
      ? await College.findOne({ code: request.collegeCode })
      : null;

    let sent = 0;
    const failed = [];
    for (const r of targets) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await sendCollegeLive(r.email, college?.name || request.collegeName);
        sent += 1;
      } catch (e) {
        failed.push(r.email);
      }
    }

    await CollegeRequest.updateMany(
      { collegeName: request.collegeName, status: 'approved', notifiedAt: null },
      { $set: { notifiedAt: new Date() } },
    );

    res.json({ ok: true, sent, failed: failed.length, total: targets.length });
  } catch (err) {
    console.error('Admin notify error:', err);
    res.status(500).json({ message: 'Failed to send notifications' });
  }
});

// ─── SETTINGS ───
router.get('/settings', async (req, res) => {
  try {
    const settings = await Setting.find().lean();
    const obj = {};
    settings.forEach(s => { obj[s.key] = s.value; });
    res.json(obj);
  } catch (err) {
    console.error('Admin settings error:', err);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const entries = Object.entries(req.body || {});
    if (!entries.length) {
      return res.status(400).json({ message: 'No settings provided' });
    }
    if (entries.length > 50) {
      return res.status(400).json({ message: 'Too many settings at once' });
    }

    for (const [key, value] of entries) {
      if (!ALLOWED_SETTING_KEYS.has(key)) {
        return res.status(400).json({ message: `Unknown setting key: ${key}` });
      }
      if (key === 'shadowbanThreshold') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1000) {
          return res.status(400).json({ message: 'shadowbanThreshold must be a finite number between 0 and 1000' });
        }
      } else if (typeof value === 'string' && value.trim().length > 50) {
        return res.status(400).json({ message: `${key} must be 50 characters or fewer` });
      }
    }

    const ops = entries.map(([key, value]) =>
      Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true })
    );
    await Promise.all(ops);
    res.json({ message: 'Settings saved' });
  } catch (err) {
    console.error('Admin settings save error:', err);
    res.status(500).json({ message: 'Failed to save settings' });
  }
});

export default router;

```

### ./server/routes/alignments.js

```
import express from 'express';
import mongoose from 'mongoose';
import Alignment from '../models/Alignment.js';
import User from '../models/User.js';
import Interaction from '../models/Interaction.js';
import Block from '../models/Block.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { withFreshAge } from '../utils/age.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/** Ids the given user has blocked, or who have blocked them. */
const getBlockedUserIds = async (userId) => {
  const blocks = await Block.find({
    $or: [{ blocker: userId }, { blocked: userId }],
  }).lean();
  return blocks.map((b) =>
    b.blocker.toString() === userId.toString() ? b.blocked : b.blocker
  );
};

// @route   GET /api/alignments
// @desc    Get all active alignments for the current user with details (paginated) using Aggregation
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    // Clamped. `parseInt('-1') || 1` yields -1 (truthy), so a negative page
    // reached `$skip: -40`, which MongoDB rejects — a 500 plus a log-spam
    // vector. The limit was previously uncapped, so ?limit=1e9 went straight
    // to Mongo. admin.js already used this form.
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

    // 🚫 BLOCK FILTER — second layer behind the accept-letter check.
    //
    // This route gated only on `isActive`, and never consulted the Block
    // collection at all. A block sets `isActive: false` on the alignment, but any
    // path that flipped it back (the accept-letter route, which had no block
    // check) put a blocked chat straight back into this list for both users.
    // Filtering here means a stale/re-activated alignment can never surface a
    // block, regardless of what wrote it.
    const blockedUserIds = await getBlockedUserIds(userId);
    const blockedClause = blockedUserIds.length
      ? { users: { $not: { $in: blockedUserIds } } }
      : {};

    const query = { users: userId, isActive: true, ...blockedClause };

    const total = await Alignment.countDocuments(query);

    // SINGLE AGGREGATION PIPELINE
    // FIXED: sortDate is computed BEFORE $skip/$limit so pagination and display
    // order use the SAME key. (Old code paginated by updatedAt, then re-sorted
    // the page by sortDate — alignments could duplicate/vanish across pages.)
    const rawAlignments = await Alignment.aggregate([
      { $match: query },

      // 1. Most recent message — computed BEFORE pagination so sortDate is stable.
      //    Cheap indexed lookup ({ alignmentId: 1, createdAt: 1 } index in Message.js).
      {
        $lookup: {
          from: 'messages',
          let: { alignmentId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$alignmentId', '$$alignmentId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { text: 1, senderId: 1, createdAt: 1, readAt: 1, type: 1, mediaUrl: 1 } }
          ],
          as: 'lastMessageArr'
        }
      },
      {
        $unwind: {
          path: '$lastMessageArr',
          preserveNullAndEmptyArrays: true // Keep alignment even if no messages exist
        }
      },

      // 1b. Unread message count for this alignment (messages from other user, not read, not deleted)
      {
        $lookup: {
          from: 'messages',
          let: { alignmentId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$alignmentId', '$$alignmentId'] } } },
            { $match: { senderId: { $ne: userId }, readAt: null, deleted: false } },
            { $count: 'count' }
          ],
          as: 'unreadCountArr'
        }
      },
      {
        $addFields: {
          unreadCount: {
            $ifNull: [{ $arrayElemAt: ['$unreadCountArr.count', 0] }, 0]
          }
        }
      },

      // 2. Sort ONCE by the same key the client sees, with an _id tiebreaker for
      //    deterministic page boundaries. THEN paginate.
      { $addFields: { sortDate: { $ifNull: ['$lastMessageArr.createdAt', '$updatedAt'] } } },
      { $sort: { sortDate: -1, _id: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },

      // 3. Join the aligned user's profile (heavy lookup — AFTER pagination,
      //    so it only runs for this page's alignments)
      {
        $lookup: {
          from: 'users',
          let: { userIds: '$users' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$userIds'] } } },
            { $match: { _id: { $ne: userId } } },
            // `dob` instead of `age`: the stored age is written once at
            // onboarding and goes stale, so projecting it straight out of the
            // database shows an out-of-date number on the Matches page and the
            // chat header. withFreshAge() below derives a current age and drops
            // dob before the response — see utils/age.js. `age` is projected too
            // only as the fallback for rows with no dob.
            { $project: { name: 1, photos: 1, year: 1, dob: 1, age: 1, lastActive: 1, gender: 1, bio: 1, prompts: 1, intent: 1, interests: 1, suspended: 1, isDeleted: 1 } }
          ],
          as: 'otherUserArr'
        }
      },
      { $unwind: { path: '$otherUserArr', preserveNullAndEmptyArrays: true } },
      { $match: { otherUserArr: { $ne: null } } },

      // 4. Join the original interaction that created this alignment
      {
        $lookup: {
          from: 'interactions',
          let: { interactionId: '$unlockedByInteractionId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$interactionId'] } } },
            { $project: { targetArtifact: 1, letterContent: 1, actionType: 1 } }
          ],
          as: 'originInteraction'
        }
      },
      {
        $unwind: {
          path: '$originInteraction',
          preserveNullAndEmptyArrays: true
        }
      },

      // 5. Shape the final output to match frontend expectations
      {
        $project: {
          _id: 1,
          user: '$otherUserArr',
          lastMessage: '$lastMessageArr',
          originInteraction: 1,
          createdAt: 1,
          updatedAt: 1,
          sortDate: 1,
          unreadCount: 1,
          yourTurn: {
            $cond: {
              if: { $ifNull: ['$lastMessageArr.senderId', false] },
              then: {
                $and: [
                  { $ne: ['$lastMessageArr.senderId', userId] },
                  { $eq: [{ $ifNull: ['$lastMessageArr.readAt', null] }, null] }
                ]
              },
              else: false
            }
          }
        }
      }
    ]);

    // Age is derived from dob here rather than inside the pipeline, so the deck
    // (routes/discover.js) and this list can never disagree about someone's age.
    // `user` is the only profile object in the response, and withFreshAge()
    // strips dob so the date of birth is never sent to the client.
    const alignments = rawAlignments.map((a) => ({
      ...a,
      user: a.user ? withFreshAge(a.user) : a.user,
    }));

    res.status(200).json({
      // `matches` is the key the client reads. Three call sites — Matches.jsx:76,
      // AppShell.jsx:69 and AppShell.jsx:79/83 — all read `.matches`, and this
      // route used to send the list under `alignments` instead, so every one of
      // them resolved to `undefined`. The Matches page rendered an empty list,
      // the unread count was permanently 0, and the realtime update handlers
      // bailed on their first line (`if (!old?.matches) return old`). Mutual
      // matches were invisible to both sides.
      matches: alignments,
      // Deprecated alias, same array. Kept for one release so nothing that
      // still reads `.alignments` breaks mid-deploy. Remove once no client code
      // references it — the client's only reads of this endpoint are the three
      // above.
      alignments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching alignments' });
  }
});

// @route   DELETE /api/alignments/:id
// @desc    Unmatch/deactivate an alignment
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // isActive guard: a second (double-tap/retry) unmatch finds nothing here,
    // so it can never create duplicate permanent-archive Interactions.
    const alignment = await Alignment.findOne({
      _id: req.params.id,
      users: req.user._id,
      isActive: true,
    });

    if (!alignment) {
      return res.status(400).json({ message: 'Alignment not found or already inactive' });
    }

    alignment.isActive = false;
    await alignment.save();

    // Create permanent exclusion so they never appear in each other's Discover deck
    const otherUserId = alignment.users.find(u => u.toString() !== req.user._id.toString());
    await Interaction.create({
      actorId: req.user._id,
      targetId: otherUserId,
      actionType: 'archive',
      cooldownExpiresAt: null, // Permanent — no cooldown expiry
      origin: 'unmatch',       // Distinguishes from block archives — unblock never sweeps it
    });

    // Notify the other user
    const io = req.app.get('io');
    if (otherUserId && io) {
      io.to(otherUserId.toString()).emit('unmatch-notification', { alignmentId: alignment._id });
    }
    if (otherUserId) {
      addToQueue(() => sendPushNotification(otherUserId, {
        title: 'Unmatched',
        body: `You were unmatched by ${req.user.name}`,
      }));
    }

    res.status(200).json({ success: true, message: 'Unmatched successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing unmatch' });
  }
});

export default router;
```

### ./server/routes/auth.js

```
import express from 'express';
import { body } from '../middleware/validate.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import OTP from '../models/OTP.js';
import User from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { protect, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { APP_CONSTANTS } from '../config/appData.js';
import { sendOTP } from '../utils/email.js';
import { hashOtp, verifyOtp, normalizeEmail } from '../utils/otpHash.js';
import College from '../models/College.js';
import { emailMatchesCollege } from '../utils/collegeDomain.js';
import { isCollegeAllowed, COLLEGE_GATE_MESSAGE } from '../utils/campusGate.js';
import { verifyOtpLimiter, otpEmailLimiter, reverifyLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Generate 6-digit cryptographically secure code
// NOTE: randomInt upper bound is EXCLUSIVE — 1000000 makes 999999 reachable
const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * 🔒 COLLEGE RESOLUTION — the user PICKS their college; we never infer it.
 *
 * This used to guess the college from the email domain by taking "the label
 * immediately before .ac.in", which meant `x@cse.iitb.ac.in` and `x@iitb.ac.in`
 * both became `iitb` — and, critically, that the college was a FUNCTION of the
 * email. With the picker, the student states their college and the email must
 * then agree with it.
 *
 * Matching is exact-or-subdomain via utils/collegeDomain.js, so a college
 * registered as `iitb.ac.in` accepts every department address without listing
 * them, while `evil@iitb.ac.in.attacker.com` is rejected.
 */

/**
 * Look up a college and check the email belongs to it.
 *
 * @returns {{ok:true, college}|{ok:false, college?:object, reason:string}}
 */
export const resolveCollege = async (collegeCode, email) => {
  const code = (collegeCode || '').toString().trim().toLowerCase();
  if (!code) {
    return { ok: false, reason: 'Please select your college first.' };
  }

  const college = await College.findOne({ code });
  if (!college) {
    return { ok: false, reason: 'Please select your college from the list.' };
  }
  if (!college.active) {
    return { ok: false, college, reason: 'Sign-ups for this college are currently closed.' };
  }

  // 🔒 THE PILOT GATE.
  //
  // Checked AFTER the college exists and is active, so a student outside the
  // gate gets the same closed-door message whether their campus is missing,
  // deactivated, or simply not yet opened to the pilot. Before this line the
  // three failure modes were indistinguishable to the caller and each leaked a
  // little of the shape of the pilot.
  //
  // This is the security control. The picker hiding non-gated colleges (see
  // collegeGateFilter in the list routes) is only cosmetic — it keeps the UI
  // honest, but a student can post any collegeCode they like to /api/auth, so
  // the check that matters has to live here, server-side, on the path that
  // actually issues an OTP.
  if (!isCollegeAllowed(code)) {
    return { ok: false, college, reason: COLLEGE_GATE_MESSAGE };
  }

  if (!emailMatchesCollege(email, college.domains)) {
    // ── THE OPERATOR ESCAPE HATCH ────────────────────────────────────────────
    //
    // A single account, matched by exact address, is allowed to register
    // without a college-domain email. This exists because adminProtect gates on
    // `user.email === ADMIN_EMAIL`, and an admin whose address is a Gmail or an
    // alumni mailbox can never satisfy an academic-domain check — so without
    // this, setting ADMIN_EMAIL to anything other than a student address makes
    // the entire admin panel permanently unreachable. There is no other way
    // to recover it: the panel has no separate login.
    //
    // Deliberately narrow on all three axes:
    //   • ONE address, exact match after trim+lowercase — never a domain.
    //   • It still needs a valid college CODE that exists and is active, and
    //     still has to clear the pilot gate. This bypasses the email check
    //     only, not the college gate.
    //   • It still requires a real OTP. Nothing about it skips verification;
    //     it only lets a non-@iitb.ac.in mailbox receive that code.
    //
    // Unset ADMIN_EMAIL → the comparison is against undefined, matches
    // nothing, and behaviour is exactly as before.
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (adminEmail && email.toLowerCase() === adminEmail) {
      console.warn(
        `[admin-bootstrap] ${email} registered on "${code}" without a matching college domain.`,
      );
      return { ok: true, college };
    }

    // The one error that names the college and its domain. Specific enough to
    // tell a student what went wrong; it leaks no user data — college domains
    // are public information and the student supplied the email themselves.
    const suffix = college.domains[0] ? `@${college.domains[0]}` : 'a college email address';
    return {
      ok: false,
      college,
      reason: `${college.name} students need an email address ending in ${suffix}.`,
    };
  }

  return { ok: true, college };
};

// How long a verified account stays verified before the annual re-check.
const REVERIFY_INTERVAL_MS = 365 * 24 * 60 * 60 * 1000;

// Grace period after the re-check date passes, before the account is gated.
// Absorbs a college mail-server outage without cutting students off.
const REVERIFY_GRACE_DAYS = 14;

/**
 * Next re-verification date = one year after the moment we just proved inbox
 * control. Deliberately NOT derived from graduatingYear: a student on a
 * semester extension legitimately types a later year, and we must not gate them
 * on a date they never chose. One year from the proof is both simpler and
 * always fair.
 */
const nextReverifyDate = (from = new Date()) => new Date(from.getTime() + REVERIFY_INTERVAL_MS);

/**
 * Whole days remaining in the grace window. Negative once overdue+expired,
 * which is what the login gate keys on. An account with no `reverifyDue` is
 * treated as not-yet-due, so nothing is ever locked out by missing data.
 */
const graceDaysLeft = (due, now = new Date()) => {
  if (!due) return REVERIFY_GRACE_DAYS;
  const end = new Date(due).getTime() + REVERIFY_GRACE_DAYS * 24 * 60 * 60 * 1000;
  return Math.ceil((end - now.getTime()) / (24 * 60 * 60 * 1000));
};

// @route   POST /api/auth/send-otp
// @desc    Generate OTP and send it via email
// @access  Public
router.post(
  '/send-otp',
  otpEmailLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address'),
    body('collegeCode')
      .isString()
      .withMessage('Please select your college')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('Please select your college'),
  ],
  validate,
  async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const collegeCode = req.body.collegeCode;

    try {
      // The picker is authoritative: the student chose the college, and the
      // email must belong to THAT college. There is no global .ac.in rule any
      // more — a college registered as `foo.com` works exactly like an .ac.in
      // one, which is what makes this an inter-college network rather than an
      // India-academics-only one.
      const resolved = await resolveCollege(collegeCode, email);
      if (!resolved.ok) {
        return res.status(400).json({ message: resolved.reason });
      }
      const college = resolved.college;
      // Rate limiting: check recent OTP requests (optional, but let's keep it robust)
      const recentOTPs = await OTP.find({
        email,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // last hour
      });

      if (recentOTPs.length >= 5) {
        return res.status(429).json({
          message: 'Too many verification codes requested. Please try again in an hour.',
        });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

      // Save to DB — only the HMAC fingerprint, never the code itself.
      //
      // collegeCode is persisted HERE, server-side, at the moment the challenge
      // is issued. verify-otp reads it from this record rather than accepting it
      // from the request body, so a client cannot ask for a code against one
      // college and then verify as a different one.
      await OTP.create({
        email,
        otpHash: hashOtp(email, otp),
        expiresAt,
        collegeCode: college.code,
      });

      // Send OTP
      await sendOTP(email, otp);

      res.status(200).json({ message: 'Verification code sent successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error, could not send code' });
    }
  }
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and return JWT token
// @access  Public
router.post(
  '/verify-otp',
  verifyOtpLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate,
  async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const otp = req.body.otp;

    try {
      const record = await OTP.findOne({ email }).sort({ createdAt: -1 });

      if (!record) {
        return res.status(400).json({ message: 'No verification code found' });
      }

      // Check expiry
      if (record.expiresAt < new Date()) {
        await OTP.deleteOne({ _id: record._id });
        return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
      }

      // Check attempts
      if (record.attempts >= 3) {
        return res.status(400).json({
          message: 'Too many incorrect attempts. Please request a new code.',
        });
      }

      // Compare (constant-time against the stored HMAC)
      if (!verifyOtp(email, otp, record.otpHash)) {
        const updated = await OTP.findOneAndUpdate(
          { _id: record._id, attempts: { $lt: 3 } },
          { $inc: { attempts: 1 } },
          { new: true }
        );
        if (!updated) {
          return res.status(400).json({ message: 'Too many incorrect attempts. Please request a new code.' });
        }
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Valid OTP! Find or create user
      let user = await User.findOne({ email });

      // RECLAMATION: a soft-deleted email can be reused once the 30-day
      // Trust & Safety retention window has elapsed. Hard-delete the stale
      // doc so a fresh account can be created below (no cron needed).
      const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
      if (user && user.isDeleted) {
        const deletedAt = user.deletedAt ? user.deletedAt.getTime() : 0;
        if (Date.now() - deletedAt >= RETENTION_MS) {
          await User.deleteOne({ _id: user._id });
          user = null; // fall through to fresh-account creation
        }
      }

      // The college comes from the OTP record — the same value send-otp validated
      // against this email's domain. Never re-derived here.
      const college = record.collegeCode ? await College.findOne({ code: record.collegeCode }) : null;
      if (!college) {
        // The college was deleted between issuing and verifying the code. Fail
        // closed: no college, no account.
        await OTP.deleteMany({ email });
        return res.status(400).json({
          message: 'That college is no longer available. Please select your college again.',
        });
      }

      if (!user) {
        user = await User.create({
          email,
          college: college.name,
          collegeCode: college.code,
          isVerified: true,
          isOnboarded: false,
          status: 'active',
          lastVerifiedAt: new Date(),
          reverifyDue: nextReverifyDate(),
        });
      } else {
        // 🛡️ Block suspended users from logging in
        if (user.suspended) {
          return res.status(403).json({
            message: 'Your account has been suspended. Contact support for assistance.',
            suspended: true,
            reason: user.suspendedReason || 'Multiple community reports',
          });
        }

        // 🛡️ Block deleted users from logging in
        if (user.isDeleted) {
          const unlockAt = user.deletedAt
            ? new Date(user.deletedAt.getTime() + RETENTION_MS)
            : new Date(Date.now() + RETENTION_MS);
          return res.status(403).json({
            message: `This account was deleted recently. You can create a new account with this email on or after ${unlockAt.toDateString()}.`,
            deleted: true,
            reusableAt: unlockAt.toISOString(),
          });
        }

        user.isVerified = true;
        // ⚠️ college/collegeCode are NOT overwritten on login any more.
        //
        // This used to re-derive them from the email domain on every single
        // login. With the picker that was actively wrong — it silently discarded
        // the student's stated college and replaced it with a guess, which would
        // have made the picker decorative. They're set once at account creation
        // and only change via the explicit "change college" flow.
        //
        // Each successful OTP proof renews the re-verification clock.
        user.status = 'active';
        user.lastVerifiedAt = new Date();
        user.reverifyDue = nextReverifyDate();
        await user.save();
      }

      // Delete OTP records for this email
      await OTP.deleteMany({ email });

      // Create JWT
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set httpOnly cookie (primary auth mechanism)
      setAuthCookie(res, token);

      res.status(200).json({
        user: {
          _id: user._id,
          email: user.email,
          college: user.college,
          collegeCode: user.collegeCode,
          isOnboarded: user.isOnboarded,
          name: user.name,
          suspended: user.suspended,
          suspendedReason: user.suspendedReason,
          isDeleted: user.isDeleted,
          shadowbanScore: user.shadowbanScore || 0,
          shadowbannedAt: user.shadowbannedAt || null,
          contentFrozen: user.contentFrozen || false,
          status: user.status || 'active',
          reverifyDue: user.reverifyDue || null,
          // Returned so the client can decide whether to show the annual
          // student check. `required` is false inside the grace window, so a
          // student with a temporarily broken inbox is nudged, not blocked.
          reverifyRequired:
            Boolean(user.reverifyDue) &&
            new Date(user.reverifyDue).getTime() + REVERIFY_GRACE_DAYS * 86400000 < Date.now(),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during verification' });
    }
  }
);

// ─── ANNUAL RE-VERIFICATION ──────────────────────────────────────────────
// The product claims "Students only." A college email proves inbox control at
// one moment, and alumni mailboxes keep working for decades. Re-checking once a
// year is the only thing that makes the claim true rather than aspirational —
// when a graduate's inbox finally dies, the code stops arriving and they stop
// being a student. Nobody is blocked by us; the inbox does it.
//
// ⚠️ NEVER deletes or suspends for a failed check. Losing mail access is not
// proof of anything, and silently destroying an account because a university
// mail server had a bad afternoon is unacceptable.

// @route   POST /api/auth/reverify
// @desc    Send a fresh code to the user's college email (annual student check)
// @access  Private
router.post('/reverify', protect, reverifyLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const college = user.collegeCode ? await College.findOne({ code: user.collegeCode }) : null;
    if (!college) {
      // Their college was removed from the directory. Do NOT delete — they may
      // just need to be moved to a corrected record by an operator.
      return res.status(400).json({
        message: 'Your college is no longer listed. Please contact support.',
        code: 'COLLEGE_UNAVAILABLE',
      });
    }

    const now = new Date();
    const otp = generateOTP();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    await OTP.create({
      email: user.email,
      otpHash: hashOtp(user.email, otp),
      expiresAt,
      collegeCode: college.code,
    });

    await sendOTP(user.email, otp);

    const body = {
      message: `Code sent to your ${college.name} email.`,
      reverifyDue: user.reverifyDue,
      graceDaysLeft: graceDaysLeft(user.reverifyDue, now),
    };

    /* ⚠️ TEST-ONLY. The plaintext code is unrecoverable by design — only its
       HMAC is stored — and Dev Mode inside sendOTP prints it to the server
       console, which isn't reachable when the route is driven over HTTP. This
       returns it so the re-verify flow can be verified end to end without
       reading logs.
       Gated on NODE_ENV === 'test' so it cannot fire in production, where it
       would hand a caller the code for the account they're already logged into
       (which would defeat the entire annual check). */
    if (process.env.NODE_ENV === 'test') body.__testOtp = otp;

    res.json(body);
  } catch (err) {
    console.error('Reverify send error:', err);
    res.status(500).json({ message: 'Could not send verification code' });
  }
});

// @route   POST /api/auth/reverify/confirm
// @desc    Complete the annual student check and renew the re-verification date
// @access  Private
router.post('/reverify/confirm', protect, verifyOtpLimiter, [
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], validate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const record = await OTP.findOne({ email: user.email }).sort({ createdAt: -1 });
    if (!record || !record.collegeCode) {
      return res.status(400).json({ message: 'Request a new code first.' });
    }
    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'That code expired. Request a new one.' });
    }
    if (!verifyOtp(user.email, req.body.otp, record.otpHash)) {
      await OTP.findOneAndUpdate(
        { _id: record._id, attempts: { $lt: 3 } },
        { $inc: { attempts: 1 } },
      );
      return res.status(400).json({ message: 'Incorrect code.' });
    }

    await OTP.deleteMany({ email: user.email });

    // Success: clear the gate and push the next check a year out. `suspended`
    // is deliberately untouched — moderation state is independent of whether a
    // student still receives their college mail.
    user.status = 'active';
    user.lastVerifiedAt = new Date();
    user.reverifyDue = nextReverifyDate();
    await user.save();

    res.json({ ok: true, reverifyDue: user.reverifyDue });
  } catch (err) {
    console.error('Reverify confirm error:', err);
    res.status(500).json({ message: 'Could not complete re-verification' });
  }
});

// @route   GET /api/auth/reverify/status
// @desc    Does this account need the annual student check?
// @access  Private
//
// Called by the client on load. Returns `required: false` inside the grace
// window so a student is nudged rather than blocked, and a college mail
// outage can't strand an entire campus.
router.get('/reverify/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('status reverifyDue lastVerifiedAt college');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const overdue = user.reverifyDue ? new Date(user.reverifyDue) < now : false;
    const days = graceDaysLeft(user.reverifyDue, now);

    /* Three distinct states, and the client must be able to tell them apart:
         required:false, past=false → nothing to do
         required:false, past=true  → nudge only, still inside the grace window
         required:true              → gated until they confirm

       Named off `days` rather than `overdue`, because a student 10 days past
       due and one 30 days past due are both "past" but only the second is
       actually blocked. */
    res.json({
      required: overdue && days < 0,
      pastDue: overdue,
      graceDaysLeft: days,
      reverifyDue: user.reverifyDue,
      college: user.college,
    });
  } catch (err) {
    console.error('Reverify status error:', err);
    res.status(500).json({ message: 'Could not read re-verification status' });
  }
});

// @route   POST /api/auth/logout
// @desc    Clear auth cookie
// @access  Public
router.post('/logout', async (req, res) => {
  try {
    const token =
      req.cookies?.[APP_CONSTANTS.AUTH_COOKIE_NAME] ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await User.findByIdAndUpdate(decoded.id, { lastLogoutAt: new Date() });
    }
  } catch {
    // Invalid/expired token — still proceed to clear the cookie
  }
  clearAuthCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/me
// @desc    Get current user profile from token
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    // protect attaches a LIGHT user (route-critical fields only) for performance.
    // /me must return the FULL profile (photos, prompts, bio, etc.), so re-fetch it.
    const fullUser = await User.findById(req.user._id);
    res.status(200).json(fullUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

```

### ./server/routes/colleges.js

```
import express from 'express';
import { body } from '../middleware/validate.js';
import { validate } from '../middleware/validate.js';
import College from '../models/College.js';
import CollegeRequest from '../models/CollegeRequest.js';
import { extractDomain } from '../utils/collegeDomain.js';
import { collegeRequestLimiter } from '../middleware/rateLimiters.js';
import { collegeGateFilter, getAllowedColleges } from '../utils/campusGate.js';

const router = express.Router();

/**
 * 🏫 PUBLIC COLLEGE ROUTES
 *
 * Two endpoints, both public by necessity — the picker runs before anyone has
 * an account:
 *
 *   GET  /api/colleges          the picker list (active colleges only)
 *   POST /api/colleges/request  "can't find my college, add it"
 *
 * Neither reveals anything about a user: the picker list is campus metadata
 * with no student counts, no emails, and no traffic. College counts are only
 * ever exposed through /api/admin, which is behind adminProtect.
 */

/**
 * @route   GET /api/colleges
 * @desc    Active colleges, for the signup picker. Public — no auth yet.
 */
router.get('/', async (req, res) => {
  try {
    // Search matches the fields a student actually knows: the official name,
    // or just their city/state ("Delhi" → IIT Delhi). `active` only — a
    // deactivated college must not be selectable, but existing students who
    // verified through it are untouched.
    const q = String(req.query.q || '').trim();

    // Gate first, then search. Both merge into one filter so the campus limit
    // cannot be bypassed by supplying a `q` — an `$or` written after this would
    // still be ANDed against `code`, so a gated-out campus stays invisible
    // however it is searched for.
    const filter = { active: true, ...collegeGateFilter() };
    if (q) {
      // Escaped so a student typing "(" can't turn into a regex that throws.
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { city: rx }, { state: rx }];
    }

    const colleges = await College.find(filter).sort({ name: 1 }).limit(50).lean();

    res.json({
      colleges: colleges.map((c) => ({
        code: c.code,
        name: c.name,
        // Domains are returned so the email screen can pre-fill the suffix.
        // This is public campus information (it has to be, for the flow to
        // work) and is NOT user data — no student information is involved.
        domains: c.domains,
        city: c.city,
        state: c.state,
        country: c.country,
      })),
    });
  } catch (err) {
    console.error('Colleges list error:', err);
    res.status(500).json({ message: 'Server error fetching colleges' });
  }
});

/**
 * @route   POST /api/colleges/request
 * @desc    Student asks for their college to be added. Rate limited.
 * @access  Public
 *
 * ⚠️ This does NOT grant access. The requester still cannot sign up — an
 * operator must verify the domain and add the college first. Deliberate: if a
 * request could self-declare a college plus a domain, anyone could invent a
 * fake campus and verify against it, which defeats the entire product.
 *
 * ⚠️ No email is sent here, on purpose. Emailing the submitted address would
 * let an attacker use this form as a message-delivery or account-takeover
 * primitive (submit someone else's address, have a link sent to them).
 * Notification happens only when an operator explicitly presses Notify.
 */
router.post(
  '/request',
  collegeRequestLimiter,
  [
    body('collegeName')
      .isString()
      .withMessage('College name is required')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('College name is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Enter the full name of your college'),
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(),
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name is too long'),
    body('city').optional().trim().isLength({ max: 100 }).withMessage('City is too long'),
    body('state').optional().trim().isLength({ max: 100 }).withMessage('State is too long'),
    body('country').optional().trim().isLength({ max: 100 }).withMessage('Country is too long'),
  ],
  validate,
  async (req, res) => {
    const { collegeName, email, name = '', city = '', state = '', country = '' } = req.body;

    try {
      // If the college already exists, don't create noise — send them to the
      // picker. Rejecting a public-provider address here is deliberate too: a
      // gmail.com address is not evidence of belonging to any campus.
      const domain = extractDomain(email);
      const publicProvider = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com', 'icloud.com'];
      if (!domain || publicProvider.includes(domain)) {
        return res.status(400).json({
          message: 'Please use your college email address so we can verify your campus.',
        });
      }

      const alreadyListed = await College.findOne({
        name: new RegExp(`^${collegeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      });
      if (alreadyListed) {
        return res.status(400).json({ message: 'That college is already listed — please pick it above.' });
      }

      // upsert so a student who submits twice updates their row instead of
      // creating a duplicate. Their request stays visible rather than vanishing
      // into a duplicate pile.
      await CollegeRequest.findOneAndUpdate(
        { email },
        {
          $set: {
            collegeName, name, city, state, country,
            status: 'pending',
            // Clear any previous outcome so re-requesting actually re-enters
            // the operator queue.
            notifiedAt: null,
            collegeCode: '',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      res.status(201).json({
        message: "Thanks! We've received your request. We'll email you when your college is live.",
      });
    } catch (err) {
      // A duplicate-key here is the unique email index racing; the request is
      // already recorded, so this is a success as far as the user is concerned.
      if (err?.code === 11000) {
        return res.status(201).json({
          message: "Thanks! We've received your request. We'll email you when your college is live.",
        });
      }
      console.error('College request error:', err);
      res.status(500).json({ message: 'Server error submitting request' });
    }
  }
);

export default router;
```

### ./server/routes/discover.js

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
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(Date.now() + IST_OFFSET_MS);
    istNow.setUTCHours(0, 0, 0, 0);
    const startOfDay = new Date(istNow.getTime() - IST_OFFSET_MS);
    const dailyCount = await Interaction.countDocuments({
      actorId: currentUser._id,
      actionType: 'align',
      createdAt: { $gte: startOfDay },
    });
    const DAILY_ALIGN_LIMIT = 10;
    if (dailyCount >= DAILY_ALIGN_LIMIT) {
      return res.status(403).json({ message: "Out of aligns. Come back tomorrow." });
    }

    const { note, target } = req.body;
    const safeNote = typeof note === 'string' ? note.trim() : '';
    if (safeNote.length > 140) {
      return res.status(400).json({
        message: 'Note must be 140 characters or fewer.',
        code: 'NOTE_TOO_LONG',
      });
    }

    // 1. THE LEDGER ENTRY
    const alignInteraction = await Interaction.create({
      actorId: currentUser._id,
      targetId,
      actionType: 'align',
      targetArtifact: target || null,
      letterContent: safeNote || null,
      cooldownExpiresAt: null,
    });

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
      const match = await Alignment.findOneAndUpdate(
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
        await session.updateOne({ $addToSet: { servedIds: targetId } });
      }

      return res.status(200).json({
        matched: true,
        alignmentId: match._id,
        user: targetProfile,
      });
    }

    const session = await DiscoverSession.findOne({ viewerId: currentUser._id });
    if (session) {
      await session.updateOne({ $addToSet: { servedIds: targetId } });
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
        $set: { cooldownExpiresAt: new Date(Date.now() + 7 * DAY_MS) },$setOnInsert: { origin: 'pass' },
      },
      { upsert: true, new: true }
    );
    let session = await DiscoverSession.findOne({ viewerId: currentUser._id });
if (!session) {
  session = await DiscoverSession.create({ viewerId: currentUser._id, servedIds: [] });
}
await session.updateOne({ $addToSet: { servedIds: targetId } });
res.status(200).json({ success: true });
  } catch (error) {
    console.error('Pass error:', error);
    res.status(500).json({ message: 'Server error processing pass' });
  }
});

export default router;
```

### ./server/routes/messages.js

```
import express from 'express';
import mongoose from 'mongoose';
import Alignment from '../models/Alignment.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { messageLimiter } from '../middleware/rateLimiters.js';
import { getBlockDirection } from '../middleware/blockFilter.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';

const router = express.Router();

// Validate that a media URL belongs to OUR OWN upload pipeline AND to the user
// sending it. The host/folder check alone is not enough: a user can copy another
// user's media URL out of a conversation and attach it to their own message —
// then deleting that message would destroy the other person's file. Ownership is
// proven by the per-user upload folder. See utils/media.js.
const isValidMediaUrl = (url, userId) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname;
    if (!isProd && (host === 'localhost' || host === '127.0.0.1' ||
        host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('172.'))) {
      return parsed.pathname.startsWith('/uploads/') && isOwnedMediaUrl(url, userId);
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName || host !== 'res.cloudinary.com') return false;
    if (!parsed.pathname.startsWith(`/${cloudName}/`)) return false;
    if (!parsed.pathname.includes('/matchalize/photos/') ||
        !parsed.pathname.includes('/matchalize/audio/')) {
      return isOwnedMediaUrl(url, userId);
    }
    return isOwnedMediaUrl(url, userId);
  } catch {
    return false;
  }
};

// @route   GET /api/messages/:alignmentId/search
// @desc    Search full message history (must be registered before /:alignmentId)
router.get('/:alignmentId/search', protect, async (req, res) => {
  const { alignmentId } = req.params;
  const q = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);

  try {
    const match = await Alignment.findOne({ _id: alignmentId, users: req.user._id, isActive: true });
    if (!match) return res.status(403).json({ message: 'This conversation is no longer available.', code: 'CONVERSATION_GONE' });
    if (!q) return res.status(200).json({ results: [] });

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Searching `text` alone: a photo's caption has always been rendered from
    // `text`, and the separate `caption` field was never written by any route,
    // so the old `caption` branch could never match anything.
    const results = await Message.find({
      alignmentId,
      deleted: false,
      type: { $ne: 'opening_letter' },
      text: { $regex: escaped, $options: 'i' },
    }).sort({ createdAt: -1 }).limit(limit);

    res.status(200).json({ results });
  } catch (e) {
    console.error('Search messages error:', e);
    res.status(500).json({ message: 'Server error searching messages' });
  }
});

// @route   GET /api/messages/:alignmentId
// @desc    Get messages using ObjectId-Based Cursor Pagination
router.get('/:alignmentId', protect, async (req, res) => {
  const { alignmentId } = req.params;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
  const cursor = req.query.cursor;

  try {
    const match = await Alignment.findOne({
      _id: alignmentId,
      users: req.user._id,
      isActive: true,
    });

    if (!match) {
      return res.status(403).json({ message: 'This conversation is no longer available.', code: 'CONVERSATION_GONE' });
    }

    const query = { alignmentId };
    
    // 🚀 COLLISION-PROOF CURSOR: Use ObjectId sequencing instead of timestamps
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    } else if (cursor) {
      // Graceful fallback just in case an older timestamp cursor was passed
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('replyTo', 'text senderId type mediaUrl deleted');

    await Message.updateMany(
      { alignmentId, senderId: { $ne: req.user._id }, readAt: null },
      { $set: { readAt: new Date(), deliveryStatus: 'read' } }
    ).exec();

    const nextCursor = messages.length === limit ? messages[messages.length - 1]._id : null;

    res.status(200).json({
      messages: messages.reverse(), 
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// @route   POST /api/messages/:alignmentId
router.post('/:alignmentId', protect, messageLimiter, async (req, res) => {
  const { alignmentId } = req.params;
  const { text, type, image, replyTo, mediaUrl, caption, clientMsgId } = req.body;

  const hasMedia = (type === 'image' || type === 'audio') && mediaUrl;
  if (!hasMedia && (!text || text.trim() === '')) {
    return res.status(400).json({ message: 'Message cannot be empty' });
  }

  if (mediaUrl && !isValidMediaUrl(mediaUrl)) {
    return res.status(400).json({ message: 'Invalid media URL' });
  }

  if (text && text.length > 5000) {
    return res.status(400).json({ message: 'Message too long (max 5000 characters)' });
  }

  try {
    const match = await Alignment.findOne({
      _id: alignmentId,
      users: req.user._id,
      isActive: true,
    });

    if (!match) return res.status(403).json({ message: 'This conversation is no longer available.', code: 'CONVERSATION_GONE' });

    const otherUserId = match.users.find(u => u.toString() !== req.user._id.toString());
    if (otherUserId) {
      const direction = await getBlockDirection(req.user._id, otherUserId);
      if (direction === 'you_blocked_them') {
        // G2c — state the rule, no blame, and hand the client the id so its
        // "Unblock" action can act. (Old copy: "Cannot send messages to this user".)
        return res.status(403).json({
          message: "You can't message someone you've blocked.",
          code: 'YOU_BLOCKED',
          blockedUserId: otherUserId.toString(),
        });
      }
      if (direction === 'they_blocked_you') {
        // G2d — never reveal a block to the person who was blocked.
        return res.status(403).json({
          message: 'This conversation is no longer available.',
          code: 'CONVERSATION_GONE',
        });
      }
    }

    // IDEMPOTENCY CHECK: Prevent duplicate messages from network retries
    if (clientMsgId) {
      const existingMsg = await Message.findOne({ clientMsgId });
      if (existingMsg) {
        return res.status(200).json(existingMsg);
      }
    }

    if (replyTo) {
      const replyMsg = await Message.findOne({ _id: replyTo, alignmentId });
      if (!replyMsg) return res.status(400).json({ message: 'Reply target not found' });
    }

    const ALLOWED_TYPES = ['text', 'image', 'audio'];
    const safeType = ALLOWED_TYPES.includes(type) ? type : 'text';

    const messageData = {
      alignmentId,
      senderId: req.user._id,
      type: safeType,
    };

    if (text && text.trim()) messageData.text = text.trim();
    if (mediaUrl) messageData.mediaUrl = mediaUrl;
    // `image` is no longer written here — it was a byte-for-byte duplicate of
    // mediaUrl that nothing read. Readers still accept either field
    // (`mediaUrl || image`) so existing messages keep rendering.
    // `caption` is no longer written — it was a dead field. The client never
    // sent it and never read it; the caption under a photo has always been
    // rendered from `text` (see MessageBubble.jsx → PolaroidCard). Kept in the
    // schema as deprecated so existing documents still load cleanly.
    if (replyTo) messageData.replyTo = replyTo;
    if (clientMsgId) messageData.clientMsgId = clientMsgId;

    let message;
    try {
      message = await Message.create(messageData);
    } catch (err) {
      if (err.code === 11000 && clientMsgId) {
        const existing = await Message.findOne({ clientMsgId });
        if (existing) return res.status(200).json(existing);
      }
      throw err;
    }
    const populated = await Message.findById(message._id).populate('replyTo', 'text senderId type mediaUrl deleted');

    match.updatedAt = new Date();
    await match.save();

    const io = req.app.get('io');
    
    // 🌐 MULTI-DEVICE BROADCAST: Send to the alignment room so ALL devices of sender & receiver update instantly
    if (io) {
      io.to(alignmentId.toString()).emit('new-message', populated);
      // Also emit to recipient's personal room for live badge on any tab
      if (otherUserId) {
        io.to(otherUserId.toString()).emit('new-message', {
          alignmentId: alignmentId.toString(),
        });
      }
    }

    if (otherUserId) {
      const sender = await User.findById(req.user._id).select('name');
      addToQueue(() => sendPushNotification(otherUserId, {
        title: sender?.name || 'New Message',
        body: type === 'audio' ? '🎙️ Sent a voice memo' : type === 'image' ? '📷 Sent a photograph' : (text || '').slice(0, 100),
        data: { type: 'message', alignmentId: alignmentId.toString() },
      }));
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

const ALLOWED_REACTION_EMOJIS = new Set(['❤️', '😂', '🔥', '👍', '😲', '😢']);

router.post('/:alignmentId/reaction', protect, messageLimiter, async (req, res) => {
  // messageLimiter (30/10min) was missing here while its sibling POST
  // /:alignmentId already had it. Reactions are one emoji per tap, so an
  // unbounded endpoint just invites tap-spam against someone's messages.
  const { alignmentId } = req.params;
  const { msgId, emoji } = req.body;

  if (!ALLOWED_REACTION_EMOJIS.has(emoji)) {
    return res.status(400).json({ message: 'Invalid reaction emoji' });
  }

  try {
    const match = await Alignment.findOne({ _id: alignmentId, users: req.user._id, isActive: true });
    if (!match) return res.status(403).json({ message: 'Unauthorized' });

    const message = await Message.findOne({ _id: msgId, alignmentId });
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // A deleted message is a tombstone: body, media and reactions are all
    // scrubbed, so there is nothing left to react to. This route used to accept
    // reactions here, which meant anyone could re-populate a removed message's
    // reactions after the fact — and they'd render under "This artifact was
    // removed." Reported as 404 to match the not-found case above rather than
    // leaking that the tombstone exists.
    if (message.deleted) return res.status(404).json({ message: 'Message not found' });

    const existingIdx = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingIdx > -1) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions = message.reactions.filter((r) => r.user.toString() !== req.user._id.toString());
      message.reactions.push({ emoji, user: req.user._id });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(alignmentId.toString()).emit('reaction-update', { msgId: message._id, reactions: message.reactions });
    }

    res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error reacting' });
  }
});

router.delete('/:alignmentId/:msgId', protect, async (req, res) => {
  const { alignmentId, msgId } = req.params;
  try {
    const match = await Alignment.findOne({ _id: alignmentId, users: req.user._id, isActive: true });
    if (!match) return res.status(403).json({ message: 'Unauthorized' });

    const message = await Message.findOne({ _id: msgId, alignmentId });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Can only delete your own messages' });

    // 🧹 CLOUDINARY WIPE: If the message contained a photo or voice note, vaporize it from cloud storage!
    if (message.mediaUrl || message.image) {
      deleteCloudinaryFile(message.mediaUrl || message.image, req.user._id);
    }

    message.deleted = true;
    message.text = '';
    message.image = '';
    message.mediaUrl = '';
    // Reactions are scrubbed too. They used to survive deletion, which left
    // someone else's emoji permanently attached to a message that now reads
    // "This artifact was removed." Clearing them here is only meaningful
    // alongside the `deleted` guard on the reaction route, which stops new ones
    // arriving afterwards.
    message.reactions = [];
    // `replyTo` and `clientMsgId` are intentionally left alone: replyTo is
    // structural (other messages point at this one, and wiping it would break
    // their reply previews), and clientMsgId is the idempotency key that stops a
    // retried send creating a duplicate.
    await message.save();

    const io = req.app.get('io');
    if (io) io.to(alignmentId.toString()).emit('message-deleted', { msgId: message._id });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting message' });
  }
});

export default router;

```

### ./server/routes/notifications.js

```
import express from 'express';
import Notification from '../models/Notification.js';
import Interaction from '../models/Interaction.js';
import Alignment from '../models/Alignment.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { areBlocked } from '../middleware/blockFilter.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';

const router = express.Router();

// @route   GET /api/notifications/vapid-key
// @desc    Get VAPID public key for push subscription
// @access  Private
router.get('/vapid-key', protect, (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({ message: 'Push notifications not configured' });
  }
  res.status(200).json({ publicKey: key });
});

// @route   POST /api/notifications/subscribe
// @desc    Save push subscription
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: subscription });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving subscription' });
  }
});

// @route   DELETE /api/notifications/subscribe
// @desc    Remove push subscription
// @access  Private
router.delete('/subscribe', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: null });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error removing subscription' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread (uncleared) notification count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user._id,
      isCleared: false,
    });
    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching unread count' });
  }
});

// @route   GET /api/notifications
// @desc    Get all notifications for the current user (paginated)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Clamped. `parseInt('-1') || 1` yields -1 (truthy), so a negative page
    // reached `$skip: -40`, which MongoDB rejects — a 500 plus a log-spam
    // vector. The limit was previously uncapped, so ?limit=1e9 went straight
    // to Mongo. admin.js already used this form.
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const filter = { recipientId: req.user._id, isCleared: false };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('senderId', 'name photos year gender pronouns interests age bio prompts suspended isDeleted')
      .populate('interactionRef');

    res.status(200).json({
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// @route   POST /api/notifications/:id/accept
// @desc    Accept an incoming letter/telegram: create the Alignment + opening letter, clear the notification
// @access  Private
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user._id,
      isCleared: false,
    }).populate('interactionRef');
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const incoming = notification.interactionRef; // actorId = original sender, targetId = me
    if (!incoming) {
      return res.status(400).json({ message: 'Notification has no linked interaction' });
    }

    const originalSender = incoming.actorId;
    const me = req.user._id;

    // 🚫 BLOCK CHECK — must come before anything mutates state.
    //
    // This route used to run no Block lookup at all. The attack: A sends B a
    // letter (creates a Notification that survives the block), B blocks A (which
    // deactivates the alignment), B later opens their inbox and taps Accept on
    // A's stale letter — and the `isActive: true` write below silently undid the
    // block. The chat reappeared in B's Matches list for both sides. Sending was
    // still refused by messages.js, so no content leaked, but the relationship
    // un-blocked itself.
    //
    // The message is deliberately indistinguishable from an unknown id, so the
    // sender cannot probe whether a specific person blocked them.
    if (await areBlocked(me, originalSender)) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if the original sender is suspended or deleted
    const senderUser = await User.findById(originalSender).select('suspended isDeleted').lean();
    if (!senderUser || senderUser.isDeleted || senderUser.suspended) {
      return res.status(410).json({ message: 'This profile is no longer available', code: 'USER_UNAVAILABLE' });
    }

    // Record my response (bypasses the daily like limit) so they're excluded from the deck
    const alreadyResponded = await Interaction.findOne({
      actorId: me,
      targetId: originalSender,
      /* 'align' added: this was the single most important line in the accept
         flow after Align shipped. Without it, someone who had ALREADY aligned
         back was treated as if they had never responded, so the accept wrote a
         second, duplicate response row every time. The match still built — the
         bug was invisible in the UI and visible only as ledger growth. */
      actionType: { $in: ['align', 'letter', 'telegram'] },
    });
    
    if (!alreadyResponded) {
      await Interaction.create({
        actorId: me,
        targetId: originalSender,
        actionType: 'accept_letter',
        letterContent: null,
        targetArtifact: null,
        cooldownExpiresAt: null,
      });
    }

    const pairKey = [me.toString(), originalSender.toString()].sort().join('__');

    // 1. ATOMIC UPSERT: Prevents duplicate key crashes if both users accept simultaneously
    const match = await Alignment.findOneAndUpdate(
      { pairKey },
      {
        $setOnInsert: {
          pairKey,
          users: [me, originalSender],
        },
        $set: {
          isActive: true,
          unlockedByInteractionId: incoming._id,
        },
      },
      { upsert: true, new: true }
    );

    // AUTO-GENERATE THE OPENING LETTER (atomic upsert — no duplicate race).
    // The partial unique index on { alignmentId, type } in Message.js enforces
    // at most ONE opening_letter per alignment at the DB level.
    const senderProfile = await User.findById(originalSender).select('photos prompts');
    let msgData = {
      alignmentId: match._id,
      senderId: originalSender,
      type: 'opening_letter',
      deliveryStatus: 'sent',
      text: incoming.letterContent || '',
    };

    const target = incoming.targetArtifact;
    if (target?.startsWith('photo_')) {
      const idx = parseInt(target.split('_')[1], 10);
      const url = senderProfile.photos?.[idx] || senderProfile.photos?.[0];
      if (url) {
        // `image` no longer written — it duplicated mediaUrl and nothing read it.
        // Readers still accept either field, so existing messages keep working.
        msgData.mediaUrl = url;
        msgData.text = incoming.letterContent || '';
      }
    } else if (target?.startsWith('prompt_')) {
      const idx = parseInt(target.split('_')[1], 10);
      const q = senderProfile.prompts?.[idx]?.question;
      if (q) {
        msgData.text = incoming.letterContent ? `"${q}"\n\n${incoming.letterContent}` : `"${q}"`;
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

    notification.isCleared = true;
    await notification.save();

    const meUser = await User.findById(me).select(
      'name photos bio year pronouns interests prompts intent'
    );
    
    const io = req.app.get('io');
    if (io) {
      // Real-time socket ping for immediate UI update if User A has the app open
      io.to(originalSender.toString()).emit('match-notification', {
        _id: match._id,
        alignmentId: match._id,
        interactionRef: incoming._id,
        targetArtifact: incoming.targetArtifact,
        letterContent: incoming.letterContent,
        user: meUser,
      });
    }

    // 2. DOPAMINE PUSH: Fire background notification to User A's lock screen
    addToQueue(() => sendPushNotification(originalSender, {
      title: 'You have a new conversation!',
      body: `${req.user.name} accepted your letter!`,
      data: { 
        type: 'alignment', 
        alignmentId: match._id.toString() 
      },
    }));

    res.status(200).json({ success: true, alignmentId: match._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error accepting notification' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a single notification as cleared
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isCleared: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as cleared
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isCleared: false },
      { isCleared: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error marking all as read' });
  }
});

// @route   PUT /api/notifications/:id/dismiss
// @desc    Dismiss (clear) a notification
// @access  Private
router.put('/:id/dismiss', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isCleared: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error dismissing notification' });
  }
});

export default router;

```

### ./server/routes/report.js

```
import express from 'express';
import Report from '../models/Report.js';
import Block from '../models/Block.js';
import Alignment from '../models/Alignment.js';
import User from '../models/User.js';
import Interaction from '../models/Interaction.js';
import { protect } from '../middleware/auth.js';
import { REPORT_REASONS } from '../models/Report.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';

const router = express.Router();

// @route   GET /api/report/reasons
// @desc    Get available report reasons
// @access  Private
router.get('/reasons', protect, (req, res) => {
  res.status(200).json({ reasons: REPORT_REASONS });
});

// @route   POST /api/report/:userId
// @desc    Report a user (auto-suspend after 3 unique reporters)
// @access  Private
router.post('/:userId', protect, async (req, res) => {
  const { reason, details } = req.body;
  const reportedId = req.params.userId;

  if (!reason || !REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ message: 'Valid reason is required' });
  }

  if (reportedId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot report yourself' });
  }

  try {
    // '+suspendedReason' only lifts that field's default exclusion — the rest
    // of the document still comes back, so the escalation below does not write
    // undefined over any other field.
    const reported = await User.findById(reportedId).select('+suspendedReason');
    if (!reported) return res.status(404).json({ message: 'User not found' });

    // Dismissed-aware report: a dismissed report can be re-opened by the same
    // reporter; an active one still rejects duplicates (keeps the unique index valid).
    const existingReport = await Report.findOne({ reporter: req.user._id, reported: reportedId });
    let report;
    if (existingReport && existingReport.status === 'dismissed') {
      existingReport.reason = reason;
      existingReport.details = details || '';
      existingReport.status = 'pending';
      existingReport.createdAt = new Date();
      report = await existingReport.save();
    } else if (existingReport) {
      return res.status(409).json({ message: 'Already reported this user' });
    } else {
      report = await Report.create({
        reporter: req.user._id,
        reported: reportedId,
        reason,
        details: details || '',
      });
    }

    // Escalation: count only non-dismissed reports so admin dismissals work
    const activeReportCount = await Report.countDocuments({
      reported: reportedId,
      status: { $ne: 'dismissed' },
    });

    // Escalate only. Never auto-clear a restriction an admin applied.
    if (activeReportCount >= 5) {
      reported.suspended = true;
      reported.suspendedAt = reported.suspendedAt || new Date();
      reported.suspendedReason = reported.suspendedReason || 'Multiple community reports';
      reported.shadowbannedAt = reported.shadowbannedAt || new Date();
      reported.contentFrozen = false;
      await reported.save();
    } else if (activeReportCount >= 3) {
      reported.shadowbannedAt = reported.shadowbannedAt || new Date();
      reported.contentFrozen = true;
      await reported.save();
    }
    // activeReportCount < 3 → leave the account as an admin last set it.

    res.status(201).json({ message: 'Report submitted', reportId: report._id });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Already reported this user' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error submitting report' });
  }
});

// @route   POST /api/block/:userId
// @desc    Block a user
// @access  Private
router.post('/block/:userId', protect, async (req, res) => {
  const blockedId = req.params.userId;

  if (blockedId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot block yourself' });
  }

  try {
    const blockedUser = await User.findById(blockedId);
    if (!blockedUser) return res.status(404).json({ message: 'User not found' });

    await Block.findOneAndUpdate(
      { blocker: req.user._id, blocked: blockedId },
      { blocker: req.user._id, blocked: blockedId },
      { upsert: true, new: true }
    );

    // Deactivate any existing alignment
    const match = await Alignment.findOne({
      users: { $all: [req.user._id, blockedId] },
      isActive: true,
    });
    if (match) {
      match.isActive = false;
      await match.save();
    }

    // Create permanent exclusion so they never appear in each other's Discover deck
    await Interaction.create([
      { actorId: req.user._id, targetId: blockedId, actionType: 'archive', cooldownExpiresAt: null, origin: 'block' },
      { actorId: blockedId, targetId: req.user._id, actionType: 'archive', cooldownExpiresAt: null, origin: 'block' },
    ]);

    const io = req.app.get('io');
    if (io) {
      io.to(blockedId).emit('unmatch-notification', { alignmentId: match?._id });
    }

    // In-app (socket 'unmatch-notification') + push already notify the blocked user.
    // No Notification DB row is created — the model is purpose-built for letter interactions.
    // Deliberately does NOT name who blocked them. A named notification confirms
    // both that a block happened and that the blocker is still active on the
    // platform. A generic message keeps the block indistinguishable from an
    // ordinary unmatch.
    addToQueue(() => sendPushNotification(blockedId, {
      title: 'Matchalize',
      body: 'This conversation is no longer available.',
    }));

    res.status(200).json({ message: 'User blocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error blocking user' });
  }
});

// @route   DELETE /api/block/:userId
// @desc    Unblock a user
// @access  Private
router.delete('/block/:userId', protect, async (req, res) => {
  try {
    await Block.findOneAndDelete({
      blocker: req.user._id,
      blocked: req.params.userId,
    });

    // Remove permanent exclusion so they can re-encounter in Discover.
    // Only block-created archives are reversed — unmatches/passes stay permanent.
    await Interaction.deleteMany({
      origin: 'block',
      $or: [
        { actorId: req.user._id, targetId: req.params.userId, actionType: 'archive' },
        { actorId: req.params.userId, targetId: req.user._id, actionType: 'archive' },
      ],
    });
    res.status(200).json({ message: 'User unblocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error unblocking user' });
  }
});

// @route   GET /api/block/list
// @desc    Get list of blocked users
// @access  Private
router.get('/list', protect, async (req, res) => {
  try {
    const blocks = await Block.find({ blocker: req.user._id })
      .populate('blocked', 'name photos year pronouns')
      .sort({ createdAt: -1 });

    res.status(200).json({
      blocked: blocks.map((b) => ({
        _id: b.blocked._id,
        name: b.blocked.name,
        photo: b.blocked.photos?.[0],
        year: b.blocked.year,
        pronouns: b.blocked.pronouns,
        blockedAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching blocked users' });
  }
});

// 🚫 REMOVED: GET /api/report/block/status/:userId
//
// It answered a SYMMETRIC question — `{ isBlocked, iBlockedThem }` for ANY pair
// of user ids — which made it an oracle: probe any id and learn definitively that
// a block exists, and in which direction. That tells a blocked person they were
// blocked specifically, which is exactly what blocking exists to conceal (it also
// confirms the blocker is still on the platform).
//
// Nothing in the client ever called it (only POST /block/:id from Chat.jsx and
// DELETE /block/:id from Settings.jsx), so it was pure attack surface with no
// product purpose. If a UI ever needs "did *I* block this person", re-add it
// scoped to `{ blocker: req.user._id }` only — never the symmetric $or.

export default router;

```

### ./server/routes/upload.js

```
import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

const ALLOWED_MIME = /^image\/(jpeg|png|webp)$|^audio\/(mpeg|mp4|webm|ogg|x-m4a)$/;
const ALLOWED_EXT = /\.(jpe?g|png|webp|mp3|m4a|mp4|webm|ogg)$/i;
const fileFilter = (req, file, cb) => {
  if (ALLOWED_EXT.test(file.originalname) && ALLOWED_MIME.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only jpg/png/webp images and mp3/m4a/webm/ogg audio are allowed.'), false);
  }
};

let upload;

if (isCloudinaryConfigured) {
  const { v2: cloudinary } = await import('cloudinary');
  const { CloudinaryStorage } = await import('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isAudio = file.mimetype.startsWith('audio/');
      // Per-user folder: the URL is the only durable proof of who owns a file
      // (one Cloudinary account holds everyone's media), so the uploader's id
      // must be part of the path. See utils/media.js.
      return {
        folder: isAudio
          ? `matchalize/audio/${req.user._id}`
          : `matchalize/photos/${req.user._id}`,
        allowed_formats: isAudio
          ? ['mp3', 'mp4', 'm4a', 'webm', 'ogg']
          : ['jpg', 'jpeg', 'png', 'webp'],
        ...(isAudio ? {} : {
          transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
        }),
      };
    },
  });

  upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
} else {
  const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.user._id}-${Date.now()}${ext}`);
    },
  });

  upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
}

const router = express.Router();

router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const url = isCloudinaryConfigured
      ? req.file.path
      : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

/**
 * 🔐 CLOUDINARY MODERATION WEBHOOK
 *
 * Cloudinary POSTs here whenever an uploaded asset's moderation status is
 * decided. If it was REJECTED, the asset is destroyed immediately — the whole
 * point is that flagged content never sits in your bucket.
 *
 * AUTHENTICATION: Cloudinary signs each request with
 *   SHA1(rawBody + x-cld-timestamp + CLOUDINARY_API_SECRET)
 * so an attacker cannot forge one without your API secret, which makes the
 * `{ force: true }` destroy below safe. (Force exists because there is no user
 * to check folder ownership against — the URL came from Cloudinary, not a
 * client.)
 *
 * ⚠️ The signature covers the RAW bytes, so this route needs an unparsed body.
 * The `express.raw()` registration lives in index.js, ABOVE the global
 * express.json(), because body-parser refuses to re-parse a request it has
 * already consumed. See the note there — getting that order wrong made this
 * endpoint return 401 for every request and the cleanup never ran once.
 *
 * Rejection is always answered 200 (never 4xx): a non-2xx makes Cloudinary
 * retry, and a retry re-runs the destroy. Only a malformed request gets 400.
 */
router.post('/moderation-status', async (req, res) => {
  const timestamp = req.headers['x-cld-timestamp'];
  const signature = req.headers['x-cld-signature'];
  if (!timestamp || !signature) return res.status(401).json({ message: 'Missing signature' });

  // Defensive: if the raw parser above were ever removed or reordered, req.body
  // would be a parsed object and the digest below would silently never match.
  // Fail loudly instead of quietly 401-ing forever.
  if (!Buffer.isBuffer(req.body)) {
    console.error(
      '[moderation-status] req.body is not a Buffer — the express.raw() registration in index.js must come BEFORE express.json()'
    );
    return res.status(500).json({ message: 'Webhook body was not received raw' });
  }
  const body = req.body.toString();

  // Replay guard: the signature is valid forever without this, so an observed
  // request could be replayed indefinitely. Cloudinary's own docs recommend
  // rejecting stale timestamps. Retries are seconds apart, so a 1h window is
  // generous while still bounding exposure.
  const ts = Number(timestamp);
  const ageMs = Date.now() - ts * 1000;
  if (!Number.isFinite(ts) || ageMs > 3600_000) {
    return res.status(401).json({ message: 'Stale signature' });
  }

  const expected = crypto
    .createHash('sha1')
    .update(body + timestamp + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  // Constant-time compare: a plain !== leaks how many leading characters matched
  // through response timing. Cheap to do correctly, so do it.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  try {
    const payload = JSON.parse(body);
    const status = payload?.moderation?.[0]?.status;
    const url = payload?.secure_url || payload?.url;

    if (status === 'rejected' && url) {
      deleteCloudinaryFile(url, null, { force: true })
        .then(() => res.status(200).json({ received: true }))
        .catch((err) => {
          console.error('Moderation cleanup failed:', err);
          res.status(200).json({ received: true });
        });
      return;
    }
    res.status(200).json({ received: true });
  } catch {
    res.status(400).json({ message: 'Bad payload' });
  }
});

export default router;

```

### ./server/routes/users.js

```
import express from 'express';
import { body } from '../middleware/validate.js';
import User from '../models/User.js';
import DiscoverSession from '../models/DiscoverSession.js';
import Alignment from '../models/Alignment.js';
import Block from '../models/Block.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import Analytics from '../models/Analytics.js';
import { protect, clearAuthCookie } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';
import { isOwnedMediaUrl, isAcceptableMediaUrl } from '../utils/media.js';
import { computeAgeFromDob } from '../utils/age.js';
import { sanitizeLatLng, isFreshLocation, haversineKm, LOCATION_DRIFT_KM } from '../utils/geo.js';
import { computeScore, MAX_PHOTOS, MAX_PROMPTS } from '../utils/ladder.js';
import OTP from '../models/OTP.js';
import { resolveCollege } from './auth.js';
import College from '../models/College.js';
import { verifyOtp, normalizeEmail } from '../utils/otpHash.js';
import { toPublicCard } from '../utils/publicCard.js';
import { GENDERS, INTENTS, DEPRECATED_INTENTS, INTEREST_TAGS, APP_CONSTANTS } from '../config/appData.js';

const router = express.Router();

// Prompt answer/question length bounds. Mirrored by `maxLength` on the two client
// textareas (Onboarding.jsx, Profile.jsx) and enforced in the schema as a
// backstop. Keep all three in sync.
const PROMPT_LIMITS = { question: 200, answer: 300 };

/**
 * Normalise a submitted `interests` array.
 *
 * Caps to MAX_INTERESTS and drops anything that is not actually in
 * INTEREST_TAGS. Both halves matter: the cap is enforced HERE rather than
 * trusted from the client (a client-side cap is a UI affordance, not a
 * constraint), and the tag check stops a crafted request from stuffing
 * arbitrary strings into a field that renders on other people's cards.
 *
 * Order is preserved and duplicates removed — the client renders them in the
 * order chosen, which is part of what the selection means.
 */
const normaliseInterests = (raw) => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const value of raw) {
    if (typeof value !== 'string') continue;
    const tag = INTEREST_TAGS.includes(value) ? value : null;
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= APP_CONSTANTS.MAX_INTERESTS) break;
  }
  return out;
};

/**
 * Normalise a submitted `intent` array, mapping any retired value forward.
 *
 * The mapping is the important part. Without it, a profile saved before the
 * "Study Buddy" → "Activity Partner" rename keeps the old string forever, which
 * is still a valid-looking value, so validation passes and the profile silently
 * stops matching anyone who picked the new name. Mapping on write means even an
 * untouched profile heals the next time its owner saves.
 *
 * ⚠️ NO LENGTH CAP. This used to stop at APP_CONSTANTS.MAX_INTENTS (2), on the
 * argument that a profile claiming everything stops discriminating. That
 * argument does not survive having only three options — holding all three is
 * nearly the same as saying "no preference", which is honest — and the cap had a
 * cost of its own: a genuinely open person had to lie about one, and a user who
 * tapped a third chip and watched it not stick had no way to tell that from a
 * bug. All three may now be held. Ranking still benefits from naming one, so the
 * signal is preserved where it is actually useful.
 *
 * Duplicates are still collapsed: mapping "Study Buddy" and "Activity Partner"
 * onto the same value would otherwise store the same intent twice. */
const normaliseIntent = (raw) => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const value of raw) {
    if (typeof value !== 'string') continue;
    const mapped = DEPRECATED_INTENTS[value] || value;
    if (!INTENTS.includes(mapped) || seen.has(mapped)) continue;
    seen.add(mapped);
    out.push(mapped);
  }
  return out;
};

/**
 * The limits the USER SCHEMA enforces, mirrored here so over-length input
 * produces a legible 400 instead of a 500.
 *
 * Why this must exist: Mongoose throws a ValidationError on `.save()`, and these
 * routes' generic `catch` turns ANY thrown error into "Server error updating
 * profile". So a user who typed a 70-character name was told the server broke,
 * then had no idea why shortening it worked. Six fields had this problem.
 *
 * ⚠️ Keep in sync with the maxlength values in models/User.js. If you change one
 * there, change it here — a mismatch means the schema is the only thing enforcing
 * the field, which reintroduces the 500.
 */
const FIELD_LIMITS = {
  name: 60,
  pronouns: 30,
  year: 40,
  bio: 160,
};

/** Human-readable field labels for the error message. */
const FIELD_LABELS = {
  name: 'Name',
  pronouns: 'Pronouns',
  year: 'Year',
  bio: 'Bio',
};

/**
 * @returns {string|null} an error message, or null when everything is in bounds
 */
const validateFieldLengths = (body) => {
  for (const [field, max] of Object.entries(FIELD_LIMITS)) {
    const value = body?.[field];
    // Only string values are checked; absent/optional fields are skipped, and a
    // non-string is left to the schema to reject.
    if (typeof value !== 'string') continue;
    if (value.length > max) {
      return `${FIELD_LABELS[field]} must be ${max} characters or fewer.`;
    }
  }
  return null;
};

// The complete set of accepted `interestedIn` values. GENDERS is the canonical
// list served to the client (routes/config.js:37); 'Everyone' is the opt-out
// that discover.js filters out at :272, and is what Onboarding.jsx offers.
const INTERESTED_IN_VALUES = [...GENDERS, 'Everyone'];

/**
 * Validate the "show me" preference list.
 *
 * Why this must exist: the field had NO validation at all — not a whitelist, not
 * a type check, not a length cap — and the schema is a bare [String]. The failure
 * mode is silent and permanent: discover.js:272 builds `{ gender: { $in: myGenders } }`
 * from whatever is stored. A single unrecognised value ('everyone' with the wrong
 * case, 'Other ' with a trailing space) matches zero profiles, so the user's deck
 * is permanently empty with no error, no explanation, and no way to diagnose it
 * from the UI. Worse, `interestedIn: {}` is a Mongoose CastError → 500.
 *
 * @returns {string|null} error message, or null when valid
 */
const validateInterestedIn = (value) => {
  if (value === undefined) return null;
  if (!Array.isArray(value)) {
    return 'Gender preference must be a list.';
  }
  if (value.length === 0) return null;
  for (const pref of value) {
    if (typeof pref !== 'string') {
      return 'Gender preference must be a list of text values.';
    }
    if (!INTERESTED_IN_VALUES.includes(pref)) {
      return `"${pref}" is not a valid gender preference. Choose from: ${INTERESTED_IN_VALUES.join(', ')}.`;
    }
  }
  return null;
};

const validatePromptLengths = (prompts) => {
  for (const p of prompts) {
    const answer = typeof p?.answer === 'string' ? p.answer : '';
    if (answer.length > PROMPT_LIMITS.answer) {
      return `Prompt answers must be ${PROMPT_LIMITS.answer} characters or fewer.`;
    }
    const question = typeof p?.question === 'string' ? p.question : '';
    if (question.length > PROMPT_LIMITS.question) {
      return `Prompt questions must be ${PROMPT_LIMITS.question} characters or fewer.`;
    }
  }
  return null;
};

// Helper to collect all photo URLs (profile photos, bio photo, prompt attachments) from a user document
const collectUserPhotos = (u) => {
  const urls = new Set();
  if (u.photos && Array.isArray(u.photos)) u.photos.forEach(url => url && urls.add(url));
  if (u.bioPhoto) urls.add(u.bioPhoto);
  if (u.prompts && Array.isArray(u.prompts)) {
    u.prompts.forEach(p => p.photoUrl && urls.add(p.photoUrl));
  }
  return urls;
};

// Validate a profile image URL.
// Beyond shape/host checks, the file must be one THIS user uploaded (or a
// read-only Unsplash placeholder). A bare host check is not enough: photos are
// public in Discover, so any user can copy someone else's URL into their own
// profile — and saving/swapping/deleting it would then destroy their file.
const isValidImageUrl = (url, userId) => {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);

    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && parsed.protocol !== 'https:') return false;

    const hostname = parsed.hostname;

    if (!isProd && (
      hostname === 'localhost' || 
      hostname === '127.0.0.1' ||
      hostname.startsWith('10.') || 
      hostname.startsWith('192.168.') || 
      hostname.startsWith('172.')
    )) {
      // Dev disk fallback: filenames are <userId>-<timestamp>.<ext>
      return /\.(jpg|jpeg|png|webp)$/i.test(parsed.pathname) && isOwnedMediaUrl(url, userId);
    }

    const trustedHosts = [
      'res.cloudinary.com',
      'images.unsplash.com',
    ];

    const isTrusted = trustedHosts.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );

    if (!isTrusted) return false;
    if (!/\.(jpg|jpeg|png|webp)$/i.test(parsed.pathname)) return false;

    // OWNERSHIP: your own upload, or an Unsplash placeholder we can never delete.
    return isAcceptableMediaUrl(url, userId);
  } catch {
    return false;
  }
};

// @route   POST /api/users/setup
// @desc    Complete onboarding registration
router.post(
  '/setup',
  protect,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('age').isInt({ min: 18, max: 40 }).withMessage('Must be between 18 and 40'),
    body('dob').isISO8601().withMessage('Date of birth is required and must be a valid date'),
    body('gender').notEmpty().withMessage('Gender is required'),
    body('year').notEmpty().withMessage('Year is required'),
    body('graduatingYear')
      .optional({ nullable: true })
      .isInt({ min: new Date().getFullYear(), max: new Date().getFullYear() + 10 })
      .withMessage('Enter a graduation year between now and the next 10 years'),
    body('intent').custom((val) => {
      if (Array.isArray(val)) return val.length > 0;
      return typeof val === 'string' && val.trim() !== '';
    }).withMessage('At least one connection intent is required'),
  ],
  validate,
  async (req, res) => {
    const {
      name, gender, pronouns, year, bio, bioPhoto,
      prompts, photos, intent, interestedIn, interests, dob,
      graduatingYear, currentLatLng,
    } = req.body;

    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (user.contentFrozen) {
        return res.status(403).json({
          message: 'Edits are paused while your account is under review.',
          code: 'CONTENT_FROZEN',
        });
      }

      // VALIDATION: Check image URLs
      const photosToSave = (Array.isArray(photos) ? photos : []).filter(Boolean).slice(0, MAX_PHOTOS);
      if (!photosToSave.every(p => isValidImageUrl(p, req.user._id))) {
        return res.status(400).json({ message: 'One or more photo URLs are invalid.' });
      }

      // bioPhoto used to be assigned with NO validation at all, so it was the
      // easiest way to plant someone else's photo URL on a profile.
      if (bioPhoto && !isValidImageUrl(bioPhoto, req.user._id)) {
        return res.status(400).json({ message: 'Bio photo URL is invalid.' });
      }

      const promptsToSave = Array.isArray(prompts) ? prompts.slice(0, MAX_PROMPTS) : [];
      if (promptsToSave.some(p => p.photoUrl && !isValidImageUrl(p.photoUrl, req.user._id))) {
        return res.status(400).json({ message: 'One or more prompt photo URLs are invalid.' });
      }
      const promptLengthError = validatePromptLengths(promptsToSave);
      if (promptLengthError) return res.status(400).json({ message: promptLengthError });

      const setupLengthError = validateFieldLengths(req.body);
      if (setupLengthError) return res.status(400).json({ message: setupLengthError });

      const setupInterestedInError = validateInterestedIn(interestedIn);
      if (setupInterestedInError) return res.status(400).json({ message: setupInterestedInError });

      const oldPhotos = collectUserPhotos(user);

      user.name = name;
      // Server-side age computation — never trust client-supplied age
      const dobDate = new Date(dob);
      const computedAge = computeAgeFromDob(dobDate);
      if (!Number.isFinite(computedAge) || computedAge < 18 || computedAge > 40) {
        return res.status(400).json({ message: 'Must be between 18 and 40' });
      }
      user.age = computedAge;
      user.dob = dobDate;
      user.gender = gender;
      user.pronouns = pronouns || '';
      user.year = year;
      user.graduatingYear = Number.isFinite(graduatingYear) ? graduatingYear : user.graduatingYear;
      user.bio = bio || '';
      user.bioPhoto = bioPhoto || '';
      user.prompts = promptsToSave;
      user.photos = photosToSave;
      user.intent = normaliseIntent(intent);
      user.interestedIn = interestedIn || [];
      user.interests = normaliseInterests(interests);
      user.isOnboarded = true;

      /* 📍 Location from the onboarding step, which now REQUIRES an answer:
         either a granted reading or an explicit pick of the campus fallback.

         A reading is rounded here, on the server, so the precise value never
         reaches the database — see the full note on PUT /api/users/location. */
      if (currentLatLng !== undefined && currentLatLng !== null) {
        const clean = sanitizeLatLng(currentLatLng);
        /* Still not an error on a MALFORMED pair — onboarding must not fail
           over a bad coordinate, and a broken client should not strand someone
           mid-signup. The fallback below is what keeps the ranking basis
           defined either way. */
        if (clean) {
          user.currentLatLng = clean;
          user.locationSource = 'gps';
          user.locationUpdatedAt = new Date();
        } else {
          user.locationSource = 'campus';
        }
      } else {
        /* No reading offered, or the user declined. Record the deliberate
           campus choice explicitly rather than leaving `locationSource` null,
           because null previously meant three different things — "declined",
           "never asked", and "onboarding predates the question" — and the feed's
           fallback notice can only be honest if it can tell them apart.

           Nothing is stored positionally here: a campus-backed user has NO
           coordinates, and the discover pipeline resolves their college's
           coordinates at query time (see the candidate-position block in
           routes/discover.js). Storing a copy would freeze them at signup and
           make a later college change look like a stale location. */
        user.locationSource = 'campus';
      }

      // Ladder: last write before save, so one document never carries a score
      // that disagrees with its own fields.
      user.profileScore = computeScore(user);

await user.save();

    broadcastProfileUpdate(req, user);


      // 🧹 VAPORIZE ORPHANED PHOTOS: Delete any old photo that isn't in the new profile
      const newPhotos = collectUserPhotos(user);
      oldPhotos.forEach(url => {
        if (!newPhotos.has(url)) deleteCloudinaryFile(url, req.user._id);
      });

      // ANALYTICS: Track completion
      await Analytics.create({ user: req.user._id, event: 'ONBOARDING_COMPLETE', step: 8 });

      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during onboarding setup' });
    }
  }
);

// @route   GET /api/users/profile
// @desc    Get user's own profile
// @access  Private
/* ── LIVE DECK UPDATE ──────────────────────────────────────────────────────
   Broadcast so any deck currently showing this person's card repaints without
   waiting for a refetch.

   Without it an edit is only visible the next time a viewer happens to fetch
   that profile — and the deck serves a localStorage snapshot on return, so
   "next time" can be never. Two people editing and reviewing each other is the
   normal loop here, so a stale card reads as "my save didn't work".

   Broadcast rather than per-user: the payload is exactly the public card
   projection (utils/publicCard.js — the SAME helper routes/discover.js uses, so
   the campus badge cannot leak down a path the deck already closes), and every
   client ignores ids it isn't showing. Tracking who might hold you in their
   deck would need a reverse index that isn't worth it for a payload this small.

   `profileScore` rides along so a card's own score refreshes. The viewer's own
   gate is unaffected: it reads /auth/me, not this. */
function broadcastProfileUpdate(req, user) {
  try {
    const io = req.app.get('io');
    if (io) io.emit('profile-updated', { ...toPublicCard(user), _id: user._id.toString() });
  } catch (err) {
    // Never fail a save because the realtime path is unhappy — a 500 here would
    // lose the user's actual edits. The next refetch still converges.
    console.error('profile-updated broadcast failed:', err.message);
  }
}

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile details
// @access  Private
router.put('/profile', protect, async (req, res) => {
    const {
    name,
    gender,
    pronouns,
    year,
    bio,
    bioPhoto,
    prompts,
    photos,
    intent,
    interestedIn,
    interests,
    graduatingYear,
    showCollege,
    gapYear,
  } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.contentFrozen) {
      return res.status(403).json({
        message: 'This feature is temporarily unavailable. Contact support@matchalize.com',
        code: 'CONTENT_FROZEN',
      });
    }

    const lengthError = validateFieldLengths(req.body);
    if (lengthError) return res.status(400).json({ message: lengthError });

    const interestedInError = validateInterestedIn(interestedIn);
    if (interestedInError) return res.status(400).json({ message: interestedInError });

    const oldPhotos = collectUserPhotos(user);

    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (pronouns !== undefined) user.pronouns = pronouns;
    if (year) user.year = year;
    if (graduatingYear !== undefined && graduatingYear !== null && graduatingYear !== '') {
      const y = Number(graduatingYear);
      // Clamped to the same window the signup validator uses: a graduating year
      // is a user-asserted signal about enrolment, so it must at least be
      // plausible. Never trusted to be proof — the annual re-check is.
      const currentYear = new Date().getFullYear();
      if (!Number.isFinite(y) || y < currentYear || y > currentYear + 10) {
        return res.status(400).json({
          message: `Enter a graduation year between ${currentYear} and ${currentYear + 10}.`,
        });
      }
      user.graduatingYear = y;
    }
    if (bio !== undefined) user.bio = bio;
    if (prompts) {
      const promptsToSave = Array.isArray(prompts) ? prompts.slice(0, MAX_PROMPTS) : [];
      if (promptsToSave.some(p => p.photoUrl && !isValidImageUrl(p.photoUrl, req.user._id))) {
        return res.status(400).json({ message: 'One or more prompt photo URLs are invalid.' });
      }
      const promptLengthError = validatePromptLengths(promptsToSave);
      if (promptLengthError) return res.status(400).json({ message: promptLengthError });
      user.prompts = promptsToSave;
    }
    if (photos) {
      const photosToSave = (Array.isArray(photos) ? photos : []).filter(Boolean).slice(0, MAX_PHOTOS);
      if (!photosToSave.every(p => isValidImageUrl(p, req.user._id))) {
        return res.status(400).json({ message: 'One or more photo URLs are invalid.' });
      }
      user.photos = photosToSave;
    }
    if (bioPhoto !== undefined) {
      if (bioPhoto && !isValidImageUrl(bioPhoto, req.user._id)) {
        return res.status(400).json({ message: 'Bio photo URL is invalid.' });
      }
      user.bioPhoto = bioPhoto || '';
    }
    if (intent) user.intent = normaliseIntent(intent);
    /* ⚠️ ALSO normalise the STORED value when this request did not include
       intent at all. `PUT /profile` is a partial update, so a save that touches
       only the bio would otherwise leave a retired "Study Buddy" sitting in the
       document forever — and because intent is a RANKING SIGNAL, that stale
       string silently stops matching anyone who picked "Activity Partner".
       Nothing is lost by normalising: mapping only rewrites retired values and
       de-duplicates, it never invents or drops a currently-valid intent. */
    else if (user.intent?.length) user.intent = normaliseIntent(user.intent);
    if (interestedIn) user.interestedIn = interestedIn;
    // ageRange validation + write removed: the setting it fed was never read by
    // any query or UI, so accepting it only wrote dead data into the document.
    // `age` and `dob` are deliberately NOT editable here — onboarding is the
    // only place they are set, and the client states they're permanent.
    if (interests) user.interests = normaliseInterests(interests);
    // Campus badge opt-out. `!== undefined` rather than truthy, because `false`
    // is the value that actually matters here and a truthy guard would make it
    // impossible to turn OFF once on.
    if (showCollege !== undefined) user.showCollege = Boolean(showCollege);
    if (gapYear !== undefined) user.gapYear = Boolean(gapYear);

    // Ladder: recomputed on EVERY profile write, not just onboarding. This is
    // what makes the score drop when a user blanks a scored field — a real
    // edit, e.g. clearing their bio, costs its points and can push them back
    // under LADDER.interact.
    user.profileScore = computeScore(user);

    await user.save();

    // The edit path. Same broadcast as onboarding — a deck showing this card has
    // to see the edit, not just see it on the owner's next visit.
    broadcastProfileUpdate(req, user);

    // 🧹 VAPORIZE ORPHANED PHOTOS: Clean up removed/replaced images
    const newPhotos = collectUserPhotos(user);
    oldPhotos.forEach(url => {
      if (!newPhotos.has(url)) deleteCloudinaryFile(url, req.user._id);
    });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

/* @route   GET /api/users/location
 * @desc    Report whether the viewer currently has location, WITHOUT echoing it.
 * @access  Private
 *
 * Settings' toggle has to be truthful about what is stored, so it needs to read
 * the state. It does NOT need the coordinates: returning them would put a
 * position into a response that is fetched on every Settings visit and logged
 * in transit, for a UI that only renders "On" or "Off".
 *
 * Returns only the source marker and the age of the reading, and reports
 * `active: false` for a reading too old to affect ranking (geo.js TTL) so the
 * UI can say "expired" instead of implying a stale fix is still in use. */
router.get('/location', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('+currentLatLng +locationSource +locationUpdatedAt')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    const hasCoords = Array.isArray(user.currentLatLng) && user.currentLatLng.length === 2;
    const active = hasCoords && isFreshLocation(user);

    res.status(200).json({
      /* ⚠️ NOT `hasCoords ? user.locationSource : null`. That collapsed the
         'campus' marker to null, because the campus choice stores NO
         coordinates — so a client could set it but never read it back, and
         would show "campus" as "off" on every reload. The state is reported
         from `locationSource` alone, which is exactly the field that holds the
         user's choice. */
      locationSource: user.locationSource || null,
      active,
      /* Age in whole days, so the UI can distinguish "set today" from "set a
         year ago" without ever handling a coordinate. */
      storedDaysAgo: user.locationUpdatedAt
        ? Math.floor((Date.now() - new Date(user.locationUpdatedAt).getTime()) / 86_400_000)
        : null,
    });
  } catch (error) {
    console.error('Error reading location:', error);
    res.status(500).json({ message: 'Server error reading location' });
  }
});

/* The viewer's campus position, independent of any personal reading. */
const campusPointFor = async (user) => {
  if (!user?.collegeCode) return null;
  const college = await College.findOne({ code: user.collegeCode }).select('latLng').lean();
  return sanitizeLatLng(college?.latLng);
};

/* The position the deck is actually ordered around: a fresh personal reading if
 * there is one, otherwise the viewer's campus. Mirrors the `viewerPoint`
 * resolution in routes/discover.js — these two must stay in step or a saved deck
 * gets kept or discarded on a basis the ranking never used.
 *
 * ⚠️ Read this from a freshly loaded user, never from the auth middleware's
 * `req.user`. That document is the PRE-write state: deriving the post-write
 * anchor from it returns the position that was just removed, so a comparison
 * always measures a point against itself and never fires. */
const effectiveAnchorFor = async (user) => sanitizeLatLng(user?.currentLatLng)
  || campusPointFor(user);

/* Drop the viewer's frozen deck when the anchor it was built around no longer
 * applies. Returns true when the deck was discarded, so callers can report it.
 *
 * ⚠️ An undefined previous anchor means there was nothing to lose, so it is NOT
 * treated as a move. A viewer with no stored position has no saved ordering that
 * could be wrong; deleting on every first write would just throw away a healthy
 * campus deck each time the app opens. */
const dropDeckIfAnchorMoved = async (viewerId, previousAnchor, nextAnchor) => {
  if (!previousAnchor || !nextAnchor) return false;
  if (haversineKm(previousAnchor, nextAnchor) <= LOCATION_DRIFT_KM) return false;
  await DiscoverSession.deleteOne({ viewerId });
  return true;
};

/* @route   PUT /api/users/location
 * @desc    Set or clear the viewer's coarse location.
 * @access  Private
 *
 * 📍 WHY THIS IS ITS OWN ENDPOINT RATHER THAN A FIELD ON PUT /profile
 * Three reasons, all of them about not storing precise coordinates by accident:
 *
 *   1. `sanitizeLatLng()` is applied HERE, in the one place coordinates are
 *      persisted. Rounding in the client would leave the exact value in the
 *      request body and every log that captures it; rounding here means the
 *      database only ever holds the ~1.1km rounded pair.
 *   2. It is writable independently of a profile edit. Location changes
 *      constantly (a term-break trip home) while profile edits are rare, and
 *      coupling them means every location refresh also risks a ladder score
 *      recalculation.
 *   3. `null` clears it. That has to be expressible without touching the rest
 *      of a profile, because turning the feature OFF must actually delete what
 *      was stored rather than merely stop reading it.
 *
 * The client sends raw coordinates exactly once, immediately after an explicit
 * permission grant. There is no background refresh and no `watchPosition`
 * anywhere in the codebase. */
router.put('/location', protect, async (req, res) => {
  try {
const { latLng, source } = req.body || {};

    /* The one-time nudge on the caught-up screen is dismissed by setting this
       flag rather than by touching the location fields. */
    if (req.body?.dismissNudge === true) {
      await User.updateOne({ _id: req.user._id }, { $set: { locationNudgeDismissed: true } });
      return res.status(200).json({ locationNudgeDismissed: true });
    }

    /* ── "I declined GPS" ──
       Recorded as a marker with NO coordinates at all, so the app can tell
       "declined" apart from "never asked" without ever holding a position. */
    if (latLng === undefined && source === 'campus') {
      /* Declining GPS does not make the anchor "nothing" — it makes it the
         campus. Coming back from a trip far away therefore has to discard a
         deck that was ordered around the old position. */
      const previousAnchor = await effectiveAnchorFor(req.user);
      await User.updateOne(
        { _id: req.user._id },
        {
          $set: { locationSource: 'campus', locationUpdatedAt: new Date() },
          $unset: { currentLatLng: 1 },
        },
      );
      /* Next anchor is the campus itself: the personal reading is gone. */
      const moved = await dropDeckIfAnchorMoved(
        req.user._id,
        previousAnchor,
        await campusPointFor(req.user),
      );
      return res.status(200).json({ locationSource: 'campus', moved });
    }

    /* An explicit null/absent `latLng` clears the reading. This is the
       "turn location off" path and must genuinely delete the stored value.

       ⚠️ `$unset`, NOT `$set: { field: undefined }`. Mongoose drops undefined
       values from an update by default, so the "clear" silently did nothing and
       the coordinates stayed in the database — a privacy control that reports
       success while the data it claims to have removed is still there. */
    if (latLng === null || latLng === undefined) {
      /* 📍 A LAPSED ONE-TIME GRANT IS NOT THE SAME AS A REFUSAL.
       *
       * The client sends `ephemeral: true` when the position it held was covered
       * by Chrome's "Allow this time" and that window has closed on the next
       * launch. The user never said no — they said yes, briefly — so the stored
       * basis becomes 'campus' rather than null.
       *
       * `null` would mean "location is switched off", and Settings reads it that
       * way. It also reads as a deliberate user decision, which is the one thing
       * this is not. 'campus' keeps every downstream surface truthful: the notice
       * mounts, the label reads "college location", and the deck is ordered from
       * the campus without claiming the user opted into anything.
       *
       * Both paths discard the deck on a real anchor move, so a student who went
       * home under a temporary grant does not keep the campus-ordered deck. */
      const previousAnchor = await effectiveAnchorFor(req.user);
      const releasedBasis = req.body?.ephemeral === true ? 'campus' : null;
      await User.updateOne(
        { _id: req.user._id },
        {
          $set: { locationSource: releasedBasis, locationUpdatedAt: null },
          $unset: { currentLatLng: 1 },
        },
      );
      /* Either way the anchor hands back to the campus, so that is the next one.
         Without a campus there is no next anchor and nothing is lost. */
      const moved = await dropDeckIfAnchorMoved(
        req.user._id,
        previousAnchor,
        await campusPointFor(req.user),
      );
      /* Echo the basis actually stored, not the one the old branch hardcoded —
         `campus` and `null` mean different things to Settings and to the notice,
         and returning the wrong one would let the two disagree. */
      return res.status(200).json({ locationSource: releasedBasis, cleared: true, moved });
    }

    /* Reject rather than silently drop. A malformed pair here means the client
       sent something the picker never should have produced, and quietly storing
       nothing would leave the user believing location is on when it is not. */
    const clean = sanitizeLatLng(latLng);
    if (!clean) {
      return res.status(400).json({ message: 'Invalid location' });
    }

    /* Only the two known sources are accepted. 'campus' means the user declined
       GPS and we fall back to their college's position, which stores NO
       coordinates at all — just a marker. */
    const locationSource = source === 'campus' ? 'campus' : 'gps';

    /* 📍 HAS THE VIEWER ACTUALLY MOVED?
     *
     * Read BEFORE the write, because after it the old value is gone. `req.user`
     * carries `+currentLatLng` (added in middleware/auth.js for the deck's own
     * distance ranking), which is what makes this comparison possible at all
     * without a second query.
     *
     * ⚠️ COMPARE ANCHORS, NOT STORED READINGS.
     *
     * This used to compare only against the previously stored GPS position, on
     * the reasoning that someone who has always declined GPS has not "travelled"
     * just because they switched it on. That reasoning holds only when they
     * switched it on while standing on their own campus.
     *
     * A viewer who has never granted GPS is ALREADY served a deck ordered around
     * their campus. Tapping "turn on location" while away from it — summer break,
     * a trip home, a semester at another campus — leaves those 500 frozen ids
     * chosen around the campus position. Comparing against the absent old reading
     * returned "not moved", so the session survived, and the feed kept serving
     * the home-city deck for the full 30-minute lifetime while the UI reported
     * the location was saved. The write succeeded, the storage succeeded, and the
     * only thing that mattered — which people get served — did not change.
     *
     * So the comparison is now between the anchor the old deck was built around
     * (`effectiveAnchorFor`, i.e. old personal reading else campus) and the new
     * one. Enabling GPS on campus is still ~0km and keeps the deck, so there is
     * no churn for the ordinary case. */
    const previousAnchor = await effectiveAnchorFor(req.user);
    const moved = await dropDeckIfAnchorMoved(req.user._id, previousAnchor, clean);

    await User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          currentLatLng: clean,
          locationSource,
          locationUpdatedAt: new Date(),
        },
      },
    );

    /* `moved` already deleted the session via `dropDeckIfAnchorMoved`. This
       second delete used to sit here and was harmless, but with the comparison
       moved into the helper it reads as though the deletion depends on
       something this block computes — it does not. */

    /* Echo the ROUNDED value, not the input, so the client can never hold or
       display a more precise position than we kept.

       `moved` lets the client tell "saved, nothing changed" from "saved, and your
       deck was rebuilt" — it can show a brief notice in the second case instead of
       silently rearranging the deck under someone mid-swipe. */
    res.status(200).json({ currentLatLng: clean, locationSource, moved });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error updating location' });
  }
});

/* Voluntary Ghost Mode was retired, and the legacy `isGhost` field has since
   been removed entirely: shadowbans now live only on `shadowbannedAt` and
   deletion on `isDeleted`, which is what the deck filter reads. */

/* @route   POST /api/users/change-college
 * @desc    Move an account to a new college. Requires a fresh OTP issued to the
 *          NEW college email, so the swap is proof the student controls that
 *          inbox. One active campus at a time — the new one overwrites.
 * @access  Private */
router.post('/change-college', protect, async (req, res) => {
  try {
    const email = normalizeEmail(String(req.body?.email || ''));
    const collegeCode = String(req.body?.collegeCode || '').trim().toLowerCase();
    const otp = String(req.body?.otp || '').trim();

    if (!email || !collegeCode || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Email, college and a 6-digit code are required.' });
    }

    const resolved = await resolveCollege(collegeCode, email);
    if (!resolved.ok) {
      return res.status(400).json({ message: resolved.reason });
    }

    // The newest outstanding OTP for this email is authoritative.
    const record = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Code expired. Request a new one.' });
    }
    if (record.collegeCode && record.collegeCode !== collegeCode) {
      return res.status(400).json({ message: 'That code was sent for a different college.' });
    }
    if (!verifyOtp(email, otp, record.otpHash)) {
      await OTP.findOneAndUpdate({ _id: record._id }, { $inc: { attempts: 1 } });
      return res.status(400).json({ message: 'Incorrect code.' });
    }

    // The new email must not already belong to another account.
    const taken = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (taken) {
      return res.status(409).json({ message: 'That email is already attached to another account.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.email = email;
    user.college = resolved.college.name;
    user.collegeCode = resolved.college.code;
    user.lastVerifiedAt = new Date();
    // One year from the fresh verification, same rule as signup.
    user.reverifyDue = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    user.status = 'active';
    await user.save();

    // The old deck was ordered for the old campus — drop it so the next request
    // rebuilds around the new college. Also drop the campus-derived location
    // marker if the user never enabled GPS: a "My campus" deck must move with
    // them, and a stale campus marker would rank strangers near the old school.
    await DiscoverSession.deleteOne({ viewerId: req.user._id });
    if (user.locationSource === 'campus') {
      await User.updateOne({ _id: user._id }, { $set: { locationSource: null, locationUpdatedAt: null } });
      user.locationSource = null;
    }

    await OTP.deleteMany({ email });

    res.status(200).json({
      message: 'College updated',
      user: { email: user.email, college: user.college, collegeCode: user.collegeCode, reverifyDue: user.reverifyDue },
    });
  } catch (error) {
    console.error('change-college error:', error);
    res.status(500).json({ message: 'Server error, could not change college' });
  }
});

// @route   DELETE /api/users/account
// @desc    Soft-delete user account with 30-day safety retention
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 🧹 IMMEDIATE WIPE: Public profile media from Cloudinary
    // (Profile photos, bio photo, prompt attachments — serve no purpose after deletion)
    collectUserPhotos(user).forEach(url => deleteCloudinaryFile(url, req.user._id));

    // ⚠️ SAFETY RETENTION: Chat media is NOT wiped here.
    // Messages (including photos/voice notes) are retained for 30-day safety window
    // to allow Trust & Safety investigations if the user is reported after deletion.
    // A background cleanup job handles final Cloudinary purge after retention expires.

// 🏴 SOFT DELETE: Wipe PII, flag as deleted.
      //
      // ⚠️ `email` is deliberately NOT cleared here.
      //
      // It looks like an oversight because every other identifying field is
      // blanked, and a college email is the single most identifying thing we
      // hold (see the roll-number exposure in the privacy policy). But this row
      // is retained for 30 days as moderation evidence, and the email is the
      // only field tying it to a person — blanking it would make the retained
      // report evidence useless while the account still exists.
      //
      // It's also load-bearing for abuse: the address can't be re-registered
      // until this window elapses (see RETENTION_MS in routes/auth.js), and
      // that check queries by email.
      //
      // It is cleared when the retention window expires and the row is
      // hard-deleted. Before then, this account is invisible in the product.
      user.name = 'Deleted User';
      user.photos = [];
      user.bio = '';
      user.bioPhoto = '';
      user.prompts = [];
      user.interests = [];
      user.intent = [];
      user.graduatingYear = null;
      user.isDeleted = true;
    user.deletedAt = new Date();
    user.suspended = false;
    user.pushSubscription = null;
    user.interestedIn = [];
    user.interests = [];
    await user.save();

    // 💔 DEACTIVATE all alignments (chats vanish from inboxes instantly)
    await Alignment.updateMany({ users: userId }, { $set: { isActive: false } });

    // 🧹 CLEANUP: Records with no safety retention value
    await Block.deleteMany({ $or: [{ blocker: userId }, { blocked: userId }] });
    // ⚠️ Reports are INTENTIONALLY RETAINED — moderation evidence must survive
    // account deletion so abuse can still be investigated. Final purge happens
    // in the 30-day background cleanup job.
    await Notification.deleteMany({ $or: [{ recipientId: userId }, { senderId: userId }] });
    await Analytics.deleteMany({ user: userId });

    // 📦 RETAIN for 30-day safety window: Messages, Alignments, Interactions
    // (Final hard deletion handled by background cleanup job)

    // 🔒 CLEAR SESSION
    clearAuthCookie(res);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
});

// @route   GET /api/users/onboarding/resume
// @desc    Get saved onboarding progress
// @access  Private
router.get('/onboarding/resume', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('onboardingStep onboardingData');
    res.json({ step: user.onboardingStep, data: user.onboardingData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/onboarding/save
// @desc    Save onboarding progress
router.put('/onboarding/save', protect, async (req, res) => {
  try {
    const { step, data } = req.body;

    if (typeof step !== 'number' || !Number.isInteger(step) || step < 1 || step > 8) {
      return res.status(400).json({ message: 'Invalid onboarding step' });
    }
    if (data != null && JSON.stringify(data).length > 100 * 1024) { // 100KB cap
      return res.status(400).json({ message: 'Onboarding draft too large' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      onboardingStep: step,
      onboardingData: data || {},
    });
    
    // ANALYTICS: Track user progression
    await Analytics.create({ user: req.user._id, event: 'ONBOARDING_STEP', step });

    res.json({ saved: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/onboarding/clear
// @desc    Clear saved onboarding progress
// @access  Private
router.delete('/onboarding/clear', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { onboardingStep: 1, onboardingData: {} });
    res.json({ cleared: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/logout-all
// @desc    Invalidate all active sessions for the current user
// @access  Private
router.post('/logout-all', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { lastLogoutAt: new Date() });
    res.status(200).json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

```

### ./server/tests/lib/env.mjs

```
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(__dirname, '../../..');
export const SERVER_DIR = path.join(REPO_ROOT, 'server');
export const CLIENT_DIR = path.join(REPO_ROOT, 'client');
export const QA_DIR = path.join(SERVER_DIR, 'tests', 'qa');
export const TESTS_DIR = path.join(SERVER_DIR, 'tests');
export const TEST_DB_NAME = 'matchalize_test';
export const QA_PORT = 5051;
export const QA_ORIGIN = `http://localhost:${QA_PORT}`;

export function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split('\n')) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice('export '.length).trim();
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    out[key] = value.replace(/\\n/g, '\n');
  }
  return out;
}

export function loadServerEnv() {
  return parseEnvFile(path.join(SERVER_DIR, '.env'));
}

export function deriveTestUri(serverEnv) {
  const uri = serverEnv.MONGODB_URI;
  if (!uri) throw new Error('server/.env is missing MONGODB_URI');
  const lastSlash = uri.lastIndexOf('/');
  const qsIdx = uri.indexOf('?');
  const query = qsIdx >= 0 ? uri.slice(qsIdx) : '';
  const base = uri.slice(0, lastSlash + 1);
  return `${base}${TEST_DB_NAME}${query}`;
}

export function buildServerEnv(serverEnv) {
  const production = parseEnvFile(path.join(SERVER_DIR, '.env.test'));
  const jwts = serverEnv.JWT_SECRET || 'matchalize-qa-jwt-secret';
  return {
    ...serverEnv,
    ...production,
    NODE_ENV: 'test',
    PORT: String(QA_PORT),
    MONGODB_URI: deriveTestUri(serverEnv),
    JWT_SECRET: jwts,
    FRONTEND_URL: QA_ORIGIN,
  };
}
```

### ./server/tests/lib/mongo.mjs

```
import mongoose from 'mongoose';

// The one database name these tests are ever allowed to touch. Mirrors
// TEST_DB_NAME in ./env.mjs.
const ALLOWED_TEST_DBNAME = 'matchalize_test';

export async function connectMongo(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

export async function disconnectMongo() {
  await mongoose.disconnect().catch(() => {});
}

/**
 * 🛑 REFUSE TO RUN AGAINST A DATABASE THAT ISN'T THE TEST DATABASE.
 *
 * resetTestDb() drops every collection it finds. `deriveTestUri` (env.mjs)
 * rewrites the db segment of server/.env's MONGODB_URI to `matchalize_test`,
 * which means the tests are safe by ACCIDENT even if that URI points at a
 * production CLUSTER — but that single indirection is the only thing standing
 * between a misconfigured .env and dropped collections. If env.mjs is ever
 * changed, or someone exports MONGODB_URI directly, the guard is gone.
 *
 * So assert the resolved database name before touching anything. Cheap, and it
 * converts a catastrophic, irreversible mistake into an immediate, obvious one.
 */
function assertDisposableDatabase(db) {
  const name = db.databaseName;
  if (name !== ALLOWED_TEST_DBNAME) {
    throw new Error(
      `🛑 REFUSING TO RUN: connected to database "${name}", expected "${ALLOWED_TEST_DBNAME}".\n` +
      `   These tests DROP every collection they find. Check MONGODB_URI in server/.env.`
    );
  }
}

export async function resetTestDb() {
  const db = mongoose.connection.db;
  assertDisposableDatabase(db);
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    await db.dropCollection(c.name).catch(() => {});
  }
}

export async function findLatestOtpEmail(db, email) {
  return db.collection('otps').findOne({ email }, { sort: { createdAt: -1 } });
}

export async function updateUserLastActive(db, emailsByRole, deltaMs) {
  const users = db.collection('users');
  for (const email of emailsByRole) {
    await users.updateOne({ email }, { $set: { lastActive: new Date(Date.now() - deltaMs) } });
  }
}
```

### ./server/tests/qa/browser.mjs

```
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectMongo, findLatestOtpEmail } from '../lib/mongo.mjs';
import {
  QA_ORIGIN,
  QA_PORT,
  SERVER_DIR,
  TESTS_DIR,
  buildServerEnv,
  deriveTestUri,
  loadServerEnv,
} from '../lib/env.mjs';

export { QA_ORIGIN };

export const VIDEOS_DIR = path.join(TESTS_DIR, 'qa', 'videos');

let mongoConnected = false;
export async function ensureMongo() {
  if (!mongoConnected) {
    const serverEnv = loadServerEnv();
    await connectMongo(deriveTestUri(serverEnv));
    mongoConnected = true;
  }
}

export async function readLatestOtp(email) {
  await ensureMongo();
  const doc = await findLatestOtpEmail(mongoose.connection.db, String(email).toLowerCase().trim());
  if (!doc) throw new Error(`No OTP record for ${email} — did send-otp hit the test DB?`);
  return doc.otp;
}

export async function bootServer() {
  const serverEnv = loadServerEnv();
  const env = buildServerEnv(serverEnv);
  const uri = env.MONGODB_URI;
  const proc = spawn(process.execPath, ['index.js'], {
    cwd: SERVER_DIR,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logBuf = '';
  proc.stdout.on('data', (d) => (logBuf += d));
  proc.stderr.on('data', (d) => (logBuf += d));
  const deadline = Date.now() + 45000;
  for (;;) {
    try {
      const res = await fetch(`${QA_ORIGIN}/api/config`);
      if (res.ok) break;
    } catch {
      /* not up yet */
    }
    if (proc.exitCode !== null) {
      throw new Error(`Test server exited early:\n${logBuf.slice(-2000)}`);
    }
    if (Date.now() > deadline) {
      throw new Error(`Test server did not boot in time:\n${logBuf.slice(-2000)}`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return {
    proc,
    uri,
    stop: () => {
      try {
        proc.kill('SIGTERM');
      } catch {}
    },
  };
}

export const MOBILE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 MatchalizeQA/1.0',
};

export async function makeContext(browser, videoDir, name) {
  fs.mkdirSync(videoDir, { recursive: true });
  const context = await browser.newContext({
    ...MOBILE,
    recordVideo: { dir: videoDir, size: { width: 390, height: 844 } },
  });
  context.setDefaultTimeout(20000);
  if (name) context.__qaName = name;
  const page = await context.newPage();
  page.on('dialog', (d) => d.accept());
  page.on('pageerror', (err) => console.log(`  [pageerror] ${err.message}`));
  return { context, page };
}

export async function closeContext({ context, videoDir, name }) {
  try {
    await context.close();
  } catch {}
  if (!videoDir) return null;
  const files = fs.readdirSync(videoDir).filter((f) => f.endsWith('.webm'));
  if (files.length === 0) return null;
  const src = path.join(videoDir, files[0]);
  const dest = path.join(videoDir, `${name || 'clip'}.webm`);
  if (src !== dest) fs.renameSync(src, dest);
  return dest;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- UI DRIVERS -----------------------------------------------------------

export async function advanceSplash(page, { maxSwipes = 7 } = {}) {
  await page.goto(`${QA_ORIGIN}/`, { waitUntil: 'domcontentloaded' });
  const cta = page.locator('text="Enter the Realm"');
  for (let i = 0; i < maxSwipes; i++) {
    if (await cta.isVisible().catch(() => false)) break;
    await touchSwipe(page, { y0: 620, y1: 140, steps: 16, pause: 40 });
    await sleep(350);
  }
  if (await cta.isVisible().catch(() => false)) {
    await cta.tap();
    await sleep(1700);
  }
}

export async function startAuth(page, email) {
  page.on('dialog', (d) => d.accept());
  await advanceSplash(page);
  await page.locator('input[type="email"]').waitFor({ timeout: 25000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('button[type="submit"]').click();
  await page.locator('input.stamp-box').first().waitFor({ timeout: 15000 });
}

export async function enterOtp(page, otp) {
  const boxes = page.locator('input.stamp-box');
  const count = await boxes.count();
  const digits = String(otp).split('');
  for (let i = 0; i < count && i < digits.length; i++) {
    await boxes.nth(i).fill(digits[i]);
    await sleep(90);
  }
  // last digit triggers auto-verify
  await boxes.nth(Math.min(count, digits.length) - 1).press('Tab', { delay: 90 }).catch(() => {});
}

export async function loginViaOtp(page, email) {
  await startAuth(page, email);
  const otp = await readLatestOtp(email);
  await enterOtp(page, otp);
}

export async function waitForAppShell(page, { onboarded = true } = {}) {
  // Home: wait for the deck's first image; Onboarding: wait for its title step
  try {
    await page
      .locator('input[type="email"]')
      .waitFor({ state: 'detached', timeout: 30000 })
      .catch(() => {});
  } catch {}
  if (onboarded) {
    await page.locator('img').first().waitFor({ timeout: 30000 }).catch(() => {});
  }
  await sleep(1500);
}

export async function touchSwipe(page, { x = 190, y0 = 620, y1 = 140, steps = 12, pause = 45 } = {}) {
  const session = await page.context().newCDPSession(page);
  const touch = (type, points) => session.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  await touch('touchStart', [{ x, y: y0 }]);
  await sleep(30);
  for (let i = 1; i <= steps; i++) {
    const y = y0 + ((y1 - y0) * i) / steps;
    await touch('touchMove', [{ x, y }]);
    await sleep(pause);
  }
  await touch('touchEnd', []);
}

export async function longPress(page, selector, holdMs = 480) {
  const target = page.locator(selector).first();
  await target.scrollIntoViewIfNeeded().catch(() => {});
  const box = await target.boundingBox();
  if (!box) throw new Error(`longPress: no bounding box for ${selector}`);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const session = await page.context().newCDPSession(page);
  const touch = (type, points) => session.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  await touch('touchStart', [{ x: cx, y: cy }]);
  await sleep(holdMs);
  await touch('touchEnd', []);
}

export async function tap(page, locator, { timeout = 15000 } = {}) {
  await locator.waitFor({ timeout });
  await locator.tap();
}

// Given selector that should match a concrete card, compute on-screen name via the deck API when needed.
export async function deckApi(page, { limit = 20 } = {}) {
  return page.evaluate(async (lim) => {
    const res = await fetch(`/api/discover?limit=${lim}`, { credentials: 'include' });
    return res.json();
  }, limit);
}
```

### ./server/tests/qa/run-qa.mjs

```
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { connectMongo, disconnectMongo } from '../lib/mongo.mjs';
import { deriveTestUri, loadServerEnv, QA_ORIGIN, SERVER_DIR, CLIENT_DIR } from '../lib/env.mjs';
import { bootServer, VIDEOS_DIR } from './browser.mjs';
import { seedSociety } from '../society/seedSociety.mjs';
import { definitions, runners, loadConfig } from './scenes.mjs';
import { assertReportDir, copyVideo, writeReport, writeTheater } from './report.mjs';

const parseFlags = () => {
  const args = process.argv.slice(2);
  const get = (name, def = null) => {
    const hit = args.find((a) => a.startsWith(`--${name}`));
    if (!hit) return def;
    const value = hit.split('=')[1];
    return value === undefined || value === '' ? true : value;
  };
  return {
    scenes: get('scenes', '')?.toString().split(',').map((s) => s.trim()).filter(Boolean),
    skipSeed: get('skip-seed', false) !== false,
    only: get('only', '')?.toString().split(',').map((s) => s.trim()).filter(Boolean),
  };
};

const runScene = async ({ browser, cfg, world, id }) => {
  const runner = runners[id];
  const def = definitions.find((d) => d.id === id);
  const errors = [];
  const log = (msg) => {
    errors.push(String(msg));
    console.log(`    ${msg}`);
  };
  const started = Date.now();
  let videos = [];
  try {
    const out = await Promise.race([
      Promise.resolve(runner({ browser, cfg, world, log })),
      new Promise((_, rej) => setTimeout(() => rej(new Error('scene hit 240s wall-clock cap')), 240000)),
    ]);
    videos = (Array.isArray(out) ? out : [out]).filter(Boolean);
  } catch (err) {
    errors.push(`ERROR: ${err.message}`);
  }
  const durationMs = Date.now() - started;
  const hasVideo = videos.length > 0;
  const status = errors.some((e) => e.startsWith('ERROR:')) ? 'fail' : hasVideo ? (errors.length ? 'warn' : 'ok') : 'warn';
  return { id, name: def.name, blurb: def.blurb, status, notes: errors, videos, durationMs };
};

async function main() {
  const flags = parseFlags();
  const serverEnv = loadServerEnv();
  const testUri = deriveTestUri(serverEnv);
  process.env.MONGODB_URI = testUri;

  const reportDir = fs.existsSync(path.join(CLIENT_DIR, 'dist'))
    ? path.join(CLIENT_DIR, 'dist', 'e2e')
    : path.join(SERVER_DIR, 'tests', 'qa', 'report');
  assertReportDir(reportDir);

  fs.rmSync(VIDEOS_DIR, { recursive: true, force: true });
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });

  let server = null;
  if (!flags.skipSeed) {
    console.log(`[qa] booting test server on ${QA_ORIGIN} (db: ${testUri})`);
    server = await bootServer();
    console.log('[qa] seeding society…');
    await seedSociety();
    console.log('[qa] society seeded.');
  } else {
    console.log('[qa] --skip-seed: assuming a seeded test server is already running.');
  }

  const cfg = await loadConfig();
  console.log(`[qa] config loaded: ${cfg.prompts?.length || 0} prompts.`);

  const browser = await chromium.launch({ headless: true });
  const selected = flags.scenes?.length ? flags.scenes : flags.only?.length ? flags.only : definitions.map((d) => d.id);
  const sceneDefs = definitions.filter((d) => selected.includes(d.id));
  const world = {};

  const results = [];
  for (const def of sceneDefs) {
    console.log(`\n[qa] ▶ ${def.id} — ${def.name}`);
    const res = await runScene({ browser, cfg, world, id: def.id });
    res.videoRefs = (res.videos || []).map((src) => copyVideo(src, reportDir)).filter(Boolean);
    console.log(`      ${res.status.toUpperCase()} in ${(res.durationMs / 1000).toFixed(1)}s` + (res.videoRefs.length ? ` → ${res.videoRefs.join(', ')}` : ''));
    results.push(res);
  }

  await browser.close();

  writeReport(results, reportDir);
  writeTheater(results, reportDir);

  if (server) server.stop();
  await disconnectMongo().catch(() => {});

  const fails = results.filter((r) => r.status === 'fail').length;
  const warns = results.filter((r) => r.status === 'warn').length;
  console.log(`\n[qa] done — ${results.length} scenes · ✓ ${results.length - fails - warns} ⚠ ${warns} ✗ ${fails}`);
  console.log(`[qa] Report:      ${path.join(reportDir, 'REPORT.md')}`);
  console.log(`[qa] Theater:     ${path.join(reportDir, 'index.html')}`);
}

main().catch((err) => {
  console.error('[qa] fatal:', err);
  process.exit(1);
});
```

### ./server/tests/qa/scenes.mjs

```
import path from 'path';
import { QA_ORIGIN, VIDEOS_DIR } from './browser.mjs';
import {
  advanceSplash,
  loginViaOtp,
  makeContext,
  closeContext,
  touchSwipe,
  longPress,
  tap,
  sleep,
  deckApi,
} from './browser.mjs';

const SCENES_DIR = VIDEOS_DIR;

function svgPhotoBuffer(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="#3a1d0d"/><circle cx="300" cy="320" r="150" fill="#8f4a1f"/><text x="300" y="560" text-anchor="middle" font-family="Georgia" font-size="90" fill="#ffc89f">${label}</text></svg>`;
  return Buffer.from(svg);
}

// ===== SHARED DRIVERS =====================================================

async function topCardPrompt(page) {
  const data = await deckApi(page);
  const top = data.users?.[0];
  return top?.prompts?.[0]?.question || 'Exceptional Match';
}

async function popLike(page, tileSelector, { note, flower } = {}) {
  await longPress(page, tileSelector);
  await sleep(250);
  await tap(page, page.locator(flower ? '.flower-btn' : '.letter-btn'));
  if (note) {
    await tap(page, page.locator('textarea.premium-input'));
    await page.locator('textarea.premium-input').fill(note);
    await tap(page, page.locator('.premium-send-btn'));
    await sleep(1600);
  } else {
    await sleep(1400);
  }
}

async function tapInterestChip(page, interest) {
  const chip = page
    .locator('button.tactile-btn')
    .filter({ hasText: new RegExp(`^\\s*${interest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) })
    .first();
  await chip.tap();
}

async function driveOnboarding(page, cfg, profile, { fast = false } = {}) {
  const wait = (ms) => (fast ? sleep(Math.round(ms / 3)) : sleep(ms));
  const advance = async () => {
    await touchSwipe(page, { y0: 640, y1: 130, steps: 16, pause: 40 });
    await wait(950);
  };
  const genderMap = { female: 'FEMALE', male: 'MALE' };

  await page.locator('text=The Dossier.').first().waitFor({ timeout: 30000 });
  await wait(700);
  await advance(); // intro -> vitals

  // VITALS
  await page.locator('input[placeholder="e.g. Arjun"]').fill(profile.name || 'Campus Writer');
  const d = String(profile.dobD || '09').padStart(2, '0');
  const m = String(profile.dobM || '06').padStart(2, '0');
  const y = String(profile.dobY || '2005');
  await page.locator('input[placeholder="DD"]').fill(d);
  await page.locator('input[placeholder="MM"]').fill(m);
  await page.locator('input[placeholder="YYYY"]').fill(y);
  await wait(400);
  await advance(); // vitals -> coordinates

  // COORDINATES
  const g = genderMap[profile.gender] || 'FEMALE';
  await page.locator('button.tactile-btn').filter({ hasText: new RegExp(`^\\s*${g}\\s*$`) }).first().tap();
  for (const gi of profile.interestedIn || ['MALE']) {
    let idx = 0;
    if (!['EVERYONE'].includes(gi)) idx = 1; // identity group renders first, interested-in second
    const chip = page.locator('button.tactile-btn').filter({ hasText: new RegExp(`^\\s*${gi}\\s*$`) }).nth(idx);
    await chip.tap();
  }
  // Branch and Hostel were removed from the Coordinates chapter along with their
  // schema fields, so there is nothing to tap or fill here any more. Do not
  // reintroduce selectors for them — if this harness ever needs a college or
  // location signal again, it should come from the college picker in Auth.
  const era = profile.era || 'UG';
  await page.locator('button:has-text("Select UG / PG...")').tap();
  await page.locator('button.tactile-btn').filter({ hasText: new RegExp(`^\\s*${era}\\s*$`) }).first().tap().catch(() => {});
  await wait(300);
  await advance(); // coordinates -> portrait

  // PORTRAIT
  await page.locator('button:has-text("Primary Photo")').first().tap();
  await page.locator('input[type="file"]').setInputFiles({ name: 'portrait.svg', mimeType: 'image/svg+xml', buffer: svgPhotoBuffer('P0') });
  await wait(3200);
  await page
    .locator('textarea[placeholder="What drives you? What are your passions?"]')
    .fill(profile.bio || 'Here for the conversations, the afternoon light, and the mess chai that somehow tastes different at 6pm.');
  await wait(300);
  await advance(); // portrait -> whispers

  // WHISPERS — 3 slots (horizontal pager; each slot becomes a card once answered)
  const prompts = profile.prompts || (cfg.prompts || []).slice(0, 3);
  const answers = [
    'Honestly? The ritual matters more than the loud thing.',
    'Engineers plan, poets improvise. I do both.',
    'Ask me after 10pm — my night-owl brain is sharper.',
  ];
  for (let slot = 0; slot < 3; slot++) {
    const add = page.locator('button:has-text("+ Select a Whisper")').first();
    if (await add.isVisible().catch(() => false)) {
      await add.tap();
      await wait(500);
      const qText = prompts[slot]?.question || prompts[slot] || '';
      await page.getByText(qText, { exact: true }).first().tap().catch(async () => {
        await page.getByText(qText.slice(0, 18), { exact: false }).first().tap().catch(() => {});
      });
      await wait(500);
    }
    const area = page.locator('textarea[placeholder="Your answer..."]').nth(slot);
    await area.fill(answers[slot % answers.length]);
    await wait(250);
  }
  await advance(); // whispers -> parameters

  // PARAMETERS
  for (const intent of profile.intent || ['Dating']) {
    const chip = page.locator('button.tactile-btn').filter({ hasText: new RegExp(`^\\s*${intent}\\s*$`) }).first();
    await chip.tap();
  }
  for (const it of profile.curiosities || (cfg.interests || []).slice(0, 3)) {
    await tapInterestChip(page, it).catch(() => {});
  }
  await wait(300);
  await advance(); // parameters -> alignment


  // REVIEW — publish
  const publish = page.locator('button:has-text("Publish Profile & Enter")');
  await publish.waitFor({ timeout: 15000 }).catch(() => {});
  if (await publish.isVisible().catch(() => false)) {
    await publish.tap();
  }
  await sleep(3000);
}

// ===== SCENES =============================================================

const definitions = [
  {
    id: 's01',
    name: 'Onboarding — The Dossier',
    blurb: 'Brand-new student Khushi signs in with her campus email and transcribes her story — Vitals, Coordinates, Portrait, Whispers, Parameters, Alignment — then publishes her profile.',
  },
  {
    id: 's02',
    name: 'Discover — Curating the Deck',
    blurb: 'Anaya browses the discovery deck: long-presses a tile to pop the letter press, sends a handwritten letter, and swipes past the rest.',
  },
  {
    id: 's08',
    name: 'Safety — Report & Block',
    blurb: 'Drishti reports a profile from the card menu and permanently blocks a match from her chat — creating the report trail that reaches the admin next.',
  },
  {
    id: 's03',
    name: 'The Alignment — Instant Chat',
    blurb: 'Drishti likes Arjun and the campus lights up: instant match and the first opening letter.',
  },
  {
    id: 's04',
    name: 'Letters — The Binder',
    blurb: 'Anika opens her Letters tab: conversations, unread messages, and the search that finds messages instantly.',
  },
  {
    id: 's05',
    name: 'Live Chat',
    blurb: 'Split-screen realtime chat: anika and rohan message each other live and react to a message. Everything relays over websockets.',
  },
  {
    id: 's06',
    name: 'The Letterbox',
    blurb: 'Anika opens her Letterbox from the bell, accepts a letter from Mira, then connects on a Priority Telegram from Ved.',
  },
  {
    id: 's07',
    name: 'Profile — The Dossier',
    blurb: 'Anika polishes her dossier: edits her bio and drops a new curiosity into her recorded list.',
  },
  {
    id: 's11',
    name: 'Severing Ties',
    blurb: 'Sanya unmatches Nishant from the chat options — an irreversible decision, confirmed and done.',
  },
  {
    id: 's09',
    name: 'Admin — The Archivist',
    blurb: 'The campus admin reviews pending community reports, opens Kabir’s file, and suspends the account.',
  },
  {
    id: 's10',
    name: 'Locked Out',
    blurb: 'Kabir tries to sign back in — the archive returns a suspended verdict and bars the door.',
  },
  {
    id: 's12',
    name: 'Admin — The Ledger',
    blurb: 'Back on the admin dashboard: live campus stats, active bans, and the safety ledger reflecting everything the run did.',
  },
  {
    id: 's14',
    name: 'The Splash',
    blurb: 'The cinematic entry — tagline, and the automatic pass into the archives.',
  },
  {
    id: 's15',
    name: 'The Encore',
    blurb: 'Arohi joins fast — a quick onboarding — and her letterbox already holds a welcome letter.',
  },
];

export { definitions };

async function runS01({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's01');
  const { context, page } = await makeContext(browser, dir, 's01');
  await loginViaOtp(page, 'khushi.verma@iitb.ac.in');
  await page.locator(`text=The Dossier.`).first().waitFor({ timeout: 20000 });
  await driveOnboarding(page, cfg, { name: 'Khushi Verma', gender: 'female', interestedIn: ['MALE'], dobD: 12, dobM: 3, dobY: 2006 });
  await page.locator('img').first().waitFor({ timeout: 30000 }).catch(() => {});
  await sleep(2500);
  return closeContext({ context, videoDir: dir, name: 's01' });
}

async function runS02({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's02');
  const { context, page } = await makeContext(browser, dir, 's02');
  await loginViaOtp(page, 'anaya.mehta@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(2500);
  try {
    await popLike(page, await topCardPrompt(page), { note: 'The library-steps light at six. I think we both noticed.', flower: false });
  } catch (e) {
    log(`  [warn] anaya letter failed: ${e.message}`);
  }
  await sleep(2200);
  try {
    await touchSwipe(page, { y0: 640, y1: 130, steps: 16, pause: 40 }); // pass
    await sleep(1600);
  } catch (e) {
    log(`  [warn] anaya pass failed: ${e.message}`);
  }
  try {
    await popLike(page, await topCardPrompt(page), { flower: true });
  } catch (e) {
    log(`  [warn] anaya flower failed: ${e.message}`);
  }
  await sleep(2200);
  return closeContext({ context, videoDir: dir, name: 's02' });
}

async function runS03({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's03');
  const { context, page } = await makeContext(browser, dir, 's03');
  await loginViaOtp(page, 'drishti.iyer@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(2500);
  try {
    await popLike(page, await topCardPrompt(page), { flower: true });
  } catch (e) {
    log(`  [warn] drishti like failed: ${e.message}`);
  }
  await page.getByText('You are Aligned', { exact: true }).first().waitFor({ timeout: 20000 });
  await sleep(1800);
  await page.locator('button:has-text("Open Chat")').tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(3000);
  return closeContext({ context, videoDir: dir, name: 's03' });
}

async function runS04({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's04');
  const { context, page } = await makeContext(browser, dir, 's04');
  await loginViaOtp(page, 'anika.singh@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(1500);
  await tap(page, page.getByRole('button', { name: 'Letters' }));
  await page.locator('text="Rohan Gokhale"').first().waitFor({ timeout: 15000 });
  await sleep(1200);
  const search = page.getByPlaceholder('Search letters...');
  await search.fill('rohan');
  await sleep(1200);
  await page.getByRole('button', { name: 'Clear search' }).tap().catch(() => {});
  await sleep(800);
  await page.locator('text="Rohan Gokhale"').first().tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(2500);
  await page.getByRole('button', { name: 'Go back to letters' }).tap();
  await sleep(1500);
  return closeContext({ context, videoDir: dir, name: 's04' });
}

async function runS05({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's05');
  const a = await makeContext(browser, path.join(dir, 'anika'), 'anika');
  const b = await makeContext(browser, path.join(dir, 'rohan'), 'rohan');
  try {
    await loginViaOtp(a.page, 'anika.singh@iitb.ac.in');
    await loginViaOtp(b.page, 'rohan.g@iitb.ac.in');
    await a.page.locator('img').first().waitFor({ timeout: 30000 });
    await b.page.locator('img').first().waitFor({ timeout: 30000 });
    await tap(a.page, a.page.getByRole('button', { name: 'Letters' }));
    await a.page.locator('text="Rohan Gokhale"').first().tap();
    await tap(b.page, b.page.getByRole('button', { name: 'Letters' }));
    await b.page.locator('text="Anika Singh"').first().tap();
    await a.page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
    await b.page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
    await sleep(1500);

const send = async (lpage, text) => {
      const box = lpage.getByPlaceholder('Write a message...');
      await box.fill(text);
      await lpage.locator('button[aria-label="Send message"]').tap();
      await sleep(1600);
    };
    const waitText = async (page, text, ms = 9000) => {
      await page.getByText(text, { exact: false }).first().waitFor({ timeout: ms });
    };

    await send(a.page, 'Hey! Still awake, or drowning in submissions?');
    await waitText(b.page, 'still awake');
    await sleep(900);
    await send(b.page, 'Finals week. The library is my second home now.');
    await waitText(a.page, 'second home now');
    await sleep(900);
    await send(a.page, 'Cold brew rescue mission at CCC tomorrow?');
    await waitText(b.page, 'Cold brew rescue mission');
    await sleep(900);
    await send(b.page, "It's a date. Bring the good playlist.");
    await waitText(a.page, "It's a date. Bring the good playlist.");

    try {
      await longPress(a.page, 'text="It\'s a date. Bring the good playlist."', 560);
      await tap(a.page, a.page.locator('button:has-text("React")'), { timeout: 8000 });
      await tap(a.page, a.page.getByRole('button', { name: 'React with ❤️' }), { timeout: 8000 });
      await sleep(1800);
    } catch (e) {
      log(`  [warn] s05 reaction failed: ${e.message}`);
    }
    await sleep(2000);
  } finally {
    const v1 = await closeContext({ context: a.context, videoDir: path.join(dir, 'anika'), name: 'anika' });
    const v2 = await closeContext({ context: b.context, videoDir: path.join(dir, 'rohan'), name: 'rohan' });
    return [v1, v2].filter(Boolean);
  }
}

async function runS06({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's06');
  const { context, page } = await makeContext(browser, dir, 's06');
  await loginViaOtp(page, 'anika.singh@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(1200);
  await tap(page, page.getByRole('button', { name: 'View notifications' }));
  await page.getByText('sent a letter.', { exact: false }).first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.locator('text="Mira Nair"').first().waitFor({ timeout: 15000 });
  await sleep(1400);
  await page.locator('button[aria-label="Accept"]').first().tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(2600);
  await page.getByRole('button', { name: 'Go back to letters' }).tap().catch(() => {});
  await sleep(900);
  await tap(page, page.getByRole('button', { name: 'View notifications' }));
  await page.locator('text="Ved Desai"').first().waitFor({ timeout: 15000 });
  await sleep(1400);
  await page.locator('button[aria-label="Accept"]').first().tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(3000);
  return closeContext({ context, videoDir: dir, name: 's06' });
}

async function runS07({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's07');
  const { context, page } = await makeContext(browser, dir, 's07');
  await loginViaOtp(page, 'anika.singh@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(800);
  await tap(page, page.getByRole('button', { name: 'Profile' }));
  await page.getByText('About Me', { exact: true }).first().waitFor({ timeout: 15000 });
  await sleep(1200);
  try {
    const aboutEdit = page.getByText('About Me', { exact: true }).first().locator('xpath=..').locator('button:has-text("Edit")');
    await aboutEdit.tap();
    await sleep(900);
    const bio = page.locator('textarea[placeholder="Write your bio..."]');
    if (await bio.isVisible().catch(() => false)) {
      await bio.fill('Just finished my first hackathon. Here for the chase scenes, the chai, and the long talks by the lake.');
      await bio.press('Tab'); // commit onBlur
      await sleep(1200);
    }
  } catch (e) {
    log(`  [warn] s07 bio edit failed: ${e.message}`);
  }
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(800);
  try {
    const curEdit = page.getByText('Recorded Curiosities', { exact: true }).first().locator('xpath=..').locator('button:has-text("Edit")');
    await curEdit.tap();
    await sleep(900);
    const tags = (cfg.interests || []).slice(-3);
    const chip = page.locator('button.tactile-btn').filter({ hasText: tags[0] }).first();
    await chip.tap().catch(() => {});
    await sleep(1000);
  } catch (e) {
    log(`  [warn] s07 curiosity edit failed: ${e.message}`);
  }
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(2500);
  return closeContext({ context, videoDir: dir, name: 's07' });
}

async function runS08({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's08');
  const { context, page } = await makeContext(browser, dir, 's08');
  await loginViaOtp(page, 'drishti.iyer@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(2000);
  try {
    await tap(page, page.locator('button:has(svg.lucide-more-vertical)'));
    await tap(page, page.locator('button:has-text("Report Profile")'));
    await page.locator('text="Report User"').first().waitFor({ timeout: 10000 });
    await sleep(800);
    const reason = page.getByRole('button', { name: 'Harassment or bullying', exact: true }).first();
    await reason.tap().catch(async () => {
      const other = page.getByRole('button', { name: 'Other', exact: true }).first();
      await other.tap().catch(() => {});
    });
    const details = page.locator('textarea[placeholder="Provide any additional context..."]');
    if (await details.isVisible().catch(() => false)) {
      await details.fill('Repeatedly pestering in DMs despite being told to stop.');
    }
    await tap(page, page.locator('button:has-text("Submit Report")'));
    await page.locator('text="Report submitted."').first().waitFor({ timeout: 10000 }).catch(() => {});
    await sleep(1800);
  } catch (e) {
    log(`  [warn] s08 report failed: ${e.message}`);
  }
  try {
    await tap(page, page.getByRole('button', { name: 'Letters' }));
    await page.locator('text="Raj Kulkarni"').first().waitFor({ timeout: 15000 });
    await page.locator('text="Raj Kulkarni"').first().tap();
    await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
    await sleep(1200);
    await tap(page, page.getByRole('button', { name: 'Open chat options' }));
    await tap(page, page.locator('button:has-text("Block User")'));
    await sleep(3000);
  } catch (e) {
    log(`  [warn] s08 block failed: ${e.message}`);
  }
  return closeContext({ context, videoDir: dir, name: 's08' });
}

async function runS09({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's09');
  const { context, page } = await makeContext(browser, dir, 's09');
  await loginViaOtp(page, 'admin@test.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await page.goto(`${QA_ORIGIN}/admin`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Total Users', { exact: true }).first().waitFor({ timeout: 25000 }).catch(() => {});
  await sleep(2500);
  try {
    await page.locator('button:has-text("Reports")').tap();
    await page.locator('text="Kabir Anand"').first().waitFor({ timeout: 20000 });
    await sleep(1200);
    await page.locator('text="Kabir Anand"').first().tap();
    await sleep(700);
    const action = page.locator('button:has-text("Action")').first();
    if (await action.isVisible().catch(() => false)) {
      await action.tap();
      await sleep(1600);
    }
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(700);
  } catch (e) {
    log(`  [warn] s09 reports action failed: ${e.message}`);
  }
  try {
    await page.locator('button:has-text("Users")').tap().catch(() => {});
    await sleep(700);
    const search = page.getByPlaceholder('Search by name or email...').first();
    await search.fill('kabir');
    await search.press('Enter');
    await page.locator('text="Kabir Anand"').first().waitFor({ timeout: 20000 });
    await page.locator('text="Kabir Anand"').first().tap();
    await sleep(700);
    await page.locator('button:has-text("Suspend")').tap();
    await sleep(2200);
    await page.keyboard.press('Escape').catch(() => {});
  } catch (e) {
    log(`  [warn] s09 suspend failed: ${e.message}`);
  }
  await sleep(1800);
  return closeContext({ context, videoDir: dir, name: 's09' });
}

async function runS10({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's10');
  const { context, page } = await makeContext(browser, dir, 's10');
  try {
    await loginViaOtp(page, 'kabir.anand@iitb.ac.in');
  } catch (e) {
    log(`  [warn] s10 login attempt logged failure: ${e.message}`);
  }
  await page.getByText(/suspend/i).first().waitFor({ timeout: 15000 }).catch(() => {});
  await sleep(3500);
  return closeContext({ context, videoDir: dir, name: 's10' });
}

async function runS11({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's11');
  const { context, page } = await makeContext(browser, dir, 's11');
  await loginViaOtp(page, 'sanya.sharma@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(1000);
  await tap(page, page.getByRole('button', { name: 'Letters' }));
  await page.locator('text="Nishant Jain"').first().waitFor({ timeout: 15000 });
  await sleep(800);
  // open the chat and unmatch from the chat options
  await page.locator('text="Nishant Jain"').first().tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(1200);
  await tap(page, page.getByRole('button', { name: 'Open chat options' }));
  await tap(page, page.locator('button:has-text("Unmatch")'));
  await sleep(3500);
  return closeContext({ context, videoDir: dir, name: 's11' });
}

async function runS12({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's12');
  const { context, page } = await makeContext(browser, dir, 's12');
  await loginViaOtp(page, 'admin@test.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await page.goto(`${QA_ORIGIN}/admin`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Total Users', { exact: true }).first().waitFor({ timeout: 25000 }).catch(() => {});
  await sleep(4500);
  return closeContext({ context, videoDir: dir, name: 's12' });
}

async function runS14({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's14');
  const { context, page } = await makeContext(browser, dir, 's14');
  await advanceSplash(page, { maxSwipes: 8 });
  await page.locator('input[type="email"]').waitFor({ timeout: 20000 }).catch(() => {});
  await sleep(2000);
  return closeContext({ context, videoDir: dir, name: 's14' });
}

async function runS15({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's15');
  const { context, page } = await makeContext(browser, dir, 's15');
  await loginViaOtp(page, 'arohi.kapoor@iitb.ac.in');
  await page.locator('text=The Dossier.').first().waitFor({ timeout: 20000 });
  await driveOnboarding(page, cfg, { name: 'Arohi Kapoor', gender: 'female', interestedIn: ['MALE'], dobD: 22, dobM: 11, dobY: 2006, fast: true });
  await page.locator('img').first().waitFor({ timeout: 30000 }).catch(() => {});
  await sleep(1500);
  try {
    await tap(page, page.getByRole('button', { name: 'View notifications' }));
    await page.locator('text="Ved Desai"').first().waitFor({ timeout: 15000 });
    await sleep(3000);
  } catch (e) {
    log(`  [warn] s15 welcome letter peek failed: ${e.message}`);
  }
  return closeContext({ context, videoDir: dir, name: 's15' });
}

export const runners = {
  s01: runS01,
  s02: runS02,
  s03: runS03,
  s04: runS04,
  s05: runS05,
  s06: runS06,
  s07: runS07,
  s08: runS08,
  s09: runS09,
  s10: runS10,
  s11: runS11,
  s12: runS12,
  s14: runS14,
  s15: runS15,
};

export async function loadConfig() {
  const res = await fetch(`${QA_ORIGIN}/api/config`);
  return res.json();
}
```

### ./server/tests/society/art.mjs

```
// Deterministic SVG persona art -> data URIs. No external requests, ever.

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

const PALETTES = [
  ['#2b1a4e', '#582b8f', '#e8a6ff'],
  ['#0e2a47', '#1f5f8f', '#9fd6ff'],
  ['#3a1d0d', '#8f4a1f', '#ffc89f'],
  ['#1d3a0d', '#4f8f1f', '#c4ff9f'],
  ['#420d1d', '#8f1f47', '#ff9fc2'],
  ['#0d2e2e', '#1f6f6f', '#9fffff'],
  ['#2e2e0d', '#6f6f1f', '#ffff9f'],
  ['#3a0d24', '#8f1f5e', '#ff9fe0'],
];

function ip(f) {
  return Math.floor(f() * 100000) % 100;
}

export function personaImage(seed, variant = 'portrait') {
  const rnd = xmur3(String(seed));
  const pal = PALETTES[ip(rnd) % PALETTES.length];
  const [dark, mid, light] = pal;
  const dims =
    variant === 'land' ? { w: 1280, h: 720 } : variant === 'square' ? { w: 600, h: 600 } : { w: 600, h: 800 };
  const { w, h } = dims;
  const cx = ip(rnd) % w;
  const cy = ip(rnd) % h;
  const pattern = ip(rnd) % 4;
  const rings = (ip(rnd) % 6) + 3;
  const initials = String(seed)
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  let deco = '';
  if (pattern === 0) {
    for (let i = 0; i < rings; i++) {
      deco += `<circle cx="${cx}" cy="${cy}" r="${90 + i * 54}" fill="none" stroke="${light}" stroke-opacity="${0.14 + ip(rnd) / 300}" stroke-width="${6 + (ip(rnd) % 10)}"/>`;
    }
  } else if (pattern === 1) {
    const step = 60;
    for (let x = -h; x < w + h; x += step) {
      deco += `<line x1="${x}" y1="0" x2="${x + h}" y2="${h}" stroke="${light}" stroke-opacity="0.12" stroke-width="${4 + (ip(rnd) % 12)}"/>`;
    }
  } else if (pattern === 2) {
    for (let i = 0; i < 40; i++) {
      deco += `<circle cx="${ip(rnd) % w}" cy="${ip(rnd) % h}" r="${2 + (ip(rnd) % 9)}" fill="${light}" fill-opacity="0.25"/>`;
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const bx = ip(rnd) % w;
      const by = ip(rnd) % h;
      deco += `<rect x="${bx}" y="${by}" width="${120 + (ip(rnd) % 220)}" height="${160 + (ip(rnd) % 260)}" rx="90" transform="rotate(${ip(rnd) % 360} ${bx} ${by})" fill="${light}" fill-opacity="0.10"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset="1" stop-color="${mid}"/>
    </linearGradient>
    <radialGradient id="v">
      <stop offset="68%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${w * 0.85}" ry="${h * 0.85}" fill="${light}" fill-opacity="0.07"/>
  ${deco}
  <text x="${w / 2}" y="${h / 2}" text-anchor="middle" dominant-baseline="central"
    font-family="Georgia, serif" font-weight="700" font-size="${Math.round(h / 3)}"
    fill="${light}" fill-opacity="0.85" letter-spacing="4">${initials || '*'}</text>
  <rect width="${w}" height="${h}" fill="url(#v)"/>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
```

### ./server/tests/society/cast.mjs

```
// Named cast roles.
export const CAST = {
  admin: {
    email: 'admin@test.ac.in',
    name: 'Aman Rao',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating'],
    age: 23,
    branch: 'CS',
    year: '4th',
    hostel: 'Hostel 7',
    bio: 'Admin account for campus safety — I watch over this campus.',
    isAdmin: true,
  },
  anaya: {
    email: 'anaya.mehta@iitb.ac.in',
    name: 'Anaya Mehta',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Dating'],
    age: 20,
  },
  drishti: {
    email: 'drishti.iyer@iitb.ac.in',
    name: 'Drishti Iyer',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Dating'],
    age: 21,
  },
  arjun: {
    email: 'arjun.ks@iitb.ac.in',
    name: 'Arjun K',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating'],
    age: 22,
  },
  anika: {
    email: 'anika.singh@iitb.ac.in',
    name: 'Anika Singh',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Dating', 'Friends'],
    age: 20,
  },
  rohan: {
    email: 'rohan.g@iitb.ac.in',
    name: 'Rohan Gokhale',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating'],
    age: 21,
  },
  mira: {
    email: 'mira.nair@iitb.ac.in',
    name: 'Mira Nair',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Friends'],
    age: 20,
  },
  ved: {
    email: 'ved.desai@iitb.ac.in',
    name: 'Ved Desai',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating'],
    age: 22,
  },
  sanya: {
    email: 'sanya.sharma@iitb.ac.in',
    name: 'Sanya Sharma',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Dating'],
    age: 21,
  },
  nishant: {
    email: 'nishant.j@iitb.ac.in',
    name: 'Nishant Jain',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating'],
    age: 22,
  },
  raj: {
    email: 'raj.kulkarni@iitb.ac.in',
    name: 'Raj Kulkarni',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating', 'Friends'],
    age: 23,
  },
  kabir: {
    email: 'kabir.anand@iitb.ac.in',
    name: 'Kabir Anand',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating'],
    age: 21,
  },
  priya: {
    email: 'priya.das@iitb.ac.in',
    name: 'Priya Das',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Friends'],
    age: 21,
  },
  arohi: {
    email: 'arohi.kapoor@iitb.ac.in',
    name: 'Arohi Kapoor',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Dating'],
    age: 19,
    fresh: true,
  },
  khushi: {
    email: 'khushi.verma@iitb.ac.in',
    name: 'Khushi Verma',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Dating'],
    age: 19,
    fresh: true,
  },
};

export const CAST_ORDER = Object.keys(CAST);
```

### ./server/tests/society/personas.mjs

```
import { CAST, CAST_ORDER } from './cast.mjs';
import { personaImage } from './art.mjs';
import { computeAgeFromDob } from '../../utils/age.js';

// A dob that resolves to exactly `spec.age` today — age is derived from dob at
// read time (utils/age.js), so personas need both to agree.
const dobForAge = (age) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setDate(d.getDate() - 5);
  return d;
};

// Self-check: personas drive the QA harness, and an off-by-one here would make
// every QA screenshot show a plausible-but-wrong age.
if (computeAgeFromDob(dobForAge(21)) !== 21) {
  throw new Error('dobForAge() does not round-trip through computeAgeFromDob()');
}

// Deterministic name pool for the filler society (balance ~ 24M / 16F)
const PERSONA_NAMES = [
  ['Aarav Patel', 'M'], ['Ishaan Reddy', 'M'], ['Vihaan Shah', 'M'], ['Kabir Nair', 'M'],
  ['Aditya Rao', 'M'], ['Dev Malik', 'M'], ['Reyansh Bose', 'M'], ['Arnav Gupta', 'M'],
  ['Krish Talwar', 'M'], ['Zoya Khan', 'F'], ['Aisha Sheikh', 'F'], ['Meera Joshi', 'F'],
  ['Tara Verma', 'F'], ['Riya Kulkarni', 'F'], ['Sara Ali', 'F'], ['Ira Menon', 'F'],
  ['Dhruv Saxena', 'M'], ['Ved Agarwal', 'M'], ['Manav K', 'M'], ['Yash Deshpande', 'M'],
  ['Nikhil Pillai', 'M'], ['Karan D', 'M'], ['Ritvik Bhat', 'M'], ['Sid Mehra', 'M'],
  ['Navya Iyer', 'F'], ['Anvi Bhatt', 'F'], ['Ruhi Das', 'F'], ['Maya Chawla', 'F'],
  ['Kiara Sehgal', 'F'], ['Diya Nair', 'F'], ['Aadhya B', 'F'], ['Vaani Rao', 'F'],
  ['Rohan Joshi', 'M'], ['Parth Thakur', 'M'], ['Gautam Sinha', 'M'], ['Neel Kulkarni', 'M'],
  ['Aditya Verma', 'M'], ['Kunal Bajaj', 'M'], ['Ritika Sen', 'F'], ['Ishan Garg', 'M'],
];

const BRANCH_POOL = ['CS', 'EE', 'ME', 'Civil', 'Chem', 'Aero', 'Design', 'MATH', 'Physics', 'Meta'];
const YEAR_POOL = ['1st', '2nd', '3rd', '4th', 'PG'];
const HOSTEL_POOL = ['Hostel 1', 'Hostel 2', 'Hostel 3', 'Hostel 4', 'Hostel 5', 'Hostel 6', 'Hostel 7', 'Hostel 10'];
const BIO_POOL = [
  'Optimistic, chronically 5 minutes late, and slightly obsessed with the mess’s kadhi.',
  'Found wandering Powai at 2am. Ask me about the lakeside bench with the best sunset.',
  'Future chaos coordinator of this campus. My doodles have more friends than I do.',
  'Will debate you on film endings for hours, but will never reveal who signs the hostel register for me.',
  'Caffeine-powered, deadline-driven, secretly a softie. My plant is named after my ex.',
  'I rate sunsets and canteen chai. Your move.',
  'Accountable to no one but the canteen guy who knows my order by heart.',
  'Chemistry lab survivor. Will build you a robot that brings chai.',
];
const ANSWER_POOL = [
  'Because I think the little rituals matter more than the loud things.',
  'Honestly? I just want someone to share a quiet evening with.',
  'I wrote down my answer three times. This is the fourth draft.',
  'Roleplay DMs to the freshers’ group chat said otherwise.',
  'Ask me again after 10pm — my night-owl brain is sharper.',
  'My hostel wingmates vetoed anything too sincere.',
  'True story: I once convinced a professor the homework got eaten by a goat.',
  'I peaked in this one random inter-year quiz and I’m still chasing that high.',
];

function hashNum(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick(list, n) {
  return list[n % list.length];
}

let fillerIdx = 0;

const normGender = (g) => {
  const k = String(g || '').toLowerCase();
  if (k === 'male') return 'Male';
  if (k === 'female') return 'Female';
  if (k === 'non-binary' || k === 'nonbinary') return 'Non-binary';
  return g;
};

const normInterested = (list) =>
  (list || []).map((g) => {
    const k = String(g).toLowerCase();
    if (k === 'male') return 'Male';
    if (k === 'female') return 'Female';
    if (k === 'non-binary' || k === 'nonbinary') return 'Non-binary';
    if (k === 'everyone') return 'Everyone';
    return g;
  });

function buildFiller(cfg) {
  const [rawName, sex] = PERSONA_NAMES[fillerIdx++ % PERSONA_NAMES.length];
  const idx = fillerIdx;
  const name = `${rawName}`;
  const email = `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}${idx}@iitb.ac.in`;
  const seed = email;
  const age = 19 + (hashNum(email + 'a') % 4);
  return {
    email,
    name,
    gender: normGender(sex === 'M' ? 'male' : 'female'),
    interestedIn: normInterested(sex === 'M' ? ['female'] : ['male']),
    intent: ['Dating', 'Friends'],
    age,
    role: null,
    seed,
    _fillIdx: idx,
  };
}

export function buildPersonas(cfg) {
  fillerIdx = 0;
  const prompts = cfg.prompts || ['A shower thought I recently had...', 'My ideal weekend looks like...', 'Two truths and a lie...'];
  const interests = cfg.interests || [];
  const branches = cfg.branches || BRANCH_POOL;
  const years = cfg.years || YEAR_POOL;

  const buildUser = (spec, role) => {
    const seed = spec.email;
    const photos = [
      personaImage(seed + ':p0', 'portrait'),
      personaImage(seed + ':p1', 'square'),
      personaImage(seed + ':p2', 'square'),
      personaImage(seed + ':p3', 'land'),
    ];
    // Three prompt slots, filled from the prompt bank.
    const promptSlots = [0, 1, 2].map((_, i) => ({
      question: prompts[i % prompts.length] || `A shower thought I recently had...`,
      answer: pick(ANSWER_POOL, hashNum(seed + 'a' + i)),
      photoUrl: i === 0 ? photos[2] : '',
    }));
    const gender = normGender(spec.gender) || 'Female';
    return {
      email: spec.email,
      college: 'Indian Institute of Technology Bombay',
      collegeCode: 'iitb',
      isVerified: true,
      isOnboarded: !spec.fresh,
      name: spec.name,
      age: spec.age,
      dob: dobForAge(spec.age),
      gender,
      pronouns: gender === 'Male' ? 'he/him' : gender === 'Female' ? 'she/her' : 'they/them',
      branch: spec.branch || pick(branches, hashNum(seed)),
      year: spec.year || pick(years, hashNum(seed + 'y')),
      hostel: spec.hostel || pick(HOSTEL_POOL, hashNum(seed + 'h')),
      bio: spec.bio || pick(BIO_POOL, hashNum(seed + 'b')),
      photos,
      prompts: promptSlots,
      intent: spec.intent || ['Dating'],
      interestedIn: normInterested(spec.interestedIn),
      interests: [pick(interests, hashNum(seed + 'i1')), pick(interests, hashNum(seed + 'i2')), pick(interests, hashNum(seed + 'i3'))].filter((v, i, a) => a.indexOf(v) === i),
      onboardingStep: 8,
      role,
    };
  };

  const castUsers = {};
  for (const key of CAST_ORDER) {
    const spec = { ...CAST[key] };
    castUsers[key] = buildUser(spec, key);
    castUsers[key].isAdmin = !!spec.isAdmin;
    castUsers[key]._role = key;
    if (spec.fresh) {
      castUsers[key].isOnboarded = false;
      castUsers[key].onboardingStep = 1;
    }
  }

  const fillers = [];
  for (let i = 0; i < 40; i++) {
    const spec = buildFiller(cfg);
    const u = buildUser(spec, null);
    u._fillIdx = spec._fillIdx;
    fillers.push(u);
  }

  return { castUsers, fillers };
}

// Ordered list of every society user for backdating + lookups.
export function flattenPersonas({ castUsers, fillers }) {
  const out = [];
  for (const key of CAST_ORDER) out.push({ role: key, user: castUsers[key] });
  for (const f of fillers) out.push({ role: null, user: f });
  return out;
}
```

### ./server/tests/society/seedSociety.mjs

```
import mongoose from 'mongoose';
import User from '../../models/User.js';
import Interaction from '../../models/Interaction.js';
import Notification from '../../models/Notification.js';
import Alignment from '../../models/Alignment.js';
import Message from '../../models/Message.js';
import Report from '../../models/Report.js';
import { connectMongo, disconnectMongo, resetTestDb } from '../lib/mongo.mjs';
import { QA_ORIGIN } from '../lib/env.mjs';
import { buildPersonas, flattenPersonas } from './personas.mjs';
import { CAST_ORDER } from './cast.mjs';
import { computeScore } from '../../utils/ladder.js';

const H = 3600 * 1000;
const D = 24 * H;

function pairKey(a, b) {
  return [a._id.toString(), b._id.toString()].sort().join('__');
}

async function fetchConfig() {
  const res = await fetch(`${QA_ORIGIN}/api/config`);
  return res.json();
}

export async function seedSociety() {
  await connectMongo(process.env.MONGODB_URI);
  await resetTestDb();
  const cfg = await fetchConfig();
  const { castUsers, fillers } = buildPersonas(cfg);

  const docs = flattenPersonas({ castUsers, fillers }).map(({ role, user }) => ({ ...user }));

  /* Seed the ladder score with the same pure function the write routes use.
     persona rows go in via insertMany, which never touches the recompute in
     /users/setup or PUT /profile — so without this every society row sits at
     the schema default of 0, below LADDER.publish, and the QA deck reads as
     entirely locked rather than exercising the cards it was built to exercise. */
  docs.forEach((d) => { d.profileScore = computeScore(d); });

  const inserted = await User.insertMany(docs);
  const byRole = {};
  const byEmail = {};
  const emailToRole = {};
  for (const key of CAST_ORDER) emailToRole[castUsers[key].email] = key;
  for (const doc of inserted) {
    byEmail[doc.email] = doc;
    const role = emailToRole[doc.email];
    if (role) byRole[role] = doc;
  }
  const all = inserted;
  const maleFillers = all.filter((u) => String(u.gender).toLowerCase() === 'male' && !u._role);
  const femaleFillers = all.filter((u) => String(u.gender).toLowerCase() === 'female' && !u._role);
  const match = (base, off) => { const d = new Date(Date.now() - off); return d; };

  // --- 1. LETTERS / TELEGRAMS (Inbox content for the cast) ---
  const letter = async ({ from, to, type, note, hoursAgo = 0, cleared = false }) => {
    const it = await Interaction.create({
      actorId: from._id,
      targetId: to._id,
      actionType: type,
      letterContent: note,
      targetArtifact: null,
      cooldownExpiresAt: null,
      createdAt: match(null, hoursAgo * H),
      updatedAt: match(null, hoursAgo * H),
    });
    await Notification.create({
      recipientId: to._id,
      senderId: from._id,
      type: type === 'telegram' ? 'priority_telegram' : 'new_letter',
      interactionRef: it._id,
      isCleared: cleared,
      createdAt: match(null, hoursAgo * H),
      updatedAt: match(null, hoursAgo * H),
    });
    return it;
  };

  await letter({ from: byRole.arjun, to: byRole.drishti, type: 'letter', note: 'The way the light falls on the library steps at six — I think you’d see it the same way.', hoursAgo: 1, cleared: true });
  await letter({ from: byRole.mira, to: byRole.anika, type: 'letter', note: 'Your mess doodle of the chef got me through finals week. Dinner sometime?', hoursAgo: 2 });
  await letter({ from: byRole.ved, to: byRole.anika, type: 'telegram', note: 'Priority note — amphitheatre, sunset, tonight. You in?', hoursAgo: 2 });
  await letter({ from: byRole.ved, to: byRole.arohi, type: 'letter', note: 'Welcome to campus. If you want a map that’s actually honest, I know good shortcuts.', hoursAgo: 3 });

  // --- 2. SEEDED MATCHES + CONVERSATIONS (history for Matches/Chat scenes) ---
  const seedMatch = async ({ a, b, sinceDays, thread }) => {
    const pkey = pairKey(a, b);
    const m = await Alignment.create({
      users: [a._id, b._id],
      pairKey: pkey,
      isActive: true,
      unlockedByInteractionId: new mongoose.Types.ObjectId(),
      createdAt: match(null, sinceDays * D),
      updatedAt: match(null, sinceDays * D),
    });
    let t = sinceDays * D;
    for (const [idx, mtext] of thread.entries()) {
      const [senderKey, text, read] = mtext;
      const senderDoc = byRole[senderKey] || byEmail[senderKey];
      await Message.create({
        alignmentId: m._id,
        senderId: senderDoc._id,
        type: 'text',
        text,
        reactions: [],
        readAt: read === false ? null : match(null, t - 30 * 60 * 1000),
        deliveryStatus: 'sent',
        createdAt: match(null, t),
        updatedAt: match(null, t),
      });
      t -= (9 + idx) * H;
    }
    return m;
  };

  const matches = {};
  matches['anika-rohan'] = await seedMatch({
    a: byRole.anika, b: byRole.rohan, sinceDays: 6, thread: [
      ['rohan', 'Okay that physics lecture was genuinely cursed today.', false],
      ['anika', 'RIGHT? I took notes in a different language by minute 20.', false],
      ['rohan', 'Lol. Coffee rescue mission at CCC tomorrow?', false],
      ['anika', 'Deal. If you bring the cold brew, I’ll bring the good playlist.', false],
      ['rohan', 'The one with the Coachella sets from 2022?', true],
      ['anika', 'Shhh. It’s sentimental.', true],
    ],
  });
  matches['anika-f1'] = await seedMatch({
    a: byRole.anika, b: maleFillers[0], sinceDays: 4, thread: [
      [maleFillers[0]._role || maleFillers[0].email, 'Saw you at the quizzing club. You argued with the quizmaster? Respect.', false],
      ['anika', 'Haha, the question was objectively wrong. A matter of principle!', false],
      [maleFillers[0]._role || maleFillers[0].email, 'Our principles usually cost us points, but I respect it.', false],
    ],
  });
  matches['anika-f2'] = await seedMatch({
    a: byRole.anika, b: maleFillers[1], sinceDays: 3, thread: [
      [maleFillers[1]._role || maleFillers[1].email, 'Your photography page is criminally under-followed.', false],
      ['anika', 'Cheap phone, golden hour. I’ll take it.', false],
      [maleFillers[1]._role || maleFillers[1].email, 'Golden hour does all the work. Jk, your eye is good.', true],
    ],
  });
  matches['drishti-raj'] = await seedMatch({
    a: byRole.drishti, b: byRole.raj, sinceDays: 2, thread: [
      ['raj', 'Hey, we matched a while ago. You’re hard to pin down.', false],
      ['raj', 'Anyway, I’m hosting a small thing at my wing this Friday.', true],
      ['drishti', 'I’m a bit busy with submissions this week.', true],
      ['raj', 'Right. Busy. Sure.', false],
    ],
  });
  matches['sanya-nishant'] = await seedMatch({
    a: byRole.sanya, b: byRole.nishant, sinceDays: 5, thread: [
      ['nishant', 'You have an unfair advantage in our cricket debates: you actually play.', true],
      ['sanya', 'And yet you still argue with me about spin bowling.', true],
      ['nishant', 'Some hills are worth dying on.', true],
    ],
  });

  // --- 3. KABIR: 3 pending community reports (auto-shadowban at 3, not suspended) ---
  const kabirReporters = femaleFillers.slice(0, 3);
  for (let i = 0; i < kabirReporters.length; i++) {
    await Report.create({
      reporter: kabirReporters[i]._id,
      reported: byRole.kabir._id,
      reason: i === 0 ? 'Harassment or bullying' : i === 1 ? 'Inappropriate photos' : 'Fake profile or spam',
      details: '',
      status: 'pending',
      createdAt: match(null, (5 - i) * H + (i % 2) * 3 * H),
    });
  }
  await User.updateOne(
    { _id: byRole.kabir._id },
    { $set: { shadowbannedAt: new Date(Date.now() - 4 * H), contentFrozen: true } }
  );

  // --- 4. TIME-WARP user timestamps + lastActive ---
  const recentRoles = ['anaya', 'drishti', 'arjun', 'anika', 'sanya', 'arohi', 'khushi'];
  const now = Date.now();
  const backdate = async (u, createdAgo, activeAgo) => {
    await User.updateOne(
      { _id: u._id },
      {
        $set: {
          createdAt: new Date(now - createdAgo),
          updatedAt: new Date(now - (createdAgo / 2)),
          lastActive: new Date(now - activeAgo),
        },
      }
    );
  };
  for (const u of all) {
    const activeAgo = recentRoles.includes(u._role)
      ? 0
      : u._role === 'rohan' || u._role === 'mira' || u._role === 'ved' || u._role === 'nishant' || u._role === 'raj'
        ? (8 + (u.email.length % 10)) * H
        : (12 + (u.email.charCodeAt(2) % 30)) * H;
    await backdate(u, 30 * D + (u._fillIdx || 0) * 37 * 60 * 1000, activeAgo);
  }

  const world = {
    byRole,
    byEmail,
    castUsers,
    matches,
    kabirReporters: kabirReporters.map((r) => r._id),
    connectors: { anikaRohan: matches['anika-rohan']._id, drishtiRaj: matches['drishti-raj']._id, sanyaNishant: matches['sanya-nishant']._id },
  };

  await disconnectMongo();
  return world;
}
```

