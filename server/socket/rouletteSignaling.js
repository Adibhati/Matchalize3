/**
 * 🎰 ROULETTE — the queue and the call signaling.
 *
 * ── WHAT THIS IS ─────────────────────────────────────────────────────────────
 * Chatroulette with the profile switched off. You arrive, you wait, the server
 * pairs you with whoever else is waiting, you talk face to face, you press Next.
 * Nobody ever sees a name, a college, or a profile.
 *
 * ── WHY THIS FILE HAS NO DATABASE IMPORTS ─────────────────────────────────────
 * Every check that touches the database — "are these two blocked?", "is this
 * account suspended?" — arrives through `deps`. That is not architectural
 * purity, it is testability: CI has no MongoDB (there is no
 * mongodb-memory-server, and the existing harness in `tests/lib/mongo.mjs`
 * deliberately talks to a real cluster, which is why the QA job in CI is
 * commented out as "not wired up yet"). Injecting the checks means the queue,
 * the pairing races and the crash-safety guarantees are all provable in CI
 * without a database or a browser.
 *
 * `socket/roulette.js` is the thin wrapper that supplies real mongoose-backed
 * implementations. Nothing here knows mongoose exists.
 *
 * ── THE CRASH RULE ───────────────────────────────────────────────────────────
 * `server/socket/chat.js:151-162` documents an existing production hazard: a
 * socket event with a missing or wrong-shaped payload throws inside Socket.IO's
 * `process.nextTick` dispatch, which has no try/catch, becomes an
 * `uncaughtException`, and `server/index.js:574` responds with `process.exit(1)`.
 * One malformed packet from one authenticated user takes down the whole app for
 * everyone.
 *
 * Stage 3 is the first feature where strangers send us large attacker-controlled
 * strings, so this module makes that structurally impossible rather than
 * careful. Two independent layers:
 *
 *   1. `safeHandler` wraps EVERY registered handler in a try/catch. This is the
 *      layer that actually stops the process dying, and it does so even for
 *      throws that no shape check anticipated.
 *   2. Validators reject bad payloads before any state is touched.
 *
 * Layer 1 is what makes layer 2 an optimisation rather than the only defence.
 * `handlers` is exported so a test can assert that nothing is registered
 * un-wrapped — that assertion is the thing keeping layer 1 true as handlers are
 * added over time.
 *
 * ── WHAT IS DELIBERATELY ABSENT ──────────────────────────────────────────────
 * No TURN (Stage 4), no skip/recovery/safety UI (Stage 6), no Align request
 * (Stage 7), no chat (Stage 8), no profile reveal (Stage 9). Pairing here is
 * first-in-first-out among allow-listed test accounts only.
 *
 * Design source: ambitions/roulette.md §11, §13, §15
 */

import { randomUUID } from 'crypto';

/* ═══════════════════════════════════════════════════════════════════════════
 * EVENTS
 *
 * Same names in both directions; Socket.IO separates them by direction. Every
 * inbound event carries `sessionId` so that a signal belonging to a finished
 * call can be rejected rather than applied to whatever call is current now.
 *
 * `call:terminated` keeps the name the spec already commits to (§13: "Refuses
 * new pairs, emits `call:terminated`") and is reserved for a SERVER decision —
 * capacity, the kill switch. `call:ended` is a participant leaving or pressing
 * Next. Two names for genuinely different causes beats one ambiguous one.
 * ═══════════════════════════════════════════════════════════════════════════ */

export const CALL_EVENTS = Object.freeze({
  /* client → server */
  JOIN: 'call:join',
  LEAVE_QUEUE: 'call:leave-queue',
  OFFER: 'call:offer',
  ANSWER: 'call:answer',
  ICE: 'call:ice',
  MEDIA_STATE: 'call:media-state',
  NEXT: 'call:next',
  END: 'call:end',
  /* server → client */
  SEARCHING: 'call:searching',
  MATCHED: 'call:matched',
  PEER_MEDIA: 'call:peer-media',
  ENDED: 'call:ended',
  TERMINATED: 'call:terminated',
  RATE_LIMITED: 'call:rate-limited',
});

