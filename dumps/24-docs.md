# Chunk 24 — Docs

> Matchalize · `docs` · files 24 of 25 chunks · 4 file(s) · 63 KB · ~18,308 tokens
> Generated 2026-10-09 14:03.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./HANDOFF.md`
> - `./ambitions/roulette.md`
> - `./errors.md`
> - `./solved.md`

---
### ./HANDOFF.md

```
# Matchalize — Handoff Status Report

> **NETWORK SCOPE (canonical decision):** Matchalize is an **INTRA + INTER college network** — users connect within their own campus (intra) AND across colleges nationwide (inter). Never describe it as one or the other. Verified via each college's `.ac.in` academic email.

> Updated: Sun Jul 26 2026. Reflects the actual codebase state after 55+ bug fixes and hardening passes.

---

## Architecture

| Layer | Stack |
|-------|-------|
| Frontend | React 19.2, Vite 8.1, Framer Motion 12, React Router 7, TanStack Query 5 |
| Backend | Express 4.19, Mongoose 8.4, Socket.IO 4.7, JWT (httpOnly cookies) |
| DB | MongoDB Atlas (10 collections) |
| Uploads | Cloudinary v2 (primary), with `deleteCloudinaryFile` cleanup helper |
| Push | Web Push API + VAPID keys |
| Monitoring | Sentry (client + server) |
| Hosting | Render.com (server + static client) |
| Style | Mobile-first PWA (430px max), dark theme (#000), orange accent (#f97316), Geist Sans 700 + Inter 400-600 |

## File Count

| Area | Files |
|------|-------|
| `client/src/pages/` | 7 (Splash, Auth, Onboarding, Discover, Matches, Chat, Profile) |
| `client/src/components/` | 13 root + 7 chat subcomponents |
| `client/src/utils/` | 10 (api, AuthContext, AppConfigContext, socket, theme, toast, haptics, push, useChat, dummyProfiles) |
| `server/routes/` | 9 (auth, users, discover, matches, messages, notifications, report, upload, config) |
| `server/models/` | 10 (User, Match, Message, Notification, OTP, Report, Block, Interaction, Analytics, Setting) |
| `server/middleware/` | 4 (auth, blockFilter, rateLimiters, validate) |
| `server/config/` | 4 (appData, cloudinary, compatQuestions, db) |
| `server/socket/` | 1 (chat.js) |
| `server/utils/` | 5 (email, push, queue, AppError, asyncHandler) |

**Total: ~70 source files**

## Key Patterns

- **Auth:** httpOnly cookie (`matchalize_jwt`), 7-day JWT, sliding expiration at 6 days, `ProtectedRoute` in App.jsx
- **State:** No state library — `AuthContext` + `AppConfigContext` only. React Query for server state.
- **Sockets:** Created per-page (Discover, Matches, Chat) via shared `utils/socket.js`. Not a global context.
- **Styles:** Inline styles only — no CSS modules, Tailwind, or styled-components.
- **Server:** ESM (`"type": "module"`). No TypeScript.
- **Vite:** Proxies `/api/*` and `/uploads` to `http://localhost:5005` in dev.
- **Errors:** Inline `res.status(X).json({ message: '...' })` — no custom error utility.
- **Rate limiters:** Per-user for messages (30/10min) and discover (100/10min). Per-IP for OTP (15/15min + 10/hr).

## Dev Mode

`ALLOW_ALL_EMAILS=true` bypasses `.ac.in` restriction. When `RESEND_API_KEY` is unset, OTP codes log to console only (no email sent). Both conditions print warnings at startup.

---

## Bug Fixes Applied (55+ issues)

### Safari / WebKit (3-part fix)
- `react-pageflip` DOM hijacking caused `NotFoundError` on Safari
- Added `pageFlip().destroy()` cleanup in Discover.jsx useEffect
- Swapped `<Suspense>` / `<AnimatePresence>` nesting order
- Stabilized page keys to prevent unnecessary re-renders

### Auth & Security
- **CORS hardened:** Replaced regex wildcard `*.onrender.com` with strict Set-based whitelist (`server/index.js`)
- **Suspended user check:** `protect` middleware returns `403 { suspended: true }`. Client catches + redirects to Auth
- **Deleted user check:** `protect` middleware returns `403 { deleted: true }`. Login also blocked for `isDeleted` users
- **Self-like guard:** `handleLike` returns 400 if `targetId === currentUser._id` (`discover.js`)
- **Profile URL validation:** `isValidImageUrl` applied to both `POST /setup` and `PUT /profile` — caps at 6 photos, 3 prompts
- **Socket membership validation:** `check-online` verifies both users share an active match before emitting
- **Dead listener removed:** Deleted orphaned `send-message` socket listener from `chat.js`

### Discover Deck
- **Fast deck engine:** Replaced slow `$sample` aggregation with indexed `randomSeed` range query (`discover.js`)
- **Atomic upsert:** Pass cooldowns use `findOneAndUpdate` with `upsert: true` instead of separate create/update
- **Bidirectional deck exclusion:** Queries both `actorId` and `targetId` for archive, letter, seal_stamp, accept_letter, accept_seal
- **Permanent archive fix:** `cooldownExpiresAt === null` now correctly always excludes (`!it.cooldownExpiresAt` check)
- **InterestedIn filter:** `Array.isArray` guard in Onboarding.jsx prevents crash on corrupted data
- **Gender preference UI:** Multi-select toggle on Onboarding PAGE 2 ("Show Me" filter)
- **isActionFlip guard:** Prevents `onPageFlip` from sending duplicate Pass actions
- **Dead code removed:** Removed `&reset=true` from Discover fetch URL; removed `.catch(console.error)` on pass

### Real-Time Chat
- **Multi-device broadcast:** Changed `io.to(recipientId)` to `io.to(matchId)` for match room broadcasting
- **Read receipts:** `deliveryStatus: 'read'` now set alongside `readAt` in both GET messages and socket `read-messages`
- **Typing cleanup on disconnect:** Server emits `user-stop-typing` in existing `!stillOnline` socket loop
- **Stop-typing on unmount:** Chat.jsx cleanup emits `stop-typing` when `typingTimer.current` is set
- **Message dedup:** `pendingMsgIdRef` generates `clientMsgId` once via useRef, prevents duplicate sends
- **Duplicate key handling:** `Message.create` wrapped in try/catch — duplicate key returns existing message with 200
- **Connection status banner:** Amber "Reconnecting..." banner on socket disconnect (WhatsApp pattern)
- **Character limit:** `maxLength={5000}` on chat input
- **iOS scroll threshold:** `scrollTop < 5` instead of `=== 0` for reliable detection
- **Back button:** Enlarged to 44px touch target with `WebkitTapHighlightColor`
- **Chat media upload:** Field name corrected from `'file'` to `'photo'`; `setPendingFile(null)` moved to `finally` block
- **Message delete:** `showOnlyIfMine: true` flag, filter logic, `toast.error` on catch
- **Emoji picker fix:** `if (a.key !== 'react') onClose()` keeps `selectedMessage` alive for emoji interactions

### Socket & Presence
- **Socket reconnect:** `socket.on('connect', onReconnect)` re-emits `join-match` after reconnect
- **Online status:** `socket.user.name` used for typing indicator instead of client-supplied value
- **Badge counts:** Unread match count filters for `yourTurn` or unread `lastMessage` only; clears on chat open

### Profile & Onboarding
- **Query invalidation:** `queryClient.invalidateQueries({ queryKey: ['matches'] })` after profile save
- **Image opacity fade:** All `<img>` tags (Chat header, Profile hero, PolaroidCard, ProfileCard) use `opacity: 0` → `onLoad` → `opacity: 1`
- **AppShell default:** `default:` case renders `<Profile>` instead of returning null

### Account Lifecycle (Enterprise-Grade)
- **Soft delete:** Account deletion sets `isDeleted: true`, `deletedAt: new Date()`, wipes PII, retains data for 30-day safety window
- **Two-tier cleanup:** Public profile media → immediate Cloudinary wipe. Chat media + Messages + Matches + Interactions → retained 30 days for Trust & Safety
- **Block → Unblock:** Block creates bidirectional permanent archive Interactions. Unblock removes them (allows re-encounter)
- **Unmatch:** Creates permanent archive Interaction. Matches page listens for `unmatch-notification` socket event for real-time removal
- **Delete dialog:** "This will immediately deactivate your profile, sever all active connections, and remove your correspondence from campus view. To maintain campus safety, archival logs are retained for 30 days before permanent destruction."

### Interaction Model
- **5 actionTypes:** `archive`, `letter`, `seal_stamp`, `accept_letter`, `accept_seal`
- **Accept budget fix:** Accepting letters uses `accept_letter`/`accept_seal` — does NOT count against daily sending limit
- **Indexes:** `{ actorId: 1, targetId: 1 }`, `{ actorId: 1, cooldownExpiresAt: 1 }`, `{ actorId: 1, actionType: 1, createdAt: -1 }` (daily limit), `{ targetId: 1, actionType: 1 }` (likes-you)

### Database Indexes
- **User discover:** `{ collegeCode: 1, isOnboarded: 1, isGhost: 1, isVerified: 1, suspended: 1, isDeleted: 1, randomSeed: 1 }`
- **User randomSeed:** Individual index for fast range queries
- **User text:** `{ name: 'text', email: 'text' }`
- **Match:** `{ users: 1, isActive: 1 }`
- **Message:** `{ matchId: 1, createdAt: 1 }`, `{ matchId: 1, _id: -1 }` (cursor pagination), `{ senderId: 1, createdAt: -1 }`
- **Interaction:** `{ actorId: 1, targetId: 1 }`, `{ actorId: 1, cooldownExpiresAt: 1 }`, `{ actorId: 1, actionType: 1, createdAt: -1 }`, `{ targetId: 1, actionType: 1 }`

### iPhone / iOS
- **Keyboard layout fix:** `<main>` changed from `position: fixed` + `overflowY: hidden` to `minHeight: 100dvh` + flex layout
- **Voice recording:** Detects `audio/webm`, falls back to `audio/mp4` with `.m4a` extension for iOS Safari

### Cloudinary
- **Cleanup engine:** `deleteCloudinaryFile` helper extracts public_id, handles audio/video detection, destroys from Cloudinary
- **Orphaned photo cleanup:** `collectUserPhotos` helper collects all profile/bio/prompt photos, compares old vs new, deletes orphans
- **Audio support:** Dynamic `params` function in upload route, audio folder, format list expanded

---

## Known Gaps (remaining)

| # | Gap | Severity |
|---|-----|----------|
| 1 | No message editing (deletion only) | Feature gap |
| 2 | No `delivered` status (goes `sent` → `read` directly) | Nice-to-have |
| 3 | No empty chat placeholder for zero-message matches | Minor UX |
| 4 | No error message on Discover fetch failure | Minor UX |
| 5 | No rate limiting on message delete or block/unblock | Low risk |
| 6 | Delete uses `window.confirm` instead of themed modal | Polish |
| 7 | No admin dashboard for reports/suspensions | Feature gap |
| 8 | No E2E or unit tests | Quality gap |
| 9 | No CI/CD pipeline | DevOps gap |
| 10 | Seed is destructive (`deleteMany` on run) | Dev tooling |

```

### ./ambitions/roulette.md

```
# Roulette — Canonical Design Spec

_Captures every decision made about the Roulette (Omegle/Chatroulette-style) feature
so far. Update this file when decisions change; other docs must not contradict it._

## 1. Product identity

Matchalize is NOT "a dating app plus Omegle", and it is NOT one college network.
It is a single college network for all of India, with **two moods**:

- **Discover** — "I want to choose who I talk to." (intentional)
- **Roulette** — "I want a spontaneous, low-pressure introduction." (chance)

Both lead to the same end: **mutual connection → private chat → optional reveal/date.**
Roulette is the front door / hook; Discover is the product; chat converts either into
something lasting. If Roulette can't produce mutual connects that become chats, it is
just expensive entertainment.

**Core promise:** "Meet verified college students your way: choose intentionally, or
meet by chance."

## 2. Network scope (CANONICAL — intra + inter)

Matchalize is an **INTRA + INTER college network**:

- **Intra:** users connect within their own campus.
- **Inter:** users connect across all verified campuses in India.

Documented in: HANDOFF.md (top-of-file block), PRD-related dump scripts,
dumps/ (see dumps/00-INDEX.md). Never describe it as one or the other.

- Roulette spans the **full verified network** (same campus AND all campuses).
- Discover deck is currently **intra-only** (`collegeCode` filter) — widening it is a
  backlog item, NOT a contradiction of the network scope.
- Verification = each college's `.ac.in` academic email (allowlist, expandable via
  COLLEGE_MAP) + DOB hard-check at signup (17-year-old freshmen edge).

