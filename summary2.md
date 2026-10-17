# ROULETTE IMPLEMENTATION PLAN — INSPECTION & DESIGN

```
Generated:            2026-10-16
Audited against:      working tree on main @ 50c0095 (+ uncommitted changes present)
Method:               read-only inspection
                      No code changed. No external services contacted.
                      No accounts created. No paid services incurred.
                      No seed scripts run. No data modified.
Cloudflare docs:      verified 2026-10-16
                      TURN service, Generate Credentials, FAQ, Analytics
Companion document:   summary.md (app-wide engineering audit)
Re-verify before relying on this. Nothing in CI detects documentation staleness.
```

**Confidence legend used throughout:**

| Marker | Meaning |
|---|---|
| **[CONFIRMED]** | Verified by reading the cited code or the cited official doc |
| **[INFERRED]** | Reasoned from code, not runtime-verified |
| **[NOT FOUND]** | Searched exhaustively, absent |
| **[UNKNOWN]** | Cannot be determined without dashboard/DB access |

**Scope note.** This document is design and planning. It contains no code changes.
Every proposal below is **proposed**, not implemented. Any sentence describing current
behaviour is marked `[CONFIRMED]` and cites code.

---

## 1. PLAIN-ENGLISH SUMMARY OF CURRENT MECHANISMS

**What your app does today.** Someone picks a college, types a college email, gets a
6-digit code, sets up a profile, then browses a "Deck" of other students. The Deck is
**global across all participating colleges** — you deliberately removed campus-only
filtering. Profiles are ranked by a formula combining how recently someone was active,
how complete their profile is, whether you share interests, and how far away they are.
You pass or Align. Mutual interest creates an "Alignment" and you can chat in real time.

**How the live connection works.** The app has one real-time channel — Socket.IO. When
you log in, your browser opens a socket. The server checks your login cookie, puts you in
a private room named after your user ID, and remembers you in a list of who's online.
When you open a chat, the server verifies you're one of the two people in that Alignment
before letting your socket join that conversation's room. Typing indicators and messages
travel through those rooms.

**What does not exist.** Roulette is 125 lines of placeholder screen. There is **no**
video code, **no** matching queue, **no** camera access, **no** TURN server, **no** media
provider, **no** post-call matching, and **no** test account flag. Two devices cannot
complete a call.

**One thing to know before reading further:** the Deck's matching logic is *not* a good
model for Roulette, and Part 2 explains why.

---

# PART 1 — UNDERSTANDING THE EXISTING APP

## 1A. Deck discovery — the complete flow

| Stage | What happens | Code |
|---|---|---|
| Frontend request | `GET /api/discover?limit=N`. Client also sends `served` (server ignores it — removed) | `Discover.jsx:213,385` |
| Auth | `protect` middleware verifies the JWT cookie, rejects suspended/deleted, enforces `lastLogoutAt`, slides token expiry | `index.js:378`; `middleware/auth.js:47-120` |
| **Rate limit** | **None on this route.** Only the global `/api/` limiter (1000 req / 5 min / IP) | `discover.js:1523` |
| Per-viewer lock | FIFO promise chain so one user's concurrent deck requests can't race | `discover.js:1448-1468` |
| Session | `DiscoverSession` per viewer, unique index, 24h TTL, live only if `rankingVersion === 'hybrid-v1'` and idle < 30 min | `discover.js:1044-1077` |
| Exclusions | `Interaction` ledger (letter/telegram/accept_letter/archive) + blocks + self. **Exclusion happens in Node memory AFTER ranking**, not in the query | `discover.js:210-238` |
| Eligibility filter | 7 fields, inline | `discover.js:254-276` |
| Ranking | Mongo aggregation: `$lookup` colleges → coords → `_recency`/`_completeness`/`hybridScore`/`_intentMatch`/`_bandIndex` → `finalScore` | `discover.js:654-803` |
| Sort + cap | `$sort finalScore:-1`, `$limit`, `allowDiskUse:true`, then own-college cap | `discover.js:826-842` |
| Cold-start reserve | 10% of window reserved for low-profile-score users, spread evenly | `discover.js:652`, `:85-106` |
| Own-college cap | ≤20% own-campus when within 30km of campus. **Overflow is demoted, never removed** | `discover.js:490,509-516,1016-1018` |
| Response | `{users, total, hasMore, rebuiltWindow, deckExhausted, sessionId, served}` | `discover.js:1358-1393` |
| Impressions | Fire-and-forget `insertMany` | `discover.js:121-158` |
| Pass / Align | Separate POST routes, `discoverLimiter` 100/10min, ladder gate ≥75, 10 aligns/day IST | `discover.js:1785,1787` |

### Your specific questions

**Who is eligible?** Exactly seven conditions (`discover.js:254-276`):

```js
{ isOnboarded: true,
  isVerified: true,
  suspended: { $ne: true },
  shadowbannedAt: null,          // strict null, not $ne
  isDeleted: { $ne: true } }
// plus, conditionally:
gender: { $in: myGenders }     // only if interestedIn set and not 'Everyone'
$or:       [ {interestedIn: {$in:[myGender,'Everyone']}},
             {interestedIn:{$size:0}},
             {interestedIn:{$exists:false}} ]
```

**How does location influence ranking?** Three bands, computed with haversine inside Mongo
(`:528-570`), then multiplied into the score (`:773-797`):

| Band | Distance | Multiplier |
|---|---|---|
| 0 | ≤30 km | **1.0** |
| 1 | ≤100 km | 0.6 |
| 2 | ≤300 km | 0.4 |
| 3 | >300 km | 0.1 |

Anchor is your fresh own location if <30 days old, else your campus coordinates
(`:441-469`).

**Hard restriction or preference?** **Pure preference.** Band 3 (anything over 300km) is
never excluded — it just ranks last. There is **no radius parameter** the client can send.

**Which preferences must match reciprocally?** Gender only, and only when set. A candidate
whose `interestedIn` is empty or absent is treated as **open** (`:273-274`). `intent`
(Dating/Friends/Activity) is **ranking only, never a filter** (`:605-609`).

**How are various states handled?**

| State | Treatment |
|---|---|
| Blocked | Excluded via `getBlockExclusionQuery` (`:235`) |
| Suspended | Excluded (`:257`) |
| Shadowbanned | Excluded — hidden from others (`:259`) |
| Deleted | Excluded (`:260`) |
| Incomplete profile | **Not excluded.** Instead 10% of slots reserved for `profileScore < 45`; incomplete gets 0.5 completeness instead of 1.0 (`:338-350`) |
| Already seen | Tracked by `session.cursor` + `servedIds`, but **re-ranks on window rebuild** (`:1138-1158`) |
| **Online status** | **Completely ignored.** `_recency` uses `lastActive` (a stale DB timestamp), never live presence |

**Does the algorithm scan a large pool?** **Yes — it is the single heaviest thing your
server does.** It runs a 5-stage aggregation over the *entire* eligible population with a
full in-memory `$sort` and `allowDiskUse: true` (`:826-842`). That is why MongoDB M0's
100 ops/sec ceiling is your real scaling wall.

### Reuse verdict for Roulette

**Reusable as-is (already exported):**