/** Every inbound event this module listens for. Used by the wrapper test. */
export const INBOUND_EVENTS = Object.freeze([
  CALL_EVENTS.JOIN,
  CALL_EVENTS.LEAVE_QUEUE,
  CALL_EVENTS.OFFER,
  CALL_EVENTS.ANSWER,
  CALL_EVENTS.ICE,
  CALL_EVENTS.MEDIA_STATE,
  CALL_EVENTS.NEXT,
  CALL_EVENTS.END,
]);

/**
 * Keys allowed to appear in any server → client payload.
 *
 * Roulette's central privacy promise is that the person on the other end is a
 * face with no identity attached. Every emit in this module is filtered through
 * `assertNoIdentity`, so a future edit that helpfully adds `peerName` fails a
 * test instead of shipping. `sessionId` is the only opaque handle — it is a
 * random UUID that identifies a call, not a person, and both sides already hold
 * each other's socket to know who is talking to them.
 */
const FORBIDDEN_PAYLOAD_KEYS = Object.freeze([
  'userId', 'peerId', 'name', 'userName', 'username', 'displayName',
  'firstName', 'lastName', 'email', 'phone', 'college', 'collegeName',
  'profile', 'avatar', 'photo', 'photos', 'bio', 'prompt', 'gender',
  'age', 'city', 'intent', 'intention', 'socketId', 'token',
]);

/* ═══════════════════════════════════════════════════════════════════════════
 * VALIDATION
 * ═══════════════════════════════════════════════════════════════════════════ */

const SESSION_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

/** Prototype-pollution keys. Rejected anywhere in an inbound payload. */
const POLLUTION_KEYS = Object.freeze(['__proto__', 'constructor', 'prototype']);

/**
 * Walk a payload looking for prototype-pollution keys.
 *
 * Depth-limited because these payloads are shallow by design; an attacker
 * nesting 50,000 objects deep is a different threat (parser stack overflow,
 * handled by the try/catch in safeHandler) and this walk must not become the
 * thing that burns CPU.
 */
const findPollutionKey = (value, depth = 0) => {
  if (depth > 6 || value === null || typeof value !== 'object') return null;
  for (const key of Object.keys(value)) {
    if (POLLUTION_KEYS.includes(key)) return key;
    const nested = findPollutionKey(value[key], depth + 1);
    if (nested) return nested;
  }
  return null;
};

/** A bounded, correctly-typed string, or null. */
export const safeString = (value, { min = 0, max = 256 } = {}) => {
  if (typeof value !== 'string') return null;
  if (value.length < min || value.length > max) return null;
  return value;
};

export const safeSessionId = (value) => {
  const s = safeString(value, { min: 8, max: 64 });
  return s && SESSION_ID_RE.test(s) ? s : null;
};

/**
 * An SDP blob.
 *
 * The length bound is in JavaScript characters rather than bytes, so it is a
 * ~3x-overestimate against UTF-8 — deliberately loose in the permissive
 * direction, because the aim is to stop a 50 MB payload, not to shave kilobytes
 * off a legitimate offer. A real offer for one video track plus one audio track
 * is roughly 2-4 KB, so the default ceiling leaves enormous headroom.
 *
 * The floor matters as much as the ceiling: an SDP shorter than 20 characters
 * cannot be a real description and is only ever an attempt to make the peer
 * throw.
 */
export const safeSdp = (value, maxChars) => {
  const s = safeString(value, { min: 20, max: maxChars });
  if (s === null) return null;
  return { type: 'offer', sdp: s };
};

/**
 * An ICE candidate.
 *
 * Rebuilt field by field rather than forwarded. Forwarding the client's object
 * would relay whatever extra properties it carried into another user's socket
 * handler — the classic socket relay bug.
 */