## 3. The two entrances

| Action | Discover | Roulette |
|---|---|---|
| First impression | Profile / deck cards | Live masked video |
| Skip | Discover-only, 7-day cooldown re-queue | Roulette-only, PERMANENT (no re-queue) |
| Block/report | Lane-scoped | Lane-scoped |
| Connection | Alignment | Mutual Align |
| Identity | Full profile visible | Masked persona until reveal |

Only **serious enforcement is shared**: a ban in either place bans globally. Everything
else stays hermetically separate so users never feel watched across lanes.

## 3a. Canonical terminology (Rename ledger — do not contradict)

UI labels were de-jargoned. Any copy/documentation must use these, not the old terms:

| Old | New |
|---|---|
| Match / matchId / matches | Alignment / alignmentId / alignments |
| Discover tab | Deck tab |
| Matches tab | Letters tab |
| "Say hello" / "Open Correspondence" | Open Chat |
| superlike / priority seal | Telegram (`telegram`, `priority_telegram`) |
| "Matched Xh" | Aligned Xh |
| Class of 20XX | era value as-is (UG / PG) |
| foreword / "Draft the foreword" | bio / "Draft your bio" |
| Given Name | Name |
| Vault Settings / Seeking Parameters | Privacy / Seeking |
| Blocked Subjects | Blocked |
| dispatch / courier / artifact | send / message / photo |
| seal stamp animation ("AFFIXED") | "SENT" |

Shared feature verbs (kept): **Connect → Align** in Roulette. `archive` action and the
`opening_letter` message type are retained as internal type values. Era values are
**UG / PG only** (`year` field, `YEARS = ["UG","PG"]`).

## 4. Identity & progressive reveal

One verified account per person, with two faces:

- **Dating profile** (Discover): full photos, prompts, bio — unchanged.
- **Roulette persona**: first name/alias, maybe age band + college/region. No photos,
  no prompts, no dating profile reachable.

Flow: Roulette session → 60–120s masked video → both tap **Align** →
**Roulette Alignment chat** (masked) → either may tap **Reveal profile** →
**both must consent** → Discover profiles become visible to each other.

Reveal consent uses the same bilateral pattern as `accept_letter`.

## 5. Data model (decided: the CHEAP/UNIFIED path)

**One Connection, two origins.** Generalize the existing `Alignment` doc:

- Add `origin: 'discover' | 'roulette'`

Roulette mutual-Align and Discover mutual-like both create an `Alignment`; the chat,
sockets (rooms = alignmentId), Messages, notifications, and pushes all work
**unchanged** for both origins. Roulette alignments simply render masked until both
reveal, and do not emit an opening-letter.