| Helper | Location |
|---|---|
| `getBlockExclusionQuery` / `areBlocked` / `getBlockDirection` | `middleware/blockFilter.js:10,30,47` |
| `isFreshLocation`, `sanitizeLatLng`, `haversineKm`, `bandFromIndex`, `DISTANCE_BANDS` | `utils/geo.js` |
| `LADDER` (`{publish:45, interact:75, aspirational:100}`), `computeScore`, `canInteract` | `utils/ladder.js:15,92,138` |
| `toPublicCard`, `CARD_FIELDS` | `utils/publicCard.js:34,14` |
| `isCollegeAllowed`, `collegeGateFilter` | `utils/campusGate.js:74,101` |

**Must NOT be reused — and this is the key design insight:**

| Deck mechanism | Why it fails for Roulette |
|---|---|
| Live presence ignored | **Roulette's partner must be present right now.** Deck can show someone who last logged in Tuesday. Roulette cannot. |
| Interaction ledger exclusions | Deck excludes past letters/archives to avoid repeats. Roulette needs its own *repeat-partner* cooldown, separate from Deck passes. |
| 500-id frozen window + cursor | Deck ranks once, paginates. Roulette needs a queue that changes every second. |
| Recency + completeness scoring | Ranking a *profile* makes sense. Ranking a *waiting person* by how complete their profile is is nonsense. |
| 10-stage Mongo aggregation | Wildly overkill. Roulette needs an in-memory lookup over the waiting set. |
| 30-min session, 24h TTL | A waiting user must be matched in seconds, not days. |
| Own-college 20% cap | You explicitly removed campus-only. Carrying this cap into Roulette would contradict your own decision. |
| Cold-start reserve | Solves "new users get no exposure" in a ranked feed. Irrelevant when pairing is 1:1 in real time. |

**The eligibility filter is the one thing worth extracting.** It is currently inline
(`discover.js:254-276`) and unexported. Extracting it to a shared `utils/eligibility.js`
would let Deck and Roulette apply the *same* definition of "a legitimate verified student"
— which is exactly what you want, so a shadowbanned user can't sneak into Roulette.

---

## 1B. Matching and chat — and what transfers to Roulette

**Match creation:** `POST /api/discover/align/:id` → self-block check → ladder gate →
`Interaction` → `Notification` → reverse-lookup for mutual action → atomic
`Alignment.findOneAndUpdate({pairKey}, upsert)` (`:1686-1703`) → optional
`opening_letter` → socket ping. Race-safe because `pairKey` is uniquely indexed and the
upsert is atomic.

**Message authorization:** every route queries
`Alignment.findOne({ _id: alignmentId, users: req.user._id, isActive: true })`
(`messages.js:52,82,144,265,307`). User A **cannot** read user B's messages. Block
direction is checked separately (`messages.js:152-171`) and never revealed.

**Socket authentication** (`socket/chat.js:29-53`) — reusable for Roulette verbatim:

1. Read cookie `matchalize_jwt` from handshake headers (hand-rolled parser, `:17-25`)
2. Fall back to `handshake.auth.token` / `handshake.query.token` (`:36`)
3. `jwt.verify(token, JWT_SECRET)` (`:42`)
4. `User.findById(decoded.id)` — **no projection**, full document (`:43`)
5. Attach to **`socket.user`**, *not* `socket.data`* (`:47`) — `admin.js:328` depends on
   this exact fact

A second `io.use()` blocks suspended/deleted at connect (`:59-74`). A third check runs
per-event with a **60-second cache** (`:12`, `:93-118`) and force-disconnects.

**Room joining** (`join-alignment`, `:127-149`) — the authorization pattern Roulette
should copy:

```
Alignment.findOne({_id, users: userId, isActive:true})   → error emit if absent (:132)
areBlocked(userId, otherUserId)                          → error emit if blocked (:135)
socket.join(alignmentId)                                  (:143)
io.to(alignmentId).emit('online-update', {...})           (:144)
```

**Presence** — `onlineUsers: Map<userId, Set<socketId>>` at `chat.js:9`. Added `:120-123`,
read `:196`, removed `:231-235`. **Module-private, never exported.** No TTL, no eviction
other than disconnect.

**Disconnect** (`:227-264`): remove socketId → delete user key if set empty → write
`lastActive` if `readyState === 1` (`:239-240`) → if no sockets remain, broadcast offline
to all rooms (`:253-262`).

### Two things that will bite Roulette

**1. There is zero socket rate limiting.** `express-rate-limit` is HTTP middleware mounted
at `app.use('/api/', ...)` (`index.js:374`). Socket.IO listens on `/socket.io/`. **No
limiter touches any socket event.** The only bound is engine.io's 1 MB
`maxHttpBufferSize`. An authenticated user could emit unlimited `join-alignment` or, once
Roulette exists, unlimited offer/answer/ICE. **This must be built.**

**2. The defensive payload pattern is load-bearing.** The comment at `chat.js:151-162`
documents a real incident: `socket.emit('typing')` with no argument → `packet.data` is
`[]` → handler destructures `({alignmentId})` → `TypeError` → `process.nextTick` →
`uncaughtException` → `index.js:568` `process.exit(1)`. **One malformed packet from one
authenticated socket kills your server.**

Every new handler must use:

```js
socket.on('event', (payload) => {
  const x = payload?.x;                  // never destructure in the parameter list
  if (!x || typeof x !== 'string') return;   // silent return, no emit, no throw
  …
});
```

**Reuse verdict:** auth chain ✅, room authorization pattern ✅, presence bookkeeping ✅
(extend it), disconnect ✅, payload guard ✅. **Reuse `io.to(userIdString)` convention**
(11 existing call sites) for server→user pushes. **Reuse `app.set('io', io)`**
(`index.js:248`) as the route→socket bridge.

---

## 1C. Server and deployment

| Property | Value | Evidence |
|---|---|---|
| Runtime | Node 22, Express **4.22.2** | `package.json:25` (resolved 4.22.2) |
| Socket.IO | **Only `cors` is configured.** Everything else default | `index.js:221-245` |
| pingInterval / pingTimeout | 25000 / 20000 ms | engine.io defaults |
| maxHttpBufferSize | 1 MB | engine.io default |
| Transports | `['polling','websocket']` — client doesn't pin | engine.io default |
| connectionStateRecovery | **disabled** → uses plain in-memory `Adapter` | socket.io `index.js:106-115` |
| **Adapter** | **NONE** | confirmed, no redis anywhere |
| `trust proxy` | `1` (one hop) | `index.js:174` |
| Instances | **1** | `render.yaml` has no `numInstances` |
| Plan | **`free`** — 15-min spin-down | `render.yaml:19` |
| DB pool | `maxPoolSize: 20` | `config/db.js:9` |
| Background queue | `MAX_CONCURRENT 20`, `MAX_QUEUE_LENGTH 1000`, 15s task timeout | `utils/queue.js:7,18,22` |
| Locks | `deckLocks` Map only | `discover.js:1448` |
| Rate limit store | **Default in-memory `MemoryStore`** — no Redis | `express-rate-limit` default |

**⚠️ `utils/queue.js` is a background-task runner (push/email), NOT a matching queue.**
Same name, different purpose. Name yours `rouletteQueue.js` or similar.

**What is lost on restart:** `deckLocks`, `onlineUsers`, the config cache, and **every
queued push notification** — `shutdown()` (`index.js:526-554`) does `io.close()` →
`server.close()` → `mongoose.close()` → `exit(0)` with a 10s hard kill. It never drains
the queue.