export const safeCandidate = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (findPollutionKey(value) !== null) return null;

  const candidate = safeString(value.candidate, { min: 1, max: 2048 });
  if (candidate === null) return null;

  const out = { candidate };

  if (value.sdpMid !== undefined && value.sdpMid !== null) {
    const mid = safeString(value.sdpMid, { max: 16 });
    if (mid === null) return null;
    out.sdpMid = mid;
  }

  if (value.sdpMLineIndex !== undefined && value.sdpMLineIndex !== null) {
    const idx = value.sdpMLineIndex;
    if (!Number.isInteger(idx) || idx < 0 || idx > 32) return null;
    out.sdpMLineIndex = idx;
  }

  return out;
};

/** Mic/camera state. Two booleans, nothing else — no identity may ride along. */
export const safeMediaState = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (typeof value.audioOn !== 'boolean' || typeof value.videoOn !== 'boolean') return null;
  return { audioOn: value.audioOn, videoOn: value.videoOn };
};

/**
 * Fail a test, and in production drop the payload, if a server → client emit
 * ever carries something resembling identity.
 *
 * This is the enforcement point behind the `FORBIDDEN_PAYLOAD_KEYS` list.
 */
export const assertNoIdentity = (eventName, payload) => {
  if (!payload || typeof payload !== 'object') return;
  for (const key of Object.keys(payload)) {
    if (FORBIDDEN_PAYLOAD_KEYS.includes(key)) {
      throw new Error(
        `[roulette] REFUSING to emit "${eventName}": payload carries "${key}". `
        + 'Roulette partners must never receive identity — see ambitions/roulette.md §1.3.',
      );
    }
  }
};

/**
 * Wrap a handler so it cannot take the process down.
 *
 * Catches synchronous throws AND rejected promises, because an async handler
 * that rejects reaches the same `unhandledRejection` path that `index.js:565`
 * logs but does not exit on — silently swallowing a real bug is worse than
 * crashing, so it is logged loudly.
 *
 * This is the single most important function in the file.
 */