**Rejected alternative:** a brand-new `Connection` model + migrating chat off
`Alignment` — touches ~13 files (Message, messages.js, socket/chat.js, alignments.js,
discover.js, notifications.js, report.js, Chat.jsx, Matches.jsx, AppShell,
NotificationDrawer, Discover.jsx) + indexes + data migration, and fragments chat into
two systems. Rejected because it conflicts with "two doors, one room" and costs days
for zero gain.

**Roulette-only history:** skips/blocks live in a separate interaction store (e.g.,
`RouletteInteraction`) so roulette actions NEVER read/write the Discover
`Interaction` collection. Skipping someone in Roulette has zero effect on Discover
and vice versa. `origin:'block'`-style roulette blocks are roulette-scoped only;
suspension/ban is global.

## 6. Matching rules

- **Preference-filtered, not random:** the queue only pairs users whose
  `interestedIn` intersects (incl. Everyone). Gender-ratio rails protect the
  less-numerous side from being swarmed.
- **Online-only pool:** only currently-in-session verified users are queued.
- **Skip = permanent** in Roulette (no 7-day re-queue). When the online pool dries,
  show a **"chamber is quiet"** state instead of a broken screen.
- **Session duration cap:** 60–120 seconds; mutual Align then moves to masked chat.
- **Roulette persona shows college/region** (location is visible; identity is not)
  so users can bias toward nearby campuses if they want.

## 7. Safety (₹0 tier — real, if manual)

Layers, in order of importance:

1. Verified identity on file (`ac.in`) — a named student signs in. **This is the
   strongest free deterrent Omegle never had.** Banning one real student travels
   fast on campus.
2. Instant Report + immediate disconnect during a session.
3. Block (lane-scoped) and global Ban/Suspension.
4. Rate limits (session counts — free tier: ~10 connections/day).
5. Admin review of serious reports in the existing admin panel.
6. Optional **in-browser NSFW detection** (TensorFlow.js sampling, verdict-only to
   server) — one extra layer ONLY. It is bypassable (edited client, virtual camera,
   model-stripped) and is NOT the safety system.
7. **No recording at start** (₹0). On report, keep text transcript + metadata + what
   the reporter submits.

Report/block/ban behaviors reuse the existing Report → shadowban → admin flow.

## 8. Tech decisions (₹0 start)

- **WebRTC P2P, STUN-first.** Browser-to-browser video = free transit.
- **TURN (coturn) = config flag from day one.** Env/config-driven; enabled only at
  public beta. No code change when flipped.
- **Progressive fallback live at launch:** if media can't connect, show
  "Can't reach each other's networks — continue in masked chat?" → the interaction
  continues in text. This is a feature (Bumble/Hinge "text first" pattern), never a
  broken screen.
- **No SFU / no server media core for 1:1.** 1:1 is P2P or simple relay.
- **Video 360p / adaptive quality, not HD.**
- Signaling rides the existing authenticated Socket.IO connection.
- No deployment manifests currently in repo; hosting is external/env-based.

## 9. Cost model — the full truthful picture

### Phases

| Phase | Cost | What it buys |
|---|---|---|
| Build | ₹0 | Queue, P2P video, masked chat, skip/connect/reveal, report UI, admin |
| Test (20–100 students) | ₹0 | Private beta on free tiers |
| Public beta launch | **₹400–500/mo** (one VPS) | Always-on sockets + coturn + uptime |
| Growing real usage | ₹2,000–10,000/mo | Real relay bandwidth + stable hosting |
| Mass daily usage ceiling | ~₹2 lakh/mo | Only if thousands of users stay on video for hours daily — monetize BEFORE this |

The ₹500 and ₹2 lakh numbers are the same timeline at different points; they do not
contradict.

### Bandwidth math (why the secondary lane fits a small VPS)

- TURN relays only the **minority** of calls that fail P2P — NOT all traffic.
- 360p call ≈ 1 Mbps through relay ≈ **0.45 GB per relayed call-hour.**
- Conservative ₹500 VPS ≈ **1 TB/month** (Hetzner ~20 TB at similar price).
- 1 TB ≈ **~2,200 relayed call-hours/month.**
- Realistic 5,000-user secondary lane: ~1,800 total call-hours/mo; even if HALF relay
  → ~400 GB — under half the conservative allowance.
- Registered users ≠ concurrent load; online-only + short sessions keeps duty cycle
  tiny. Signaling for hundreds of concurrent sockets is KB/s.
- Capacity ceiling on that VPS ≈ 20–50 **simultaneous** relayed calls — fine for a
  secondary tab; track it, don't guess.

### What stays free at 5,000 users

| Layer | Free solution |
|---|---|
| Compute (signaling/API/sockets) | Free tier works for build; VPS at public launch |
| Database | MongoDB Atlas M0 (512MB free) — text/metadata only; media in Cloudinary |
| Media storage | Cloudinary free tier (25GB) |
| OTP email | Resend free tier (100/day, 3,000/mo); fine for normal pace (7-day JWTs → OTPs rare) |
| Moderation compute | In-browser, client-side |
| Video transit | P2P free; relay only when needed |

### Monitoring — the three numbers that decide when to pay

1. WebRTC connection-success rate
2. Percentage of calls relayed through TURN
3. Average TURN GB/day

(Do NOT promise a success % — measure it. Pay for more only when these prove real
usage.)

### Honest trade-offs at ₹0

- Some calls fail without TURN → masked-chat fallback takes over.
- Free PaaS tiers sleep sockets → flaky "live".
- No recording → rely on reporter's evidence vs past incidents.
- Manual moderation, not enterprise AI.
- Verdict: fully free = "works but degraded"; ₹500 = "works like imagined."

## 10. Monetization & business model (when ready)

**Keep free:** joining Roulette, a few daily rounds, reporting/blocking, basic
Discover + chat, mutual Align.