**What happens during a deploy:** Render SIGTERMs, `io.close()` runs first (so each
socket's `lastActive` write completes), all sockets die, waiting Roulette users lose their
place. Messages in Mongo survive. **Queued users must be told and re-queued.**

### Current system diagram

```
┌──────────────┐   HTTPS (cookie auth)   ┌────────────────────────────┐
│   Browser    │ ──────────────────────► │  Render  singapore         │
│  React SPA   │ ◄────────────────────── │  1 Node process            │
│              │                         │  plan: free (sleeps 15min) │
│  Socket.IO   │ ════ wss ════════════► │                            │
│  client      │                         │  ┌──────────────────────┐  │
└──────────────┘                         │  │ Express 4.22         │  │
                                         │  │  • /api/* (11 routers)│  │
                                         │  │  • global limiter     │  │
                                         │  ├──────────────────────┤  │
                                         │  │ Socket.IO 4.7         │  │
                                         │  │  • chat.js ONLY       │  │
                                         │  │  • in-memory Adapter  │  │
                                         │  │  • no Redis           │  │
                                         │  ├──────────────────────┤  │
                                         │  │ in-memory:            │  │
                                         │  │  deckLocks            │  │
                                         │  │  onlineUsers          │  │
                                         │  │  queue[]              │  │
                                         │  │  configCache          │  │
                                         │  └──────────────────────┘  │
                                         └────┬────────┬────────┬─────┘
                                              │        │        │
                                     ┌────────▼──┐ ┌───▼────┐ ┌─▼──────────┐
                                     │ MongoDB   │ │Cloudin.│ │ Resend     │
                                     │ Atlas     │ │  ary   │ │ (key empty)│
                                     │ pool 20   │ │public  │ └────────────┘
                                     │ ⚠ M0=100  │ │ URLs   │ ┌────────────┐
                                     │  ops/sec  │ └────────┘ │ Web Push   │
                                     └───────────┘           └────────────┘

   ❌ no video code
   ❌ no camera access
   ❌ no TURN
```

**Upgrading compute ≠ adding instances.** Moving `render.yaml:19` from `free` to the
$7/mo `0.5c-512mb` plan keeps **one process** — everything above keeps working. Rendering
`numInstances: 2+` breaks presence, deck locks, message delivery, and every rate limiter.
**Stay single-instance for the pilot.**

---

# PART 2 — HOW VIDEO PARTNERS SHOULD BE SELECTED

## The fundamental distinction

| | Deck | Roulette |
|---|---|---|
| Candidate source | Stored user pool in Mongo | **In-memory set of users who joined the queue seconds ago** |
| Freshness | `lastActive` timestamp, can be days old | **Must be connected right now** |
| Cost | One Mongo aggregation | In-memory array scan |
| Failure mode | Slow response | **Empty queue** |
| Consumable | No — repeatable | **Yes — each user is consumed once per round** |

**Deck asks "who should I see next?" Roulette asks "who is free, willing, and eligible
*at this instant*?"** They share an eligibility definition. They share nothing else.

## Option comparison

| | **A — Random** | **B — Location-first** | **C — Hybrid** |
|---|---|---|---|
| **10 waiting** | Fine. Queue often empty anyway | Bad — near-only shrinks pool to ~1 | Best. Proximity as tiebreaker |
| **100 waiting** | Good spread, weak locality | **Bad.** If everyone is in one city, location filter is a no-op; if spread nationally, distant users starve | Good. Widen bands as wait grows |
| **1,000 waiting** | Works, poor locality | Works | Best locality *and* fairness |
| **Wait fairness** | Poor — no ordering | Worst — distant users never picked | **Good — wait time is a primary term** |
| **Repeat risk** | Moderate | Low | Low, via explicit cooldown |
| **Distant ignored?** | No | **Yes — structurally** | Only after others are served |
| **Empty-queue risk** | Lowest | **Highest** | Medium, mitigatable by widening |
| **Complexity** | Lowest | Medium | Medium |

## RECOMMENDATION: Option C — Hybrid

**In plain words:** apply the rules that must never break, then pick someone who has
waited a while and is reasonably close, adding a small random element so the same people
don't keep meeting.

**Why not random:** at your scale (probably 20–60 concurrent students at IITB first), the
location signal is weak anyway, and pure random produces poor locality once you expand.
It's also the easiest to get *wrong* on fairness.

**Why not location-first:** it's the option that starves distant users. If you later add
campuses outside Mumbai, a Delhi student would never be selected by a Mumbai user until
the Mumbai queue empties — which contradicts your deliberate decision to make the Deck
global.

### HARD RULES — never violated

| Rule | Source |
|---|---|
| `isOnboarded: true`, `isVerified: true` | `discover.js:255-256` |
| `suspended !== true`, `isDeleted !== true` | `:257,260` |
| `shadowbannedAt === null` | `:259` |
| Not you | `:238` |
| No block in **either** direction | `blockFilter.js:10` |
| **Explicitly joined the queue** (never inferred from online status) | new |
| Client-advertised working camera + mic | new |
| Under your concurrent-call limit | new |
| **Not already in a call** | new |

### SOFT PREFERENCES — relaxable under approved policy

| Preference | Weight |
|---|---|
| Longest wait first | primary |
| Proximity band (30 / 100 / 300 / ∞ km) | secondary |
| Randomness within a fairness window | tiebreaker |
| Repeat-partner penalty | modifier |

### The seven proposals you asked for

**1. Fairness for longest wait.** Not strict FIFO — strict FIFO makes one user wait for
everyone else in turn. Instead: score each waiting candidate by `waitSeconds`, take the
**top band** (longest-waiting ~30%), then choose randomly among those using distance and
repeat-penalty. Result: the longest waiters are always in the eligible pool, but nobody is
locked into a fixed order.

**2. Repeat-partner cooldown.** Store recent `(userA, userB)` pairs with timestamps.
Default proposal: **24 hours**, configurable. Rationale: re-meeting someone you skipped 20
minutes ago feels broken. Beyond that it's chance.

**3. Search widening.** On join, compute your search tier:

| Tier | Wait time | Bands searched |
|---|---|---|
| 1 | 0–20s | band0 only (≤30km) |
| 2 | 20–45s | bands 0–1 (≤100km) |
| 3 | 45–90s | bands 0–2 (≤300km) |
| 4 | 90s+ | all eligible |

Log which tier produced each match — that's your fairness and locality data.

**4. "No partner available" — treat this as the primary experience, not an edge case.**
With 50–60 IITB students and low concurrency, **an empty queue will be the normal state.**
Design it first:

- Show real queue position and elapsed time
- If no partner after N seconds, offer: *keep waiting* / *leave*
- Never a spinner with no information
- Do **not** auto-fall-back to the Deck — different mental model

**5. Nearby vs all-campus: needs your explicit choice.** Recommendation: **no filter at
launch.** Everyone searches everyone, proximity only ranks. Matches your global Deck
decision. A toggle is a cheap later addition.

**6. What users see.** Recommendation: **first name or initial + college + region. No
photos, no bio, no prompts.** Two reasons — it prevents screenshot-based doxxing in a way
full profiles don't, and it preserves the Deck as the place where real discovery happens.

**7. What "anonymous" actually means — you must fix this wording.** If the camera is on,
the person can see your face. "Anonymous" is false. Accurate framing: **"We don't show
your profile. They can see your face during the call."** Don't ship the word "anonymous"
anywhere.

**8. Link to profile matching after a call? No.** You've confirmed Roulette is separate.
Two consequences to accept:

- Nobody can discover who they just spoke to, which **reduces incentive to misbehave**
  (good for safety)
- Successful conversations produce **no retention hook** — so measure whether Roulette
  drives people back to the Deck separately

---

# PART 3 — CALL LIFECYCLE

## State diagram

```
                    ┌──────────┐
                    │   IDLE   │
                    └────┬─────┘
                         │ tap Start
                    ┌────▼─────┐   denied      ┌──────────────┐
                    │ PERMISSION│─────────────►│ PERMISSION_ │
                    │  (getUser │              │   DENIED      │
                    │   Media)  │              └──────┬───────┘
                    └────┬─────┘                     │ retry
                         │ ok                        └────┐
                    ┌────▼─────┐                         │
                    │  PREVIEW │◄────────────────────────┘
                    └────┬─────┘
                         │ confirm
                    ┌────▼─────┐   cancel ┌──────────┐
                    │  READY   │────────────►│   IDLE   │
                    └────┬─────┘              └──────────┘
                         │ join queue
                    ┌────▼─────┐   cancel    ┌──────────┐
                    │  QUEUED  │────────────►│   IDLE   │
                    └────┬─────┘              └──────────┘
                         │ paired by server
                    ┌────▼─────┐  partner gone  ┌──────────┐
                    │ PAIRING  │───────────────►│  READY   │
                    └────┬─────┘                └──────────┘
                         │ accept
                    ┌────▼─────┐   timeout/cancel
                    │CONNECTING│────────────────►┌──────────┐
                    └────┬─────┘                 │  READY   │
                         │ ICE connected └──────────┘
                    ┌────▼─────┐
                    │CONNECTED │◄──── ICE restart / network flap
                    └────┬─────┘      (stays in CONNECTED)
                         │ skip / leave / disconnect / max duration
                    ┌────▼─────┐
                    │  ENDED   │──► optional REQUEUE ──► QUEUED
                    └──────────┘
```

## Edge-case handling

| Situation | Design |
|---|---|
| Camera/mic denied | Stay on PERMISSION screen. Show what's blocked and browser-specific instructions. Never enter queue. |
| Camera/mic unavailable (no device) | `navigator.mediaDevices.enumerateDevices()` — no videoinput → block with explanation. |
| User cancels while QUEUED | Remove from waiting set, stop local tracks, back to READY |
| Pairing accepted | Server atomically claims both users. The loser of a race gets `queue:already-paired` and re-queues. |
| Either user leaves during PAIRING | Server deletes the session, re-queues the remaining user with their **original wait start preserved** (no punishment for partner's exit). |
| Connection timeout | Server-side 20s from pair → emit `call:failed`, tear down, re-queue both |
| User skips | End session → **skipper** re-queues; **skipped user** returns to READY (not auto-requeued — avoids ping-pong) |
| Partner skips | Same, roles reversed |
| Browser refresh | Socket disconnect → server ends session, re-queues partner. Client rebuilds from READY. |
| App backgrounded | Mobile OS may throttle timers. Server heartbeat is authoritative; client must not rely on `setTimeout` for correctness. |
| Network loss | ICE restart (`RTCPeerConnection.restartIce()`). If ICE fails to recover within N seconds → ENDED. Cloudflare explicitly recommends ICE restart for maintenance resilience. |
| Temporary reconnection | Grace period ~10s, then re-queue if still eligible. |
| Tab closed | Socket disconnect → same as refresh |
| Server restart/deploy | All sessions die. On boot, clear state. Clients show "reconnecting", then re-queue. |
| **Multiple tabs, one account** | **Must handle.** Decide: first tab owns the queue entry; a second tab joining while already in a call gets `queue:already-in-call`. Track by userId, not socketId. |
| Block/ban applied while queued or in call | In-call: emit `call:terminated {reason:'moderation'}`, disconnect. Queued: remove from set. Both check the 60s suspension cache (`chat.js:93-118`) — **but that cache means up to 60s delay.** For Roulette, do a fresh check on pair. |
| Simultaneous skips | Session state machine is server-owned; second skip finds no active session → no-op |
| Late messages from previous call | Every signal carries `sessionId`; handler drops any whose `sessionId` ≠ current |
| **User assigned to two calls** | **Must be impossible.** `pairedUserId` set atomically inside the waiting entry; a second match attempt on a claimed entry fails. |

## Identifiers, authorization, atomicity

**Call/session ID:** server-generated UUID per pairing. **Never client-generated.** Every
socket event carries it; the server verifies `sessionId` exists, both users match, and the
caller is a participant before acting.

**Room:** `call:<sessionId>`. Membership granted **only** by the server on successful
pairing — never accepted from the client. Same pattern as `join-alignment`
(`chat.js:131-143`).

**Atomic pairing:** the waiting entry gains `pairedSessionId` via a compare-and-set
(delete-if-still-matching, or set-only-if-unset in a single write). Both users must
succeed; if either fails, both roll back. In-memory is sufficient — see Part 7.

**Heartbeats:** Socket.IO's built-in ping (25s/20s, `index.js:221-245` defaults) detects
dead sockets. Add a periodic server sweep to reap sessions where a socket is gone.

**Idempotency:** repeat `queue:join` from the same user = no-op success. Repeat
`call:skip` after end = no-op. Guard with a `(userId, sessionId, action)` seen-set or
check session state before acting.

**Resource release:** remove from waiting set → clear `pairedSessionId` → leave
`call:<sessionId>` room → delete session object → **client stops all media tracks** via
`track.stop()` on every `getUserMedia` track, including on unmount and on `pagehide`.

## Server vs browser responsibility

| Server controls | Browser controls |
|---|---|
| Who is in the queue | Camera/mic permission + local preview |
| Who is paired with whom | Establishing `RTCPeerConnection` and negotiating ICE |
| Session existence and lifetime | Actual media encode/decode |
| Room membership authorization | Whether to Accept / Skip / Leave |
| Timeout enforcement | Stopping local tracks promptly |
| All eligibility, block, ban checks | Reporting (server validates) |
| Metrics recording | Sending connection stats to server |

---

# PART 4 — VIDEO ARCHITECTURE

## Minimum architecture for 1:1

**No media server (SFU) is needed.** Cloudflare's own documentation is explicit:

> "If your use case is one-to-one communication… TURN by itself is usually sufficient.
> Adding an SFU is unnecessary complexity for that topology." — *Cloudflare Realtime TURN
> FAQ, docs updated 2026-07-14*

**An SFU is for one-to-many or selective forwarding.** You have exactly two people. Adding
one would mean every byte of video traverses a server you pay to operate, plus you could
then decrypt it — which is a moderation *capability* you'd be buying, not just
infrastructure. Don't buy it now.

## The three layers

**STUN** — helps two browsers discover each other's public addresses. Free and unlimited
at Cloudflare (`stun.cloudflare.com:3478`, verified 2026-10-16). Most student connections
succeed STUN-only.

**TURN** — relays when STUN fails (strict NATs, symmetric NATs, corporate/campus
firewalls). Costs money.

**Signaling** — the small conversation where browsers swap connection details. **Your
existing Socket.IO is the right vehicle.** It's already authenticated with the same cookie,
already has room authorization patterns, and carries ~KB/s.

## Why a relay does NOT give you moderation

Cloudflare, verbatim:

> "When Cloudflare Realtime TURN is used in conjunction with WebRTC, Cloudflare cannot
> access the contents of the media being relayed. This is because WebRTC employs Datagram
> Transport Layer Security (DTLS) encryption for all media streams, which encrypts the
> data end-to-end between the communicating peers before it reaches the TURN server." —
> *Cloudflare Realtime TURN FAQ, docs updated 2026-07-14*

**WebRTC media is DTLS-encrypted end to end.** Neither Cloudflare nor your server can read
it. So:

- ✅ Relay = connectivity for restrictive networks
- ❌ Relay ≠ ability to see, review, or moderate content

If you ever *want* server-side visibility, that requires replacing peer-to-peer with an
SFU — a deliberate, separate decision with real cost and privacy consequences.

## Cloudflare TURN — verified integration

**Service addresses** (verified 2026-10-16):

| Protocol | Address | Ports |
|---|---|---|
| STUN/UDP | `stun.cloudflare.com` | 3478 |
| TURN/UDP | `turn.cloudflare.com` | 3478, 443 |
| TURN/TCP | `turn.cloudflare.com` | 3478, 80 |
| TURN/TLS | `turn.cloudflare.com` | 5349, 443 |

Anycast routing means users auto-connect to the nearest Cloudflare location. **Campus
firewall allowlist, if ever needed:** `141.101.90.1/32`, `162.159.207.1/32`,
`2a06:98c1:3200::1/128`, `2606:4700:48::1/128`.

### Credential generation — server-side only

You create a **TURN Key** (long-term secret) in the Cloudflare dashboard. Your server
exchanges it for short-lived credentials:

```
POST https://rtc.live.cloudflare.com/v1/turn/keys/{TURN_KEY_ID}/credentials/generate-ice-servers
Authorization: Bearer {TURN_KEY_API_TOKEN}
Content-Type: application/json

{"ttl": 86400}
```

Returns **201** with a ready-to-use `iceServers` array. Your server passes that straight to
the browser.

**Security requirements:**

- `TURN_KEY_ID` and `TURN_KEY_API_TOKEN` are **server-side env vars only** — never in
  `VITE_*`, never in a client bundle
- Endpoint must be behind `protect` (your existing auth middleware)
- Endpoint must have its own rate limiter (e.g. 10/hour/user) — **this is credential-farming
  defence**
- Response should be cached briefly per user to avoid hammering the Cloudflare API
- Revocation available: `POST …/credentials/{USERNAME}/revoke` → 204

### Constraints that affect design

| Constraint | Impact |
|---|---|
| **Max TTL 48 hours** | Credential expires → Cloudflare **stops billing immediately, then disconnects after a delay**. Long sessions need `setConfiguration()` refresh. |
| Credential issuance rate | "No defined limit. Start at 500/sec." Ensure **>50% of issued credentials are used**, or you may be throttled. |
| **Custom identifiers** | Tag each TURN username with your userId → per-user usage accounting and abuse detection via the analytics API. **Strongly recommended.** |
| **IPv6: relay addresses are IPv4-only** | TURN works client↔server over IPv6, but **no IPv6 relay address is issued**. An IPv6-only peer can only achieve **one-sided** relay. Expect this on some mobile networks. |
| No RFC6062 TCP relay | Relay is UDP-only. A browser that blocks UDP entirely cannot connect via TURN. Rare but possible. |
| Per-allocation limits | >5 new IPs/sec (anti-port-scan), >5–10 kpps, >50–100 Mbps — **per call, not account-wide**. Concurrency multiplies total, but no single call can abuse. |
| ICE restart | Explicitly recommended for maintenance resilience. |
| Billing | **Egress only** (edge→client). Ingress free. $0.05/GB. **First 1,000 GB/month free.** |

### Managed TURN vs self-hosted coturn

| | Cloudflare managed | Self-hosted coturn |
|---|---|---|
| Setup | Zero infrastructure | Provision VPS, ports, TLS, firewall |
| Credential model | Short-lived, server-minted | Static or REST |
| Edge latency | Anycast, ~300+ cities | Single region |
| Ops burden | None | Yours — patches, abuse, monitoring |
| Cost | $0.05/GB after 1TB free | VPS + bandwidth, region-dependent |
| Best when | You don't want to run infrastructure | You need flat predictable cost at large scale |

**Recommendation: Cloudflare managed TURN for the pilot.** You have one founder, free-tier
infrastructure, and zero measurement history. Self-hosting adds an ops burden before you
know your relay rate or call volume. Revisit at ~5M relayed minutes/month.

## Architecture diagram

```
SIGNALING (small, your existing server)
──────────────────────────────────────────────
  User A  ═══wss═══►  Socket.IO server  ═══wss═══►  User B
   (browser)      (auth, queue, pairing,      (browser)
                    session state, STUN/TURN
                    credentials, metrics)

MEDIA — two possible paths (tries in order)
──────────────────────────────────────────────
① PREFERRED — direct peer-to-peer (FREE)
     User A  ◄═══DTLS-encrypted media═══►  User B
     ↕ STUN only, to discover addresses

② FALLBACK — relayed (metered, $0.05/GB after 1TB)
     User A ◄══► Cloudflare edge ◄══► User B
              (encrypted inside; Cloudflare
               cannot see the content)

  ⚠️ Media NEVER passes through your Node server
    in either path.
```

---

# PART 5 — VIDEO AND AUDIO QUALITY

## Resolution does not fix bitrate

They are separate decisions. `getUserMedia` constraints set resolution/frame rate; **bitrate
is set by `RTCRtpSender.setParameters().maxBitrate`** or left to the browser's congestion
controller. A 720p stream with a 2 Mbps cap looks different from a 720p stream with no
cap. Set both.

## Proposed starting settings

| Setting | Ideal | Maximum cap | Notes |
|---|---|---|---|
| Video | **480p** (640×480) | **720p** (1280×720) | 480p ideal avoids upscaling |
| Frame rate | 24 fps | 30 fps | 24 is plenty for faces; halves cost vs 30 |
| Video bitrate | — | **800 kbps** at 480p, **1.2 Mbps** at 720p | Set via `maxBitrate` |
| Audio | Opus, mono | Opus, mono, **32 kbps** | Mono is right for speech; stereo is wasted |
| Audio codec | — | `opus` + 32kbps + `useinbandfec` | In-band FEC improves robustness on lossy links |

## Adaptive behaviour

Use `RTCRtpSender.setParameters()` reacting to `getStats()`:

| Condition | Action |
|---|---|
| `packetsLost` rising or `availableOutgoingBitrate` < 200 kbps | Drop to 360p |
| Sustained loss > 5% | Drop to audio-only |
| `nominated` pair becomes `relay` (was host) | Prefer lowering resolution over dropping |
| Recovered bandwidth | Step back up, with hysteresis to avoid oscillation |

**Audio-only fallback is a feature, not a failure.** A working audio conversation at poor
video beats a frozen video tile. Show a clear "video paused to save bandwidth" notice.

## Low bandwidth

Below ~150 kbps usable, expect video to fail entirely. Audio-only at 32 kbps survives almost
everywhere.

## Compatibility

| Platform | Expectation |
|---|---|
| Chrome/Edge desktop | Reference. Full support. |
| Safari / iOS Safari | Works. `playsinline` required on video element. Autoplay policies — always start playback from the Accept button gesture. |
| Firefox desktop | Works. |
| **iOS Safari backgrounded** | **Call drops.** No fix. Communicate expectations. |
| **iOS low-power mode** | May disable WebRTC entirely on some versions. Must handle gracefully. |
| Older Android WebView | Test before launch. |

## Cost per call — hypothetical

**Assumptions, stated explicitly:**

- Bitrate **combined 900 kbps** (≈700 video + 32 audio + overhead) for 480p/24fps
- **Two people talking 15 minutes = 15 call-minutes = 30 participant-minutes.** Do not
  double-count. (Cloudflare bills per client, so egress *is* doubled — but the call itself
  is 15 minutes, not 30.)
- Cloudflare bills **egress only**, includes TURN overhead, after successful auth
- ₹85/USD (my assumption, not verified)

**Formula:** GB per relayed call-minute = `bitrate_Mbps × 0.9 ÷ 60` = `0.9 × 0.9 ÷ 60` ≈
**0.0135 GB/min**

| Route | 15-min call | 1-hour call | Cost @ $0.05/GB |
|---|---|---|---|
| **Direct (P2P)** | **₹0** | **₹0** | Free — media never touches a paid service |
| **One-sided TURN** | ~0.20 GB | ~0.81 GB | **₹9 / ₹36** |
| **Two-sided TURN** | ~0.41 GB | ~1.62 GB | **₹17 / ₹72** |

**If every call were two-sided TURN**, the 1,000 GB free tier covers roughly **4,100
one-hour calls/month**. A realistic 20% relay rate would cover roughly **20,000**.

**No call has ever been made. These are not measured numbers.** They are arithmetic on
stated assumptions.

---

# PART 6 — SAFETY AND PRIVACY BUILT INTO ROULETTE

## Minimum launch controls

| Control | Implementation | Exists today? |
|---|---|---|
| Genuine college email verification | `resolveCollege` → `emailMatchesCollege` → real OTP | ✅ Yes (`auth.js:71-75`) |
| Age policy | Server hard block 18–40 from DOB | ✅ Yes (`users.js:308-315`) |
| Enforce bans/suspensions | Fresh check on pair (don't rely on 60s cache) | ⚠️ Partial |
| Enforce blocks | `areBlocked` / `getBlockExclusionQuery` | ✅ Reusable |
| **In-call report** | Report button visible during call → `POST /api/report/:userId` | ❌ New UI |
| **Immediate disconnect** | On report, end session + block + remove from queue | ❌ New |
| **Block + never rematch** | Write `Block` + own cooldown store | ⚠️ Block exists, cooldown new |
| Report-review workflow | Admin queue | ✅ Exists (`admin.js:65-188`) |
| Rate limits | **Socket-level** (none today) | ❌ New |
| Concurrent-session limit | Config, enforced server-side | ❌ New |
| Appeals | Currently a `mailto:` | ❌ Improve |

### Testing accounts must not bypass production verification

**Finding: there is no test-account flag.** Grep for `isSeed|isDemo|isTest|isBot` across
`server/` returns **zero matches** (`chat.js`/`User.js` have nothing). The QA harness
bypasses signup entirely with `User.insertMany` and hardcodes `isVerified: true`
(`seedSociety.mjs:41`, `personas.mjs:137-138`).

**The only isolation today is the database name.** `TEST_DB_NAME = 'matchalize_test'` with
a hard assertion that refuses any other name (`tests/lib/mongo.mjs:5,29-37`). That is
genuinely strong — it cannot be bypassed by an env var typo.

**Design decision: keep DB-name isolation as the only test mechanism.** Do **not** add a
schema flag like `isTest`. A field would travel to production, could be set by a bug, and
would weaken exactly the eligibility guarantee Roulette depends on. The QA harness already
points at a separate database.

**⚠️ Blocking issue: the QA OTP login is broken.** `readLatestOtp` reads `doc.otp`
(`browser.mjs:31-33`) but the OTP model **only stores `otpHash`** (`models/OTP.js:14-17`) —
there is no `otp` field. The value is `undefined`. So the existing Playwright harness
cannot currently complete a login. Fix before building any Roulette test on top of it.

## Moderation options — four separate things

| Option | Data leaving device | Who can access | Limits | Privacy impact | Extra cost |
|---|---|---|---|---|---|
| **1. Reporting + enforcement** | Report reason text, optionally a user-typed description | You + admin | Only works if someone reports. **Screenshots cannot be prevented** — a user can always photograph their screen. | Low | ₹0 |
| **2. On-device automated checks** (e.g. a JS NSFW classifier) | Video frames analysed **in the browser**, verdict sent to server | You'd see verdicts, not content | Bypassable — edited client, virtual camera, model stripped. **Not a safety system.** | Low — raw frames never leave device | ₹0 or small |
| **3. Report-triggered evidence submission** | Images/files the reporter chooses to attach | You + admin | Entirely voluntary. Reporter may not have evidence. | Medium — must store securely, set retention | Storage |
| **4. Server-side content processing** | **Everything, always** | You and/or a vendor | Requires abandoning peer-to-peer for an SFU. Major architectural change. | **High.** Continuous surveillance. | Significant infra |

**Recommendation: ship 1 only.** Add 2 later if pilots demand it. Do not build 4 — it
requires replacing P2P with an SFU and changes the privacy promise fundamentally.

**No recording. No sampled-frame uploads. No face recognition. No identity reveal.** These
require explicit approval and none is proposed.

## Automatic-ban policy — do not do this

Your current escalation is: **3 reports → shadowban, 5 → suspension** (`report.js:65-82`).
**This is unsafe for a video product.** An unreviewed report count can be weaponised — a
group coordinating reports bans a user with no human ever reviewing. Worse, the QA harness
**deliberately seeds one persona with `shadowbannedAt` and `contentFrozen: true`**
(`seedSociety.mjs:169-172`) — so automated shadowbans already appear in test data.

**Recommendation for Roulette:** report → immediate **temporary disconnect** + **rematch
block** (you can't call them again) + report enters admin queue. **Suspension only after
human review.** This changes existing behaviour, so it's your call.

## Legal — where advice is needed

Flagged, **not answered**:

1. Whether this qualifies as an "intermediary" under the IT Act / IT Rules, and what
   preservation duties follow
2. Age assurance expectations where minors may reach a video product
3. Whether reporting a sexual-content category creates specific retention obligations
4. DPDP consent — is a college email + self-reported DOB sufficient notice for a video
   feature?
5. Whether a video feature requires different Terms than the current dating-oriented copy

**No compliance claim is made. Code inspection cannot establish it.**

---

# PART 7 — CAPACITY AND COST CONTROLS

## Why 100 video calls don't send 100 videos through Node

Your Node server carries **only signaling**: offer, answer, ICE candidates, queue state. At
~10 KB per signaling round trip, 100 concurrent calls is roughly **1 MB of data**. Video
travels peer-to-peer or through Cloudflare, never through your process.

| Layer | Load at 100 concurrent calls | Bottleneck |
|---|---|---|
| **A. Signaling/backend** | ~100 sockets, ~1 MB total | None. A 512 MB instance handles this easily. |
| **B. Queue/presence** | In-memory Map, ~200 entries | None. |
| **C. Database** | 2 reads per pair + ~1 write per session | Well within pool of 20. |
| **D. Media** | 0 bytes through Node. 100 × ~0.9 Mbps ≈ 90 Mbps **elsewhere**. | **Cloudflare bill, not your server.** |
| **E. Moderation** | Human, reports-based | **This is what actually costs you time.** |

**Your Node server is not the constraint. Media cost and moderation time are.**

## Test levels — goals, not capacity claims

| Level | How | Consumes paid bandwidth? |
|---|---|---|
| **1. Two devices, one call** | Two laptops, campus Wi-Fi, then one on mobile hotspot | Minimal (~0.4 GB worst case) |
| **2. Ten simultaneous calls** | 20 browser profiles across 2 machines, or synthetic signaling load | Yes, ~4 GB |
| **3. Fifty simultaneous** | Same technique, more machines | Yes, ~20 GB — **inside free tier** |
| **4. One hundred simultaneous** | Same technique | ~40 GB — **inside free tier** |

**Safe testing method:** measure the relay rate first. If direct P2P succeeds ~80% of the
time, even 100 test calls cost ~8 GB. Run levels 3–4 only after level 1 confirms real
connectivity.

**What can be synthetic:** signaling throughput, queue pairing throughput, DB queries per
pair — all testable without any media.

**What needs real browsers:** actual ICE negotiation, TURN fallback, camera permissions,
mobile network behaviour. **Playwright can drive `getUserMedia` with
`--use-fake-device-for-media-stream`** for CI-level smoke tests.

**Metrics to collect:** CPU %, RSS, socket count, event-loop lag, queue length, pair
latency, DB query duration, `/health` response time.

## Single-instance pilot — recommended

**One process is sufficient.** Don't add Redis. Rationale: `deckLocks`, `onlineUsers`, and
a new roulette queue all live in one process; no load balancer exists; Render `free` is
single-instance anyway. Adding Redis now would be infrastructure for appearance.

**Redis becomes necessary when:** you run **2+ instances**, at which point presence, room
broadcasts, rate limits, and pairing all break simultaneously. Fix them together then.

## Controls to build

| Control | Design |
|---|---|
| **Max concurrent calls** | `ROULETTE_MAX_CONCURRENT_CALLS`, default e.g. 25 |
| **Admission control** | When at capacity, refuse **new** sessions with a clear "busy, try shortly" — never queue people who cannot be served |
| **Max session duration** | Hard cap (e.g. 10 min) enforced server-side. **Requires founder approval.** |
| **Max sessions per user per day** | Anti-abuse. **Requires founder approval.** |
| **Spend visibility** | Log billable GB estimate per session; expose in admin |
| **Cloudflare alerts** | Billing alerts in the Cloudflare dashboard |
| **Emergency disable** | `ROULETTE_ENABLED=false` env → nav tab hidden, queue refused, existing calls ended |
| **Credential farming defence** | Rate-limit the credential endpoint per user (e.g. 10/hour); use Cloudflare custom identifiers to tag and audit |

### Two honest limits on cost control

**1. A billing alert is not a spending cap.** It tells you after the fact. Real protection
is the concurrency cap + duration cap + admission control — those prevent the usage rather
than reporting it.

**2. Stopping new calls does NOT stop cost on existing calls.** If 25 calls are live,
disabling Roulette ends them, but:

- Media already flowing continues until both sides stop
- If you only stop *new pairings* and let calls run, **those calls keep consuming TURN
  egress for their full duration**
- Cloudflare credentials stay valid until TTL expiry (max 48h) — revoking via the API stops
  billing *immediately* (`…/revoke` → 204), but the call dies

**Therefore:** the kill switch should (a) refuse new pairings, (b) send `call:terminated`
to live sessions, and (c) optionally revoke outstanding credentials.

---

# PART 8 — MEASUREMENT

## What to measure and where it comes from

| Metric | Source | Notes |
|---|---|---|
| Search attempts | Backend | Join events |
| **Waiting time** | Backend | `pairedAt − joinedAt`. Most important product metric. |
| Successful pairings | Backend | |
| Connection success/failure | **Browser** + backend | Browser knows ICE outcome |
| Connected duration | Backend (authoritative) | Server timestamps, not client |
| Participant-minutes | Derived | `2 × call-minutes` |
| **Two-person call-hours** | Derived | `call-minutes ÷ 60`. **Do not confuse with participant-hours.** |
| Peak concurrent | Backend | Instantaneous gauge |
| **Direct / one-sided TURN / two-sided TURN** | **Browser** | From `getStats()` selected candidate pair |
| Route changes during call | Browser | ICE restart can change route |
| Bytes sent/received | **Browser** | `RTCStatsReport` |
| **Provider billable egress** | **Cloudflare GraphQL** | Ground truth for billing |
| Skips, repeat matches | Backend | |
| Reports, review time | Backend + admin | |

## Identifying route from the selected candidate pair

```js
const stats = await pc.getStats();
let pair;
stats.forEach(s => { if (s.type === 'transport' && s.selectedCandidatePairId) pair = s.selectedCandidatePairId; });
let cand;
stats.forEach(s => { if (s.type === 'candidate-pair' && s.id === pair) cand = s; });
let local, remote;
stats.forEach(s => {
  if (s.type === 'local-candidate'  && s.id === cand.localCandidateId)  local  = s;
  if (s.type === 'remote-candidate' && s.id === cand.remoteCandidateId) remote = s;
});
// local.candidateType / remote.candidateType: 'host' | 'srflx' | 'prflx' | 'relay'
```

| local | remote | Route |
|---|---|---|
| host/srflx/prflx | host/srflx/prflx | **direct** |
| relay | host/srflx/prflx | **one-sided TURN** |
| relay | relay | **two-sided TURN** |

**Relay on one side only is common and often fine** — Cloudflare notes packet-loss
characteristics are more predictable when both relay via backbone, but latency difference is
geography-dependent.

## The duplicate-counting problem

**Browser byte counters and Cloudflare's invoice will not match.** Reasons:

1. Browser `bytesSent`/`bytesReceived` counts **DTLS payload**; Cloudflare counts **TURN
   protocol overhead + all packets after auth**
2. Only **egress** is billed — a client that sends more than it receives costs less than the
   sum
3. **Relayed calls only count.** A direct call has real browser bytes but **zero** Cloudflare
   egress
4. IPv6 relay limitation means some sessions are one-sided in ways the browser may not
   distinguish cleanly

**So: never sum browser bytes and provider bytes.** Report them side by side:

| Field | Purpose |
|---|---|
| `browserBytesSent/Received` | Client-side quality signal |
| `cloudflareEgressBytes` (from analytics) | **Billing reconciliation — the only number to trust for cost** |

Cloudflare exposes this via GraphQL only (`callsTurnUsageAdaptiveGroups`, metrics
`egressBytes` / `ingressBytes` / `concurrentConnections`, dimensions including
`customIdentifier`). Needs an API token with "Account Analytics" permission. **This is a
scheduled job, not a per-request call.**

## Telemetry hygiene — what must never be logged

❌ **Never log:**
- Raw SDP (contains fingerprints and candidates)
- Individual ICE candidates (contain IPs)
- Any TURN username/credential
- IP addresses
- Media content of any kind
- Full message bodies

✅ **Safe to log:**
- `sessionId`
- Timestamps
- Route classification (direct / one-sided / two-sided)
- Bitrates
- Durations
- Failure reason
- Coarse region
- Byte counts

---

# PART 9 — IMPLEMENTATION PLAN

## Stage 1 — Fix prerequisites and lock decisions

**Files:** none (decisions) · **Reuse:** —

- Founder decisions from Part 2 recorded
- **Prerequisite fix: QA OTP login** (`browser.mjs:31-33` reads nonexistent `doc.otp`)
- **Prerequisite fix: extract eligibility filter** from `discover.js:254-276` into
  `utils/eligibility.js`, used by both Deck and Roulette

**Acceptance:** Deck response byte-identical before/after extraction; QA harness logs in
**Rollback:** revert one file

## Stage 2 — Local preview and permissions

**Files:** `client/src/pages/Roulette.jsx`, new `client/src/utils/webrtc.js`
**Reuse:** existing styling, haptics, toast
**Add:** `getUserMedia` with ideal 480p/24fps; enumerateDevices; permission-denied UI;
local preview; `track.stop()` on unmount + `pagehide`

**Acceptance:** preview renders; denying permission shows clear guidance; no camera indicator
after leaving
**Rollback:** placeholder stays behind a flag

## Stage 3 — Authorized two-device calling, manual pairing

**Files:** new `server/socket/roulette.js`, mount in `index.js`
**Reuse:** auth chain (`chat.js:29-74`), payload guard (`:151-162`), `io.to(userId)`
convention
**Add:** `rtc:offer` / `rtc:answer` / `rtc:ice` events; `call:<id>` rooms; server-issued
sessionId; STUN only

**Acceptance:** two browsers connect via direct path; `getStats()` shows `host`/`srflx`;
neither can join another's room
**Rollback:** env flag off

## Stage 4 — TURN fallback and route measurement

**Files:** `server/routes/roulette.js`, `server/utils/cloudflareTurn.js`
**Add:** `POST /api/roulette/ice-servers` behind `protect` + rate limiter;
`TURN_KEY_ID`/`TURN_KEY_API_TOKEN` env; custom identifier = userId; client refresh via
`setConfiguration()`

**Acceptance:** direct succeeds on campus Wi-Fi; forcing a restrictive network falls back
to TURN; route classification correct; credential endpoint rejects unauthenticated +
over-limit
**Rollback:** return STUN-only from the endpoint

**⚠️ Requires creating a Cloudflare account and TURN Key — needs your permission and will
incur charges above 1TB**

## Stage 5 — Queue and automatic matching

**Files:** `server/socket/rouletteQueue.js`, `client/src/utils/rouletteQueue.js`
**Reuse:** `getBlockExclusionQuery`, `areBlocked`, `haversineKm`, `DISTANCE_BANDS`,
`sanitizeLatLng`, `isFreshLocation`
**Add:** waiting set; atomic claim; Option C selection; widening tiers; empty-queue UX

**Acceptance:** two queued users pair automatically; a blocked pair never pairs; logged wait
time matches
**Rollback:** disable queue, manual pairing

## Stage 6 — Skip, reconnect, cleanup

**Add:** skip/cancel/timeout handlers; heartbeat reaper; track teardown; `sessionId`
validation drops late messages
**Acceptance:** skip returns both to READY; refresh re-queues partner; no orphaned sessions
after 5 min idle

## Stage 7 — Reporting, blocking, restrictions

**Add:** in-call report button; immediate disconnect + rematch block; fresh ban check on
pair; repeat cooldown store

**Acceptance:** report ends call instantly; reported user never re-paired; suspension blocks
queue entry within one pair attempt
**Rollback:** disable report UI

## Stage 8 — Capacity controls and cost visibility

**Add:** `ROULETTE_MAX_CONCURRENT_CALLS`, duration cap, per-user daily cap,
`ROULETTE_ENABLED` kill switch, per-session GB estimate, admin metrics endpoint
**Acceptance:** at cap, new joins get a clear refusal; kill switch ends live calls and
refuses new ones

## Stage 9 — Cross-device and network tests

Real iOS Safari, Android Chrome, campus Wi-Fi, 4G, home broadband, VPN, corporate firewall.
Measures the **real relay rate**.

## Stage 10 — Limited private pilot

10–25 IITB students. Watch: waiting time, relay %, reports, cost, crashes. Gate further
rollout on these.

### Must not regress

Profile discovery (`discover.js`), matching (`align`/`pairKey` upsert), messaging
(`messages.js` auth), login (`auth.js`), reporting (`report.js`), blocking
(`blockFilter.js`).

### Existing behaviour to flag before changing

- **3/5-report auto-shadowban/suspend** (`report.js:65-82`) — Part 6 recommends changing
  this for Roulette
- `socket.js:24` `force-disconnect` only honours reasons matching `/suspend/i` — add a
  reason for moderation-triggered call termination
- `Roulette.jsx:94` copy still says "Matches" and "a seed of interest" — implies post-call
  matching that won't exist

---

## FOUNDER DECISIONS — with suggested defaults

| # | Decision | Suggested default |
|---|---|---|
| 1 | Nearby-only, or global? | **Global**, proximity ranks only |
| 2 | Do you see full profiles or pseudonyms? | **First name + college + region.** No photos |
| 3 | Post-call profile matching? | **No** |
| 4 | Repeat-partner cooldown | **24 hours** |
| 5 | Max session duration | **10 minutes** |
| 6 | Sessions per user per day | **20** |
| 7 | Repeat skip → rematch immediately? | **No** — they return to READY |
| 8 | Report → automatic ban, or human review? | **Human review** for suspension |
| 9 | On-device NSFW detection at launch? | **No** |
| 10 | Cloudflare TURN account — create now? | **After Stage 4 is otherwise ready** |
| 11 | Render upgrade to always-on? | **Yes, $7/mo** — free tier sleeps and kills calls |
| 12 | Max concurrent calls (pilot) | **25** |
| 13 | Does Roulette reuse Deck gender preferences? | **No.** Different purpose |
| 14 | Does Roulette require a completed profile? | **Recommend yes** — one photo minimum |

---

## RISKS AND UNKNOWNS

| Risk | Severity | Mitigation |
|---|---|---|
| **Render free tier sleeps mid-call** | **High** | $7/mo upgrade before any real use |
| **No socket rate limiting exists** | **High** | Build in Stage 5–6 |
| **IPv6 peers can only one-sided relay** | Medium | Expected; not fixable |
| **48h credential expiry kills long sessions** | Medium | `setConfiguration()` refresh |
| **Relay rate unknown** | Medium | Measure in Stage 9 before cost planning |
| QA harness login broken | Medium | Stage 1 |
| `onlineUsers` not exported, in-memory only | Low | Extend it; single instance is fine |
| Socket auth uses **full user doc, no projection** (`:43`) — heavier than needed, and diverges from `protect`'s projection | Low | Reuse pattern but use `.select()` |
| Auto-ban on report count is abusable | Medium | Stage 7 change |
| Legal exposure for video with minors-possible access | **Unknown** | Counsel before pilot |
| iOS backgrounding drops calls | Low | Communicate; ICE restart |

---

Planning complete. No code changed. Please approve or revise these decisions before
implementation.