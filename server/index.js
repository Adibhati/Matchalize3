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