**Charge (premium ~₹199/mo example):**
- More Roulette rounds after daily free limit (e.g., free = 10 connections/day)
- Skip-queue / faster matching (only where it doesn't harm fairness)
- Advanced Discover filters
- "Who liked you"
- Profile boosts
- Extra profile/prompt/customization
- "Late Night Chamber" / themed live rooms
- Campus event tickets / sponsored mixer passes

**Profit math (from external review, accepted here):** ₹2 lakh/mo opex is covered by
roughly 5–10% of a 10k user base paying:

| Paid users | Price/mo | Revenue |
|---|---|---|
| 500 | ₹399 | ₹1.99 lakh |
| 1,000 | ₹199 | ₹1.99 lakh |
| 2,000 | ₹99 | ₹1.98 lakh |

(before payment fees, GST, marketing, staff.)

**The business loop:** Free Roulette → retention/addiction → more opens → more
alignments/chats → premium conversion. Monetize Roulette's limits and Discover's
control; do not paywall basic video.

**Reality check first milestone:** can 50–100 students repeatedly use it, connect,
and come back? If no, no amount of money saves it. If yes, add limits + premium
later.

## 11. Build order / prerequisites

1. **Fix the two HIGH security findings FIRST** (they become critical when strangers
   are face-to-face):
   - Admin force-disconnect doesn't invalidate JWT/cookie (`lastLogoutAt`) → kicked
     users re-auth on refresh; uncooperative clients stay in rooms.
   - Cross-user Cloudinary media wipe
     (`isValidImageUrl` owns-nothing scope → user can plant + delete another user's
     photos).
   - Plus the documented CastError + destructive-route rate-limit gaps.
2. Pass the QA suite (`npm run qa`).
3. Data model: `Alignment.origin`.
4. Roulette backend: online-only preference queue, session rooms, sockets, skip/block
   store, masked chat render + bilateral reveal endpoint.
5. WebRTC P2P + STUN + graceful fallback (TURN flag off).
6. Reports → admin → ban wiring (reuse existing).
7. Nav consolidation: Deck / Roulette / Letters / Profile (badges by origin).
8. Full-dump + HANDOFF updates.

## 12. Current code state (so far)

- **Nav tab added** to mobile `NavBar.jsx` + `DesktopSidebar.jsx` (Shuffle icon),
  wired via lazy import in `AppShell.jsx`. Build passes.
- **Placeholder page** `client/src/pages/Roulette.jsx` — masked lobby UI, no backend.
- **Docs updated:** HANDOFF.md (intra+inter block), dump scripts + existing dumps,
  roulette lobby copy.
- PRD.md was **deleted** (per owner). Roulette + all product decisions now live HERE.

## 13. Open items / backlog

- Discover inter-college deck scope (deferred — "we'll do something about it later").
- WebRTC-video vs chat-only-first launch order (video deferred is acceptable if the
  budget never appears).
- Verify Cloudflare free 1 TB real-time/SFU/TURN allowance as a possible ₹0 middle
  phase before the VPS.
- Decide premium pricing precisely only when usage proves a need.
```

### ./errors.md

````
<!-- Major correctness findings (ranked)
1. HIGH — users.js:28–64, 111–118, 140, 156–158 / 268–270 / 321
isValidImageUrl() accepts any res.cloudinary.com image URL with no folder/ownership scope (contrast with the stricter isValidMediaUrl in messages.js:17–36), and bioPhoto is written with no validation at all. Those URLs are later fed to deleteCloudinaryFile() fire-and-forget whenever a photo is replaced or the account is deleted. Concrete failure: any authenticated user can plant another user's public photo URL in their own photos/bioPhoto (URLs are visible via Discover), then remove it (or delete their account) → the victim's actual Cloudinary asset is destroyed while its URL stays in the victim's profile/messages → cross-user media wipe, permanently 404'ing photos and chat media.
2. HIGH — socket/chat.js:91–116 + admin.js:304–331 / 320–336
force-disconnect is only a client-cooperative event (handled in client/src/utils/socket.js:10); there is no server-side listener/disconnect. A suspended/deleted user whose client ignores the event stays in join-match rooms indefinitely — the per-event socket.use suspension cache only refreshes on the suspended user's own inbound events after the 60s TTL. Concrete failure: the "admin kick stays instant" claim in chat.js:90 is false; a non-cooperative client keeps receiving new-message/typing/presence broadcasts and stays marked online despite suspension.
3. MEDIUM — messages.js:160–164, 192–194 + Message.js:25–29
The idempotency lookup Message.findOne({ clientMsgId }) is unscoped (no senderId/matchId filter) against a globally unique sparse index, and the E11000 recovery path does the same. If a clientMsgId ever repeats across users/matches (UUID v4 collision, a weaker custom client, or a stale id reused after an edited retry — note the client keeps one ref until success, Chat.jsx:523/538), the route returns the other message's full text/media payload 200 and silently drops the sender's new message — cross-tenant message disclosure plus silent message loss.
4. MEDIUM — messages.js:283–287
Delete clears text, image, mediaUrl but not caption. A deleted photo/voice message's caption remains fully retrievable via GET /api/messages/:matchId (history) — content survives "vaporization" and shows up for both parties.
5. MEDIUM — messages.js:122/184 + Message.js:38–41
caption has no length cap anywhere (schema has no maxlength; body limit is 10 MB), while text is explicitly capped at 5000 chars. A user can store megabyte captions that are persisted, broadcast to the match room on every send, and echoed in every history fetch.
6. MEDIUM — report.js:108–128
The block route has no "already blocked" guard: Block upsert is idempotent, but Interaction.create([...]) runs unconditionally on every call. Each reload/double-tap/retry of POST /block/:userId inserts 2 more permanent archive rows forever → unbounded Interaction growth that every Discover deck query (discover.js:231–236) must load and scan.
7. MEDIUM — matches.js:141–162
findOne({isActive:true}) → save() → Interaction.create is a non-atomic check-then-write. Two concurrent unmatches (double-tap on a slow network) both pass the guard and create duplicate permanent archive rows + duplicate unmatch socket/push notifications — the comment at line 139–140 claims a guard that doesn't actually exist under concurrency.
8. MEDIUM — discover.js:57–63, 81
Daily letter/Telegram limit is countDocuments() then Interaction.create() with no guard/index — parallel requests all observe dailyCount = 6 and all insert, bypassing the 7/day and 1/day limits (plus each like also creates a Notification, so notifications multiply too).
9. MEDIUM — discover.js:119–125
The mutual-match check runs after inserting my own Interaction with no atomicity. When two users like each other near-simultaneously, both may read isMutual before the other's row commits → no Match is created, and since letters permanently exclude both from each other's decks (discover.js:251–252), the pair is permanently dead unless the inbox notification is manually accepted.
10. MEDIUM — waitlist.js:133–144, 149–163
Position assignment is countDocuments()+1 then insert — concurrent joins yield duplicate position values (no unique index on position). Referral bonus is a read-modify-write referrer.save() (lines 137–141) with no $inc/atomicity — concurrent referrals on the same code lose bonus jumps and produce overlapping shift windows in shiftPositionsUp.
11. MEDIUM — notifications.js:29–33 + User.js:136–139
pushSubscription is Mixed and only endpoint presence is checked; arbitrary nested objects up to the 10 MB JSON limit are persisted on the User document (and re-fetched on every push). Unbounded user-document bloat with no validation.
12. MEDIUM — users.js:122–149, 223–261 + User.js schema
Profile fields are written with only count caps, not size caps: gender (no maxlength in schema), intent, interests[] items, and prompts[].question/answer are unbounded strings under a 10 MB body limit. Multi-MB strings land in the User doc, then are serialized into every Discover deck and Matches response — payload amplification across the app.
13. MEDIUM — utils/queue.js:29–31
queue.push(task) has no max length or drop policy. If a task (e.g., webPush.sendNotification with no timeout while a worker hangs) stalls all 20 workers, the in-memory queue grows without bound under burst traffic — a memory/backpressure leak with no cap.
14. MEDIUM — waitlist.js:205, 232, 275 and admin.js:334
Four catch blocks return 500 with no console.error/Sentry — DB CastErrors, timeouts, and duplicates are silently dropped. Diagnosing waitlist/check-in/admin-disconnect failures requires guessing.
15. MEDIUM — Block model (models/Block.js:9) used by blockFilter.js:10–21
getBlockExclusionQuery runs { $or: [{blocker: id}, {blocked: id}] } on every Discover request, but only a compound {blocker:1, blocked:1} index exists — the {blocked: id} branch has no prefix and forces a collection scan on the whole blocks collection for every deck render; discover latency degrades linearly as blocks accumulate.
Categories explicitly checked and clean (no finding)
- Missing await / unhandled rejections: deleteCloudinaryFile never rejects (internal try/catch), queue wraps tasks with .catch, socket lastActive updates have .catch, push has a catch-all. None found.
- N+1 loops: all loops are in-memory (admin aggregates, discover scoring, waitlist bulkWrite). None found.
- Mass assignment: every route destructures req.body with an explicit allowlist; no ...req.body or direct req.body → DB writes exist.
- Secret leakage: no JWT/API key/env secret is logged or serialized into responses (OTP logging is dev-only and intentional).
Clean shave (solid files)
- middleware/auth.js, middleware/validate.js, middleware/rateLimiters.js, middleware/blockFilter.js, middleware/admin.js
- utils/push.js, utils/AppError.js, utils/email.js
- config/db.js, config/cloudinary.js, config/compatQuestions.js, config/appData.js
- routes/auth.js, routes/config.js
- index.js (graceful shutdown, error handler, CORS/CSP reasonably hardened)
- All models are well-built (indexes on hot paths, enums, unique constraints) except the Block missing-{blocked} index noted in finding 15.
▣  Explore · Big Pickle · 8m 22s

by qwen:
The codebase is **exceptionally well-architected**. You have correctly implemented advanced, production-grade patterns such as atomic upserts to prevent race conditions, partial unique indexes, idempotency keys (`clientMsgId`), cursor-based pagination, and robust socket room management. 

However, after a deep scan of the provided dump, I found a few **Major Errors** and critical edge cases that could lead to security bypasses, 500 server crashes, or broken UX. 

Here are the major issues and how to fix them:

---

### 1. Critical Security: Admin "Kick" Doesn't Invalidate Session
**Location:** `server/routes/admin.js` & `client/src/utils/socket.js`
**The Bug:** When an admin forces a disconnect (`POST /api/admin/users/:id/disconnect`), the server emits a socket event, but **it does not invalidate the user's JWT**. 
If the client's socket disconnects or the user refreshes the page, the `matchalize_jwt` httpOnly cookie remains valid. Because `lastLogoutAt` was never updated, the `protect` middleware will happily authenticate them, effectively bypassing the admin's kick.

**The Fix:** 
Update `lastLogoutAt` in the admin route to instantly invalidate the JWT via your existing sliding expiration/multi-device check.
```javascript
// server/routes/admin.js
router.post('/users/:id/disconnect', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  
  // 🛡️ INVALIDATE JWT SOCKET & COOKIE
  await User.findByIdAndUpdate(req.params.id, { lastLogoutAt: new Date() });

  const io = req.app.get('io');
  if (io) {
    io.to(req.params.id.toString()).emit('force-disconnect', {
      reason: 'Admin forced disconnect',
    });
  }
  res.json({ message: 'Disconnect signal sent' });
});
```
*(Note: On the client side, `socket.js` should also unconditionally clear `localStorage.removeItem('matchalize_user')` upon receiving `force-disconnect`, regardless of the reason).*

---

### 2. High Severity: Unhandled `CastError` (500 Crashes)
**Location:** `server/socket/chat.js`, `server/routes/messages.js`, `server/routes/matches.js`, `server/routes/report.js`
**The Bug:** Multiple routes and Socket events accept user-supplied IDs and pass them directly to Mongoose without validating them. If a malicious user or a buggy client sends an invalid string (e.g., `matchId = "abc"`), Mongoose throws a `CastError`, resulting in an unhandled **500 Internal Server Error** instead of a clean 400 Bad Request.

**The Fix:**
Add a quick validation middleware or inline checks.
```javascript
// Example for Socket Events (server/socket/chat.js)
socket.on('join-match', async (matchId) => {
  if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) return;
  // ... rest of the code
});

