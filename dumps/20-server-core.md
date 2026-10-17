# Chunk 20 — Server Core

> Matchalize · `server-core` · files 20 of 27 chunks · 10 file(s) · 46 KB · ~13,371 tokens
> Generated 2026-10-17 20:14.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./server/socket/chat.js`
> - `./server/utils/AppError.js`
> - `./server/utils/campusGate.js`
> - `./server/utils/campusSeed.js`
> - `./server/utils/email.js`
> - `./server/utils/media.js`
> - `./server/utils/otpHash.js`
> - `./server/utils/publicCard.js`
> - `./server/utils/push.js`
> - `./server/utils/queue.js`

---
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