const safeHandler = (name, fn, logger) => function wrapped(...args) {
  try {
    const result = fn(...args);
    if (result && typeof result.catch === 'function') {
      result.catch((err) => {
        logger(`[roulette] async failure in "${name}"`, err);
      });
    }
    return result;
  } catch (err) {
    logger(`[roulette] synchronous throw in "${name}" — contained`, err);
    return undefined;
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
 * THE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @param {object} opts
 * @param {import('socket.io').Server} opts.io
 * @param {object} opts.settings            ROULETTE_SETTINGS
 * @param {(userId: string) => boolean} opts.deps.isAllowed
 * @param {(a: string, b: string) => Promise<{ok:boolean, reason?:string, blame?:'a'|'b'}>} opts.deps.assertPairable
 *        Fresh block + suspension check. MUST hit the database rather than any
 *        socket cache: `chat.js:12` caches suspension state for 60s, which is
 *        far too stale for "may this person see my camera".
 * @param {ReturnType<import('../utils/signalingRateLimit.js').createSignalingRateLimiter>} [opts.rateLimiter]
 * @param {(msg: string, err?: Error) => void} [opts.logger]
 */
export const createRouletteSignaling = ({
  io,
  settings,
  deps,
  rateLimiter = null,
  logger = (...a) => console.error(...a),
}) => {
  /* ── STATE ────────────────────────────────────────────────────────────────
   * In-memory on purpose. There is no Call model, no Redis adapter, and no
   * sticky-session requirement, which keeps this stage to one deployable unit.
   * The cost is real and must be stated rather than discovered: every call and
   * every queued user is lost on restart or a Render free-tier cold start.
   * That is acceptable for an allow-listed test mode and is NOT acceptable for
   * a pilot — it belongs with the capacity work in Stage 10. */
  const queue = [];
  const sessions = new Map();     // sessionId → session
  const socketIndex = new Map();  // socketId  → { entry } | { sessionId }
  const socketUsers = new Map();  // socketId  → userId (for rate-limit eviction)
  const waitTimers = new Map();   // socketId  → Timeout
  const sessionTimers = new Map();// sessionId → Timeout

  /* Pump serialisation.
   *
   * Pairing needs an `await` for the block/suspension check, and an `await`
   * opens the door for a second `join` to interleave between the "is this pair
   * still claimable" read and the write. Node being single-threaded does not
   * save us — the interleaving happens across microtask boundaries.
   *
   * So pairing claims both entries synchronously (setting `pending`) BEFORE any
   * await, and `pump` is serialised behind `pumping`/`pumpRequested` so two
   * concurrent joins cannot run two pair attempts over the same pair. */
  let pumping = false;
  let pumpRequested = false;

  const clearTimer = (map, key) => {
    const t = map.get(key);
    if (t) {
      clearTimeout(t);
      map.delete(key);
    }
  };

  /** Emit to exactly one socket. Socket.IO gives every socket a room named
   * after its own id, so this addresses one socket without a shared room. */
  const toSocket = (socketId, event, payload) => {
    assertNoIdentity(event, payload);
    io.to(socketId).emit(event, payload);
  };

  const isConnected = (socketId) => {
    const s = io.sockets?.sockets?.get?.(socketId);
    return Boolean(s && s.connected);
  };

  /* ── QUEUE ───────────────────────────────────────────────────────────────── */

  const findInQueue = (socketId) => queue.find((e) => e.socketId === socketId);

  const removeFromQueue = (entry) => {
    const idx = queue.indexOf(entry);
    if (idx !== -1) queue.splice(idx, 1);
    clearTimer(waitTimers, entry.socketId);
    entry.pending = false;
    if (socketIndex.get(entry.socketId)?.entry === entry) socketIndex.delete(entry.socketId);
  };

  /** Tell the user how long they may wait before we stop pretending (§13). */
  const scheduleWaitTimeout = (entry) => {
    const ms = settings.MAX_WAIT_SECONDS * 1000;
    if (!Number.isFinite(ms) || ms <= 0) return;
    const timer = setTimeout(() => {
      waitTimers.delete(entry.socketId);
      if (!findInQueue(entry)) return; // already paired — timer is stale
      removeFromQueue(entry);
      toSocket(entry.socketId, CALL_EVENTS.TERMINATED, {
        reason: 'wait-timeout',
        message: 'Nobody is available right now. Try again in a little while.',
      });
    }, ms);
    if (typeof timer.unref === 'function') timer.unref();
    waitTimers.set(entry.socketId, timer);
  };

  const enqueue = (socket, userId) => {
    const entry = { socketId: socket.id, userId, queuedAt: Date.now(), pending: false };
    queue.push(entry);
    socketIndex.set(socket.id, { entry });
    scheduleWaitTimeout(entry);
    toSocket(socket.id, CALL_EVENTS.SEARCHING, {
      waiting: true,
      position: queue.length,
      maxWaitSeconds: settings.MAX_WAIT_SECONDS,
    });
  };

  /* ── SESSIONS ────────────────────────────────────────────────────────────── */

  /**
   * Tear a session down and tell both sides why.
   *
   * Order matters: the session is deleted from `sessions` BEFORE the emits, so a
   * signal that arrives in the gap is rejected as unknown rather than relayed
   * into a call that no longer exists.
   */
  const closeSession = (sessionId, { reason, message, initiator = null, requeue = null }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    sessions.delete(sessionId);
    clearTimer(sessionTimers, sessionId);

    for (const side of [session.a, session.b]) {
      if (socketIndex.get(side.socketId)?.sessionId === sessionId) {
        socketIndex.delete(side.socketId);
      }
    }

    for (const side of [session.a, session.b]) {
      if (side.socketId === initiator) continue; // they know, they did it
      toSocket(side.socketId, CALL_EVENTS.ENDED, { sessionId, reason, message });
    }

    // The peer of whoever pressed Next does NOT go back in the queue
    // automatically — spec §11.4 gives them an explicit "Find next". Only the
    // person who pressed Next resumes searching.
    if (requeue) {
      const socket = io.sockets?.sockets?.get?.(requeue.socketId);
      if (socket && socket.connected) enqueue(socket, requeue.userId);
    }
  };

  const createSession = (first, second) => {
    const sessionId = randomUUID();
    const session = {
      sessionId,
      a: { socketId: first.socketId, userId: first.userId },
      b: { socketId: second.socketId, userId: second.userId },
      createdAt: Date.now(),
      candidates: 0,
    };
    sessions.set(sessionId, session);

    // The longer-waiting user offers. Fixed by position in the queue, which is
    // what removes glare: exactly one side ever creates an offer, so there is no
    // simultaneous-offer collision to negotiate.
    const caller = session.a;
    const callee = session.b;

    socketIndex.set(caller.socketId, { sessionId });
    socketIndex.set(callee.socketId, { sessionId });

    toSocket(caller.socketId, CALL_EVENTS.MATCHED, { sessionId, role: 'caller' });
    toSocket(callee.socketId, CALL_EVENTS.MATCHED, { sessionId, role: 'callee' });

    /* Handshake watchdog.
     *
     * If the media path never comes up, both sides are left staring at a
     * spinner with no way to know whether it is still working. Stage 3 is
     * STUN-only, so a restrictive network genuinely fails — and it must fail
     * with words rather than silence. `PAIR_TIMEOUT_MS` is used here rather
     * than `CONNECT_TIMEOUT_MS` deliberately: the spec requires the pairing
     * offer to comfortably outlive the connect attempt, otherwise a slow peer
     * pairs and immediately loses the offer. */
    const ms = settings.PAIR_TIMEOUT_MS;
    if (Number.isFinite(ms) && ms > 0) {
      const timer = setTimeout(() => {
        sessionTimers.delete(sessionId);
        if (!sessions.has(sessionId)) return;
        logger(`[roulette] session ${sessionId} never connected — tearing down`);
        closeSession(sessionId, {
          reason: 'connect-failed',
          message: 'Could not connect. This network may be blocking the call.',
        });
      }, ms);
      if (typeof timer.unref === 'function') timer.unref();
      sessionTimers.set(sessionId, timer);
    }

    return session;
  };

  /** Is this socket a participant of this session? The ONLY relay authority. */
  const ownsSession = (socket, sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) return null;
    const owns = session.a.socketId === socket.id || session.b.socketId === socket.id;
    return owns ? session : null;
  };

  const peerOf = (session, socketId) => (
    session.a.socketId === socketId ? session.b : session.a
  );

  /* ── PAIRING PUMP ────────────────────────────────────────────────────────── */

  const pumpOnce = async () => {
    for (;;) {
      if (sessions.size >= settings.MAX_CONCURRENT_CALLS) return;

      const i = queue.findIndex((e) => !e.pending);
      if (i === -1) return;
      const j = queue.findIndex((e, idx) => idx > i && !e.pending);
      if (j === -1) return;

      const first = queue[i];
      const second = queue[j];

      // Claim both synchronously, before any await. Everything below is
      // guaranteed exclusive access to this pair.
      first.pending = true;
      second.pending = true;

      let verdict;
      try {
        verdict = await deps.assertPairable(first.userId, second.userId);
      } catch (err) {
        logger('[roulette] assertPairable threw — refusing the pair', err);
        verdict = { ok: false, reason: 'check-failed' };
      }

      if (!verdict || verdict.ok !== true) {
        const reason = verdict?.reason || 'not-allowed';
        const blame = verdict?.blame === 'a' ? first : second;

        removeFromQueue(first);
        removeFromQueue(second);

        // Only the user responsible is told, and only in general terms. Telling
        // them "you are blocked" confirms the block exists and who caused it.
        const message = reason === 'blocked'
          ? 'You cannot be matched with this person.'
          : 'Could not start a session. Please try again.';

        toSocket(blame.socketId, CALL_EVENTS.TERMINATED, { reason, message });

        // The innocent party keeps waiting rather than being punished for
        // someone else's block.
        const innocent = blame === first ? second : first;
        const innocentSocket = io.sockets?.sockets?.get?.(innocent.socketId);
        if (innocentSocket && innocentSocket.connected) enqueue(innocentSocket, innocent.userId);

        continue;
      }

      // Re-check that nobody's socket died while we awaited the database.
      if (!isConnected(first.socketId) || !isConnected(second.socketId)) {
        removeFromQueue(first);
        removeFromQueue(second);
        continue;
      }

      removeFromQueue(first);
      removeFromQueue(second);
      createSession(first, second);
    }
  };

  const pump = async () => {
    if (pumping) {
      pumpRequested = true;
      return;
    }
    pumping = true;
    try {
      do {
        pumpRequested = false;
        await pumpOnce();
      } while (pumpRequested);
    } finally {
      pumping = false;
    }
  };

  /* ── HANDLERS ────────────────────────────────────────────────────────────── */

  const userIdOf = (socket) => String(socket.user?._id ?? '');

  /** Gate every inbound event on the allow-list and a rate budget. */
  const admit = (socket, cost = 1) => {
    const userId = userIdOf(socket);
    if (!userId || !deps.isAllowed(userId)) return null;

    if (rateLimiter) {
      const { ok, retryAfterMs } = rateLimiter.take(`call:${userId}`, cost);
      if (!ok) {
        toSocket(socket.id, CALL_EVENTS.RATE_LIMITED, {
          reason: 'too-fast',
          retryAfterMs,
        });
        return null;
      }
    }
    return userId;
  };

  /** Shared preamble: validate sessionId, confirm ownership, fetch the peer. */
  const withSession = (payload, socket, fn) => {
    const sessionId = safeSessionId(payload?.sessionId);
    if (!sessionId) return;
    const session = ownsSession(socket, sessionId);
    if (!session) return; // unknown session, or not yours — silently dropped
    fn(session, peerOf(session, socket.id));
  };

  /**
   * Build the handler set for ONE socket.
   *
   * Per-socket rather than engine-level because every handler needs the socket
   * it arrived on. `safeHandler` still wraps each one, which is the guarantee
   * that matters: it is applied at the single point where a listener is
   * registered, so there is no way to add an unwrapped handler later.
   */
  const buildHandlers = (socket) => {
    const handlers = new Map();
    const on = (name, fn) => {
      const wrapped = safeHandler(name, fn, logger);
      handlers.set(name, wrapped);
      return wrapped;
    };

    on(CALL_EVENTS.JOIN, () => {
      const userId = admit(socket);
      if (!userId) return;

      const existing = socketIndex.get(socket.id);
      if (existing?.sessionId && sessions.has(existing.sessionId)) return; // already in a call
      if (existing?.entry) return; // already queued

      if (sessions.size >= settings.MAX_CONCURRENT_CALLS) {
        return toSocket(socket.id, CALL_EVENTS.TERMINATED, {
          reason: 'at-capacity',
          message: 'Roulette is full right now. Try again shortly.',
        });
      }

      if (queue.length >= settings.MAX_QUEUE_SIZE) {
        return toSocket(socket.id, CALL_EVENTS.TERMINATED, {
          reason: 'queue-full',
          message: 'Roulette is very busy right now. Try again shortly.',
        });
      }

      enqueue(socket, userId);
      return pump();
    });

    on(CALL_EVENTS.LEAVE_QUEUE, () => {
      const entry = findInQueue(socket.id);
      if (!entry) return;
      removeFromQueue(entry);
      toSocket(socket.id, CALL_EVENTS.SEARCHING, { waiting: false });
    });

    on(CALL_EVENTS.OFFER, (payload) => {
      if (!admit(socket)) return;
      withSession(payload, socket, (session, peer) => {
        const sdp = safeSdp(payload?.sdp, settings.MAX_SDP_BYTES);
        if (!sdp) return; // malformed offer, dropped — never relayed
        toSocket(peer.socketId, CALL_EVENTS.OFFER, { sessionId: session.sessionId, sdp });
      });
    });

    on(CALL_EVENTS.ANSWER, (payload) => {
      if (!admit(socket)) return;
      withSession(payload, socket, (session, peer) => {
        const sdp = safeSdp(payload?.sdp, settings.MAX_SDP_BYTES);
        if (!sdp) return;
        toSocket(peer.socketId, CALL_EVENTS.ANSWER, { sessionId: session.sessionId, sdp });
      });
    });

    on(CALL_EVENTS.ICE, (payload) => {
      if (!admit(socket)) return;
      withSession(payload, socket, (session, peer) => {
        // Per-session candidate ceiling. The rate limiter bounds the rate; this
        // bounds the total, because a slow trickle under the rate limit still
        // accumulates.
        if (session.candidates >= settings.MAX_CANDIDATES_PER_SESSION) return;
        session.candidates += 1;

        const candidate = safeCandidate(payload?.candidate);
        if (!candidate) return;
        toSocket(peer.socketId, CALL_EVENTS.ICE, { sessionId: session.sessionId, candidate });
      });
    });

    on(CALL_EVENTS.MEDIA_STATE, (payload) => {
      if (!admit(socket)) return;
      withSession(payload, socket, (session, peer) => {
        const state = safeMediaState(payload);
        if (!state) return;
        toSocket(peer.socketId, CALL_EVENTS.PEER_MEDIA, state);
      });
    });

    on(CALL_EVENTS.NEXT, (payload) => {
      if (!admit(socket)) return;
      withSession(payload, socket, (session) => {
        closeSession(session.sessionId, {
          reason: 'peer-next',
          message: 'They moved on.',
          initiator: socket.id,
          // The presser goes back to the queue with a FRESH wait start, so
          // pressing Next repeatedly cannot buy infinite waiting time.
          requeue: { socketId: socket.id, userId: userIdOf(socket) },
        });
        // The presser is waiting again, so the pump must run or they will sit
        // idle until a stranger happens to arrive.
        return pump();
      });
    });

    on(CALL_EVENTS.END, (payload) => {
      if (!admit(socket)) return;
      withSession(payload, socket, (session) => {
        closeSession(session.sessionId, {
          reason: 'peer-left',
          message: 'They left.',
          initiator: socket.id,
        });
      });
    });

    return handlers;
  };

  /* ── DISCONNECT ──────────────────────────────────────────────────────────── */

  /**
   * Tear down whatever this socket was doing.
   *
   * Safe to call more than once for the same socket, and safe to call for a
   * socket that was never in Roulette at all.
   */
  const handleDisconnect = (socketId) => {
    const entry = findInQueue(socketId);
    if (entry) removeFromQueue(entry);

    const indexed = socketIndex.get(socketId);
    if (indexed?.sessionId) {
      closeSession(indexed.sessionId, { reason: 'peer-left', message: 'They left.' });
    }

    clearTimer(waitTimers, socketId);
    socketIndex.delete(socketId);

    const userId = socketUsers.get(socketId);
    if (userId && rateLimiter) rateLimiter.forget(`call:${userId}`);
    socketUsers.delete(socketId);
  };

  /* ── ATTACH ──────────────────────────────────────────────────────────────── */

  const attachSocket = (socket) => {
    const userId = userIdOf(socket);
    if (userId) socketUsers.set(socket.id, userId);

    // Built ONCE per socket and registered explicitly. `safeHandler` is applied
    // inside `buildHandlers`, at the one place a listener is created, so there
    // is no path that registers an unwrapped handler.
    for (const [event, fn] of buildHandlers(socket)) {
      socket.on(event, fn);
    }

    socket.on('disconnect', () => {
      try {
        handleDisconnect(socket.id);
      } catch (err) {
        logger('[roulette] handleDisconnect threw — contained', err);
      }
    });
  };

  return {
    attachSocket,
    handleDisconnect,
    /* Introspection for tests and the boot log. */
    stats: () => ({
      queued: queue.length,
      sessions: sessions.size,
      waitTimers: waitTimers.size,
      sessionTimers: sessionTimers.size,
    }),
    /** Test-only: build a socket's handlers without registering them. */
    buildHandlers,
    /** Test-only: is this user id in the waiting queue? */
    isQueued: (userId) => queue.some((e) => e.userId === userId),
    /** Test-only: does this session exist? */
    hasSession: (sessionId) => sessions.has(sessionId),
  };
};

export default createRouletteSignaling;