socket.on('check-online', async ({ matchId, targetUserId }) => {
  if (!mongoose.Types.ObjectId.isValid(matchId) || !mongoose.Types.ObjectId.isValid(targetUserId)) return;
  // ...
});
```
*Apply `mongoose.Types.ObjectId.isValid(req.params.id)` checks at the top of `GET/POST/DELETE /:matchId` and `/:id` routes in `messages.js`, `matches.js`, and `report.js`.*

---

### 3. Major UX Bug: Chat Search Jump Fails on Paginated History
**Location:** `client/src/pages/Chat.jsx`
**The Bug:** The `handleSearchJump` function attempts to scroll to a message using `document.querySelector(\`[data-msg-id="${msgId}"]\`)`. 
However, your chat uses **cursor-based pagination** (loading only the latest 50 messages). If a user searches for a keyword that exists in a message from 3 months ago, that message is **not in the DOM**. The `querySelector` returns `null`, and the jump silently fails, confusing the user.

**The Fix:**
You cannot rely on the DOM for search jumping in a paginated chat. When a search result is clicked, you must either:
1. Fetch the message's `createdAt` or `_id`, reset the chat's cursor to that point, reload the messages array, and *then* scroll.
2. Or, temporarily render a "Jump to original context" button that fetches the specific page of history containing that message.

---

### 4. Medium Severity: Fire-and-Forget Cloudinary Cleanup
**Location:** `server/routes/users.js` (Account Deletion)
**The Bug:** When a user deletes their account, you wipe their Cloudinary photos using a `forEach` loop:
```javascript
collectUserPhotos(user).forEach(url => deleteCloudinaryFile(url));
```
Because `deleteCloudinaryFile` is `async`, this is a "fire-and-forget" operation. If the Cloudinary API rate-limits or fails, orphaned media remains on your cloud storage indefinitely, and you have no retry mechanism or logging for the failures.

**The Fix:**
Use `Promise.allSettled` and log failures so a background cron job can clean them up later.
```javascript
const deletionResults = await Promise.allSettled(
  Array.from(collectUserPhotos(user)).map(url => deleteCloudinaryFile(url))
);
deletionResults.forEach((result, index) => {
  if (result.status === 'rejected') {
    console.error(`[Cleanup Failed] Orphaned media retained:`, result.reason);
    // TODO: Push to a cleanup queue/cron
  }
});
```

---

### 5. Edge Case: Brittle Image URL Validation
**Location:** `server/routes/users.js` (`isValidImageUrl`)
**The Bug:** The validation checks if the `pathname` ends with an image extension:
```javascript
return /\.(jpg|jpeg|png|webp)$/i.test(parsed.pathname);
```
If a user somehow submits an Unsplash URL with query parameters (e.g., `https://images.unsplash.com/photo-123?w=600&q=80`), `parsed.pathname` is `/photo-123`. The regex will fail, and the server will reject the profile setup with "One or more photo URLs are invalid." 
*(Note: Your frontend upload flow mitigates this by uploading to Cloudinary first, but if the frontend ever changes or a direct URL is passed, this will break).*

**The Fix:**
Check the extension against the full URL or ignore query parameters properly.
```javascript
const isValidImageUrl = (url) => {
  // ... existing trusted host checks ...
  // Extract extension before any query parameters
  const pathWithoutQuery = parsed.pathname.split('?')[0];
  return /\.(jpg|jpeg|png|webp)$/i.test(pathWithoutQuery);
};
```

---

### 6. Missing Rate Limiting on Destructive Actions
**Location:** `server/routes/messages.js` & `server/routes/report.js`
**The Bug:** You have excellent rate limiters for `discover` and `message sending`, but there is **no rate limiting** on:
*   `DELETE /api/messages/:matchId/:msgId` (Message deletion)
*   `POST /api/report/block/:userId` (Blocking)

A compromised client or malicious script could spam these endpoints, causing unnecessary DB write locks and Cloudinary API calls.

**The Fix:**
Add a lightweight limiter for destructive actions.
```javascript
// server/middleware/rateLimiters.js
export const destructiveActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 deletes/blocks per minute
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many actions. Please slow down.' },
});

// Apply to routes:
router.delete('/:matchId/:msgId', protect, destructiveActionLimiter, async (req, res) => { ... });
router.post('/block/:userId', protect, destructiveActionLimiter, async (req, res) => { ... });
```

### Summary
Your implementation of the **Interaction Model** (using `archive`, `letter`, `seal_stamp` with cooldowns) and the **Discover Deck Engine** (using `randomSeed` for indexed range queries instead of `$sample`) is brilliant and highly optimized. 

Fixing the **Admin JWT invalidation** and the **Mongoose CastError** vulnerabilities should be your immediate priority before deploying to production.


/// -->

glm5.3:
Nice, solid dump — I got through everything. Quick note before the list: **your paste cuts off mid-way through `models/Waitlist.js`** (inside `generateReferralCode`), and the `routes/`, `socket/`, and `utils/` files aren't in this share — a few findings below are marked "verify" because they depend on those.

---

## 🔴 Critical

**1. `dotenv.config()` runs *after* your imports (index.js)**
ESM imports are hoisted and executed before any module body code. `config/cloudinary.js` calls `cloudinary.config()` at module scope, so it runs **before** `.env` is loaded — `cloud_name`, `api_key`, `api_secret` are all `undefined`. It only works on Render because the platform injects real env vars; local dev with a `.env` file breaks silently.
```js
// first line of index.js, before all other imports:
import 'dotenv/config';
```

**2. `Block` model has no index on `blocked`**
`getBlockExclusionQuery` / `areBlocked` query `$or: [{ blocker }, { blocked }]`. The unique compound index `{blocker: 1, blocked: 1}` only serves the `blocker` branch — the `blocked` branch is a collection scan on every discover deck build.
```js
blockSchema.index({ blocked: 1 });
```

**3. `multer 1.4.5-lts.1` has known unpatched DoS vulnerabilities**
The 1.x line has multiple CVEs (malformed multipart request crashes). Upgrade to `^2.0.2`. Also, `multer-storage-cloudinary` is barely maintained — consider streaming straight to the Cloudinary SDK.

**4. OTPs stored in plaintext (models/OTP.js)**
A DB leak inside the 10-minute window exposes live, usable codes. Hash them (HMAC or bcrypt) and compare hashes on verify.

**5. Default-open environment posture (index.js)**
- `NODE_ENV === 'development'` → **all origins allowed with `credentials: true`**
- `NODE_ENV !== 'production'` (i.e., unset or typo'd) → private LAN origins allowed

If `NODE_ENV` is ever mis-set on a deployment, you're silently permissive. Fail closed: hard-exit on missing `NODE_ENV`, or make the whitelist the only path in prod.

**6. Rate-limit drift + memory DoS surface**
`APP_CONSTANTS.API_RATE_LIMIT` says 100 req/15 min, but the actual limiter is **2000/min (~120k/hr)** combined with a 10MB body limit. That's ~20GB/min of parseable body per IP on a small dyno. Align the constant with the implementation — and actually use the constant instead of duplicating numbers.

---

## 🟠 Security / Design

- **`x-new-token` header undermines httpOnly** — the entire point of the httpOnly cookie is that XSS can't read the JWT, but the sliding-refresh path hands it to JS via a readable header. Since your SPA is same-origin, socket.io can read the cookie server-side in the handshake (`socket.handshake.headers.cookie`). Unless you have native mobile clients needing it, drop the header or move token rotation to a dedicated refresh endpoint.
- **socket.io CORS lacks `credentials: true`** — if frontend and API ever live on different domains, cookie auth silently fails on the polling transport.
- **CORS rejections return 500s** — `callback(new Error(...))` falls into your generic handler, so blocked origins get "The archival ledger encountered an unexpected tear." Use a proper 403, and honestly that 500 message will confuse *real* users hitting *real* errors too.
- **Malformed JSON → 500, not 400** — body-parser errors aren't `isOperational`. Add a branch for `err.type === 'entity.parse.failed'` / `'entity.too.large'`.
- **`uncaughtException` exits without flushing Sentry** — the exception never reaches Sentry. Use `Sentry.captureException(err)` → `await Sentry.close(2000)` → exit. Same applies to the SIGTERM path.
- **Graceful shutdown never closes Socket.IO** — `server.close()` won't fire its callback while websockets are open, so every deploy rides the 10s force-kill. Call `io.close()`.
- **`Report` unique `{reporter, reported}`** — a user can report someone **once, ever**. Second incident or escalating behavior → E1100. For a dating app this is backwards. Use a partial unique on *pending* reports or allow multiple.
- **Admin = single `ADMIN_EMAIL` env compare** — no role on the user, no audit trail, and anyone with env access silently becomes admin. Also duplicates token extraction from `auth.js`, and the `matchalize_jwt` cookie name is now hardcoded in **3 files**.
- **User model leak risk** — `adminNotes`, `suspendedReason`, `shadowbanScore`, `pushSubscription`, `randomSeed` live on the same doc served to users. Unless *every* route selects fields explicitly, these leak. Safer: strip in a `toJSON` transform or split admin data into another collection. *(Will verify in your routes file.)*
- **Per-email OTP limiter enables victim lockout** — anyone who knows a victim's `.ac.in` address can burn their 15-attempt bucket and block verification for 15 minutes.
- **`adminProtect` hands routes a `lean()` plain object** while `protect` gives a real Mongoose doc — `req.user.save()` in admin routes will crash. Inconsistent middleware contracts.
- **`/uploads` guard** — hardcoded cookie name, and verifies JWT but not `suspended`/`isDeleted`, so deleted users keep upload access until token expiry.

---

## 🟡 Performance / Reliability

- All rate limiters use the **in-memory store** — they reset on every deploy and don't share state across instances. Fine on one dyno; breaks the moment you scale to 2. Plan a Redis store.
- **Partial TTL index on Notification** — verify it actually built: Mongoose **silently logs** index-build failures, and partial TTL behavior is version-dependent. Check the Atlas index list.
- `deleteCloudinaryFile`'s transformation regex will also strip **real folders** that look like transformations (e.g., a folder named `f_images`), silently producing a wrong `public_id`.
- `Analytics` has no index on `user`/`event` and no TTL — funnel queries scan and the collection grows forever.

---

## 🔵 Minor / Cleanliness

- `Message.image` vs `mediaUrl` — two fields for the same job, drift guaranteed.
- `User`: stores both `age` and `dob` (they'll drift); `prompts.answer` has no maxlength; `ageRange` has no min ≤ max schema validation; `reactions` unbounded; `deleted: true` keeps full message text forever (privacy concern for a dating app).
- `Alignment`: nothing enforces exactly 2 users or `pairKey` ↔ `users` consistency.
- `Waitlist`: hardcoded defaults `IIT Bombay`/`iitb`; `referralCode` has both `unique: true` and `index: true` (redundant).
- `COLLEGE_MAP` has 10 IITs but your product description claims **all colleges of India** — one of these is wrong.
- helmet CSP keeps `localhost` in `connectSrc` even in production.
- Sentry: manually passing `expressIntegration()` **and** calling `setupExpressErrorHandler` is redundant (harmless — deduped — but noise).
- Express 5 landmines (fine today): `app.get('*')` and `express-mongo-sanitize@2.x` both break on Express 5.
- No tests, no linter, no CI.

---

## ✅ Genuinely good stuff

`pairKey` uniqueness, the partial unique index enforcing one opening letter per alignment, sparse `clientMsgId` dedup, ObjectId-cursor pagination, fail-fast env validation, the `lastLogoutAt` invalidation + sliding session combo, and the reasoning behind per-email OTP limiting (NAT'd campuses) is legitimately thoughtful.

---

Send the second file — I especially want to see `routes/upload.js` (does it re-config Cloudinary per request?), `routes/auth.js` (OTP verify logic, `.ac.in` enforcement), and how `/me`-style endpoints select User fields. 👀



OPENCODE:
Audit complete. Five parallel deep-dives over server, socket/models, client infra, and client pages, with the top findings spot-checked against source. Roughly 90 distinct issues; below are the ones worth acting on.
Tier 0 — confirmed, breaking now
1. server/index.js:37 — dotenv.config() runs after every import. ESM evaluates all imports before the importing module's body, so every module-scope process.env read captures undefined. Verified empirically with a two-file repro. Concretely:
- server/middleware/auth.js:5 → isProduction is always false → auth cookie issued without Secure.
- server/routes/upload.js:10 → isCloudinaryConfigured false → uploads silently fall to disk storage, skipping moderation: 'aws_rek'. The 38 files in server/uploads/ corroborate this.
- server/utils/push.js:3 → setVapidDetails never runs, push throws forever.
- server/config/cloudinary.js:3 → configures with undefined.
Fix: move dotenv.config() into a config/loadEnv.js imported first, and fail closed at boot instead of downgrading silently.
2. Letters tab is entirely dead. server/routes/alignments.js:121 returns { alignments }; Matches.jsx:76 and AppShell.jsx:69 read data.matches. The old matches.js was renamed and the key wasn't updated. Users see "No letters yet" permanently and the badge is always 0.
3. Discover deck is ~95% duplicates. discover.js:287 does a randomSeed: { $gte: randomPoint } range query with no .sort(), so Mongo returns the 80 smallest seeds ≥ p — a deterministic window, not a sample. Simulated: 84/500 users ever reachable, 43 repeats of one profile across 200 pages. The client appends with no _id dedup. Also hasMore is computed from the pre-exclusion batch, so the client appends duplicate pages until the 4.5MB localStorage cap.
4. Logged-in users see each other's data. AuthContext.jsx:30 — logout() never clears the TanStack Query cache (App.jsx:94 holds a module-level queryClient, 2-min staleTime). Sign out as A, sign in as B on a shared phone: B sees A's full message and match lists with no network request. Relatedly api.js:21 hard-redirects via window.location.href while there is no router at all (react-router-dom is installed and never imported), so the pathname !== '/auth' guard wedges the app into a permanently-401 state.
5. socket/chat.js:149,156 — one malformed packet kills the process. Both handlers destructure { alignmentId } from the raw payload with no guard. socket.emit('typing') with no payload is a valid frame; Socket.IO dispatches listeners with no try/catch, so it throws synchronously → uncaughtException → index.js:319 process.exit(1). Reproduced against the project's own socket.io@4.8.3. Full outage, triggerable by any authenticated user.
6. IDOR: messages.js:160 — Message.findOne({ clientMsgId }) has no senderId/alignmentId scope. clientMsgId is fully client-controlled with no format constraint. Anyone whose client emits sequential ids enumerates every message body in the system. Same unscoped read at :192.
7. Arbitrary Cloudinary deletion. users.js:140 assigns bioPhoto with zero validation, and users.js:154-158 destroys any removed URL via deleteCloudinaryFile with no ownership check. Read a victim's photo URL from /api/discover, set it as your bioPhoto, save with it empty → their asset is destroyed. Same path via isValidImageUrl trusting any res.cloudinary.com cloud/folder.
8. Suspended users keep receiving message previews on their lock screen. push.js:17 never checks suspended/isDeleted. Suspension nulls the subscription on delete but not on suspend, so an admin-suspended harasser's phone keeps showing sender.name + first 100 chars of private message content.
9. Shadowban bypass: auth.js:152-161. Delete → wait 30 days → re-register. User.deleteOne destroys the only record, and the fresh account defaults every moderation field to clean.
Tier 1 — high
- 10. Block/unmatch push names the blocker (report.js:137) — destroys the abuse-reporting safety affordance.
- 11. Unscoped /uploads gate (index.js:227) — any logged-in user can enumerate /uploads/<userId>-<ts>.<ext> and harvest every photo; suspended/revoked tokens still pass.
- 12. OTP fails open — RESEND_API_KEY is absent from server/.env, so /send-otp returns 200 "sent" while logging the code. NODE_ENV is also unset, so email.js:46 logs every OTP even when configured.
- 13. No IP tier on OTP routes — both limiters are email-keyed, so unlimited bombing of arbitrary addresses (harassment + Resend quota burn).
- 14. CORS allows every origin with credentials when NODE_ENV === 'development', and FRONTEND_URL is a plain-HTTP LAN origin.
- 15. /uploads URL is built from the Host header (upload.js:76) — attacker-chosen origin persisted into profiles.
- 16. Duplicate message bubbles — socket onNew dedupes (Chat.jsx:402), the POST append doesn't (:534), and the server broadcasts to the sender's room first. Plus pendingMsgIdRef isn't reset on failure (:539), so a failed send makes the next message return the previous one server-side and your new text vanishes.
- 17. Matched users never excluded from the deck (discover.js:231) — no branch consults Alignment, so you can re-like your own match.
- 18. age never selected and ageRange never applied (discover.js:261) — ProfileCard.jsx:829 renders — for every card; the age preference is dead config.
- 19. Rate limiter runs after a 10MB body parse (index.js:194-206) — unauthenticated 10MB POSTs to /api/auth/send-otp exhaust the heap before any budget is deducted.
- 20. x-new-token header (auth.js:83) publishes the JWT to JS on every sliding refresh, defeating httpOnly. No client consumer exists.
- 21. Room membership never revoked (chat.js:149) — after unmatch/block you keep a live typing-indicator channel into the ex-partner's chat.
- 22. Service worker caches /uploads and 13.5MB of media forever, cache-first, no quota (sw.js:60).
- 23. Queue is unbounded with no timeout, no retry, no drain (queue.js) — 20 stuck push calls silently stop all processing forever.
Tier 2 — worth fixing, lower urgency
Reaction read-modify-write loses reactions (messages.js:243); negative page → 500 (notifications.js:85, alignments.js:18); total/hasMore computed before a post-pagination filter (alignments.js:21); /pass/:id overwrites permanent unmatch archives (discover.js:355); unblock doesn't restore discoverability (report.js:161); Accept resurrects blocked alignments (notifications.js:107); contentFrozen = false at ≥5 reports reduces restrictions (report.js:67); admin shadowbanThreshold setting is stored but never read; schema maxlength violations return 500 (users.js:122); interestedIn unvalidated against GENDERS → permanently empty deck; notification pagination caps at 20 with no load-more; Profile.jsx:783 bricks on a failed fetch; stale-closure lost update on profile chips; MessageBubble long-press fires on plain tap; SearchOverlay regex crash on (; socket.off('online-status') with no handler wipes all listeners; ArchivalToast cancels its own dismiss timer; pendingMsgIdRef/discoverStore staleness; QA harness spreads all prod secrets and drops collections with no test-DB assertion; migrate-alignment.mjs has no dry-run.
What I'd fix first
Tier 0 in this order — items 1, 5, and 2 are each a one-to-few-line change that unblocks a large blast radius. Item 1 first, since it also determines whether the upload and push pipelines work at all.
Two questions before I proceed: do you want me to start applying fixes, and if so, in Tier 0 →1 → 2 batches for review between each? Also worth confirming whether server/.env on this machine is the production config, since that changes whether items 12 and 15 are live exposures or latent ones.
▣  Plan · Space Bunny Free · 15m 58s


glm5.3:
Your AI ran a tight verification pass — I'll take both corrections, and the four Q&As close out cleanly. Quick reconciliation, then the fix plan.

---

## Corrections accepted

**Port mismatch — withdrawn.** Fair cop. In my second review I explicitly hedged it ("if `run-qa.mjs` boots a separate server on 5051, fine — verify"), and then my third review's ✅ list promoted it to confirmed *without new evidence*. That was my error. The `.env.test` explanation is consistent with the repo (root `.gitignore` listing `/server/.env.test` now makes sense), so: two deliberate environments, not a bug. Nobody should "fix" it.

**`/waitlist` — agreed, landmine not crash.** That was actually my framing too ("even if it doesn't today, this is a landmine"), so we're aligned: works today because `Waitlist.jsx` uses plain `fetch`, hoist the provider as cheap insurance, not urgent.

The four answers: Q1 solid, Q2 confirms both the dead `react-router-dom` dep **and** my deep-link finding, Q3 no bug, Q4 real bug. All clean.

---

## On the deduped table

It's correct as far as it goes, with two nuances worth adding:

**#1 is worse than "localStorage leak."** The data crosses the wire — anyone with devtools sees `adminNotes`, `suspendedReason`, `shadowbanScore` in the network response, not just in storage. Worse for moderation integrity: **shadowbanned users can self-detect**, which defeats the entire shadowban mechanism. Also don't patch just `auth.js:265` — `users.js` (`/me`, profile updates) is 400+ lines I never saw, so other routes may return full docs too. Fix it structurally:

```js
// User.js — safety net for EVERY route, forever
userSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret.adminNotes; delete ret.suspendedReason;
    delete ret.shadowbanScore; delete ret.shadowbannedAt;
    delete ret.contentFrozen; delete ret.randomSeed;
    delete ret.pushSubscription; delete ret.lastLogoutAt;
    return ret;
  },
});
```
Plus an explicit `.select()` on the known offending route(s).

**#2's symptom set is bigger than an empty tab.** `AppShell.jsx` computes the unread badge from the same `matchData?.matches` — so it's *empty Letters tab AND a permanently dead badge*. And when fixing, verify `lastMessage.senderId` is a plain string at the same time, or the badge stays broken even after the shape fix.

## Suggested order within 1–4

1. **#2 first** — one-line fix (server returns `{ matches }` or client reads `.alignments`), un-breaks a core tab instantly.
2. **#1** — toJSON transform + select, kills the whole class.
3. **#3** — presence gate in `socket/chat.js` (a `Map<userId, Set<socketId>>` maintained on connect/disconnect, then skip `addToQueue(sendPush…)` when the recipient has a live socket — ideally scoped to "joined to this alignment's room" rather than merely online).
4. **#4** — depends on intent: either stop sending a fake `targetId` from `ProfileCard.jsx:876` or give the route a `targetType`. Either way, **un-swallow the 400** — silent catches are why this survived this long.

## One caveat before that table becomes "the list"

It's filtered to user-visible runtime bugs. **None of these from my server review are superseded** and they're all still open:

- `dotenv.config()` after imports → Cloudinary config dead in local `.env` dev
- `Block` missing `{ blocked: 1 }` index → collection scan on every deck build
- `multer 1.x` CVEs, with `legacy-peer-deps` actively pinning you there
- Plaintext OTPs in the DB
- CORS rejections *and* malformed JSON both surfacing as 500s
- `uncaughtException` exits without flushing Sentry; shutdown never calls `io.close()`
- `Report` unique constraint blocks second reports from the same user
- `x-new-token` header (probably removable — socket.io can read the cookie server-side)

Don't let the shiny table bury the dull ones — the multer CVE and dotenv ordering are five-minute fixes.

---

**On your AI's closing question:** no need to send corrections anywhere — you just did, and they're accepted. Tell it to start on #2 and #1, and if you paste `auth.js`, `messages.js`, `push.js`, and `Matches.jsx` over here I'll review the actual patches against the real code before they ship. 🔧

**Verification pass done — and it's a good thing you sent the dump, because the flagship new code contains a fatal error: the service worker is currently dead.** Everything else visible is excellent. Two real bugs, both one-liners. Ledger:

## 🔴 Bug A — `sw.js` has a syntax error → the ENTIRE service worker fails to load

In the new `notificationclick` handler:

```js
self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {   // ← not async
  ...
      await client.focus();   // ← await inside a non-async function = SyntaxError
```

`await` in a non-async callback is a **parse-time SyntaxError** — the whole `sw.js` file fails to evaluate, registration rejects, and the consequence chain is ugly:

- ❌ **Push notifications dead** (no SW = no push handler = no notification ever fires)
- ❌ Offline caching dead
- ❌ **The v2→v3 cache purge never runs** — the old caches full of users' voice notes and photos are *still sitting on devices*. The privacy purge everyone worked for is currently not happening, because the SW that would do the purging can't boot.

**Fix:**
```js
.then(async (clients) => {          // ← add async, that's it
```

**How to see it yourself:** DevTools → Application → Service Workers → red `SyntaxError: await is only valid in async functions` — or just push a test notification and watch nothing happen.

## 🔴 Bug B — the warm-app message channel points at the wrong listener

`AppShell` entry point 2 listens on `window.addEventListener('message')` — but messages sent from a service worker via `client.postMessage()` arrive on the **`navigator.serviceWorker` container**, not `window`. As written: notification tapped while the app is open → tab focuses → chat never opens.

**Fix:**
```js
useEffect(() => {
  const onMessage = (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type !== 'open-chat') return;
    openChatById(event.data.alignmentId);
  };
  // SW→page messages land here, NOT on window:
  navigator.serviceWorker?.addEventListener('message', onMessage);
  return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
}, [matchData, queryClient]);
```

Ironic footnote: the deep-link was one of my *first* client findings in this whole thread — the fix finally shipped and broke its own delivery mechanism. This is exactly what verification passes are for. 🎯

## ✅ Credit where due — this round's good work is genuinely good

- **The webhook raw-body fix is a deep catch.** The `req._body` mechanism, the cited body-parser source line, the realization that the moderation cleanup route has *never once worked* since birth — that's excellent forensics, and the `express.raw()` before `express.json()` fix is correct.
- **`QueryClientBridge`** beats my "move it to its own file" suggestion — context registration dodges the circular import cleanly.
- **The AppShell deep-link design** (read-once param, `replaceState` strip, two entry points, origin check) is right — just aimed one listener at the wrong target.
- **CSP localhost fix landed properly this time** — including the honest note that CSP `172.*` over-matches into public space and CORS is the real gate.
- Rate-limit comment math corrected exactly as flagged ✅

## 🟡 One verification item on the webhook — don't trust, test

Middleware order is now: `express.raw()` (webhook path) → `express.json` → **`mongoSanitize()`** — which runs on the webhook path too, with `req.body` as a **Buffer**. If express-mongo-sanitize walks and rebuilds that Buffer into a plain object, you get `[object Object]` round two — different cause, same dead signature check. **One end-to-end test with a properly signed Cloudinary payload settles it.** If it fails, scope the sanitizer off that path:

```js
app.use((req, res, next) => {
  if (req.path === '/api/upload/moderation-status') return next();
  mongoSanitize()(req, res, next);
});
```

## 🔍 Cut off from my view — confirm these landed

AuthContext's `logout()` (clear + disconnect + **login-side `socket.connect()` reconnect**) · `chat.js` `safe()` wrapper with the async-catch · discover `$sample` · SearchOverlay escape · push.js suspended check · queue hardening · accept-path block check · `seedEdgeCases.js` (does it also assert DB name, or just the purge flag?) · ArchivalToast (cut off mid-file — still never queued?)

**Still open, visible in this dump:** `user-scalable=no` in index.html · `/waitlist` outside QueryClientProvider.

## 👉 Do this now

1. Fix the two one-liners (async + listener target)
2. Reload → DevTools → SW registers clean → **Cache Storage shows only `matchalize-v3`** (that's the purge finally happening)
3. Test notification tap: cold start (new tab opens the chat) + warm app (open tab opens the chat)
4. Signed webhook payload → 200
5. Then the confirm list above

Two words (`async`, and one event target) stand between this build and everything working. 🚀
````

### ./solved.md

```
Here's the full picture 📋

## ✅ SOLVED — 5 fixes, all verified with proof

| # | Fix | Proof it works |
|---|-----|----------------|
| 1 | **Settings loading** — app read its config file too late before anything ran | Real Cloudinary URLs now come back from uploads |
| 2 | **Photo upload blocker** — removed the paid-plan feature (`aws_rek`) that was rejecting every upload | Test upload → `res.cloudinary.com/...` ✅ |
| 3 | **Freeze attack** — one crafted request could lock up the whole server forever | multer upgraded 1.4.5 → 2.4.0, audit warnings down |
| 4 | **Block lookup speed** — "who blocked me" used to read the entire blocks table | New index confirmed **live in the database** |
| 5 | **Login code scrambling** — 6-digit codes sat readable in the DB | DB row now shows only a fingerprint; mixed-case login test passed |

## 🔄 IN FLIGHT — patches written, not yet applied

| # | Fix | Waiting on |
|---|-----|-----------|
| **#5** | **Admin notes leak** — private staff notes sent to every user's browser | Your AI's lone-`+` projection test (report.js) |
| **#6** | **Environment posture** — server refuses to boot without a valid `NODE_ENV` | Apply + the 3 side steps (`.env`, `.env.test`, Render) |
| **#7** | **Rate-limit drift** — honest limit (500/5min), body size 10MB → 1MB | Apply + the 2 quick verify tests |


```

