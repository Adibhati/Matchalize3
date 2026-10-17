# Chunk 25 — Docs

> Matchalize · `docs` · files 25 of 27 chunks · 2 file(s) · 66 KB · ~19,339 tokens
> Generated 2026-10-17 21:10.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./HANDOFF.md`
> - `./ambitions/roulette.md`

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

````
# Roulette — Canonical Design Spec

```
Version:       2.0  (supersedes the v1 spec of 2026-10-10 in full)
Generated:     2026-10-16
Status:        Design approved in principle. NOT YET IMPLEMENTED.
Audited against: working tree on main @ 50c0095 (+ uncommitted changes present)
Method:        read-only source inspection. No app was started, no test run,
               no database touched, no external service contacted.
Cloudflare docs: verified 2026-10-16 (TURN service, Generate Credentials,
               FAQ, Analytics)

Companion documents:
  summary.md    app-wide engineering audit (backend, security, data, costs)
  summary2.md   Roulette architecture & staged design (superseded by this file
                where they differ — this file is canonical)
  summary3.md   UI / navigation inspection (identity leak map, z-order, journeys)

Legend:   [CONFIRMED] read in source · [INFERRED] reasoned · [UNKNOWN] needs runtime
```

**Plain-English note for the founder:** Section 1 is the product. Sections 4+ are
engineering. Nothing here is built yet — this file records what we have *decided* and
*verified*, so the next session can start from here without re-deriving anything.

---

## 1. PRODUCT MODEL

huh? has two ways to meet college students:

- **Deck** — discover people through profiles.
- **Roulette** — meet someone through a spontaneous, nearby-first video conversation.

Both can lead to the same saved chat system.

### 1.1 The central rule

> **Align means "let's stay connected." It does NOT automatically mean dating, and it does
> NOT automatically reveal a hidden profile.**

The v1 spec conflated three independent concepts into one. Version 2 separates them:

| Concept | Meaning | Triggered by |
|---|---|---|
| **Align** | "Let's stay connected" | Mutual accept → creates or returns a chat |
| **Dating** | Intent / compatibility | Matchmaking rules only |
| **Reveal** | "Show you my real profile" | Separate mutual action |

A saved connection can exist with **zero** profile access.

```text
Deck ─────── Accepted/mutual Align ─────────┐
                                           ↓
                                      Saved chat
                                           ↑
Roulette ─── Accepted/mutual Align ────────┘
                                           ↓
                            Optional mutual profile reveal
                            (profile-hidden connections only)
```

### 1.2 Visibility matrix — asymmetric by design

A visibility choice controls what **that person shares**. It never obligates the other
party to reciprocate.

| A | B | Result |
|---|---|---|
| Hidden | Hidden | Both use temporary names + generic avatars |
| Visible | Hidden | **B can view A's profile. A cannot view B's.** |
| Visible | Visible | Both profiles available |

Before a user switches to visible mode, show:

> "Students you meet can view your public profile, even if they keep theirs hidden."

### 1.3 The privacy promise we will actually make

**Use:**

> "Roulette does not display your profile until you choose to share it."

**Never use:**

> "Nobody can identify you."

Faces, voices, backgrounds, conversation content, and recognition from the Deck can all
identify someone. See §19 — this limitation must be disclosed *before* the user chooses
hidden mode, not buried in a policy.

---

## 2. NAVIGATION AND REQUEST PLACEMENT

### 2.1 Main navigation

```text
Deck       Chats       Roulette       Profile
```

**Rename the visible label only.** The internal `matches` tab key, the `['matches']` React
Query key, the `/api/alignments` endpoint, the `matches` response field, the `matches`
CSS classes, and the `matchalize_*` localStorage keys all stay as they are. Renaming them
is not required for the visible change and would risk regressions across ~30 files.

### 2.2 Inside Chats

```text
Chats
[Conversations]  [Requests · 3]
```

- **Conversations** — accepted connections from both discovery experiences.
- **Requests** — pending incoming requests. Each carries an origin label:
  **"From Deck"** or **"From Roulette"**.
- Source filters only if the list becomes hard to scan. Not essential for v1.
- An incoming Roulette Align also surfaces **inline during the active call**.
- All entry points refer to **one** underlying request — never duplicate copies.

### 2.3 Badge behaviour

| Badge | Counts |
|---|---|
| Conversations tab | Unread message counts |
| Requests tab | Pending incoming request counts |

- Accepting, declining, expiring, or blocking must update both counts consistently.
- Pagination **must** let users reach past the first page.

**[CONFIRMED] Two current bugs this plan fixes rather than inherits:**

1. `NotificationDrawer.jsx:47-48` calls `GET /notifications` with no params and ignores
   the returned `{total, page, totalPages, hasMore}`. The server defaults to `limit=20`
   (`notifications.js:81`). **A user with >20 pending requests can never reach the rest.**
2. The bell badge is incremented by socket (`Header.jsx:125-134`) but **never decremented**
   on accept or dismiss; the refetch only fires when the drawer closes
   (`Header.jsx:121-123`).

Also note the two badges use **different caps** today — `9+` at `Header.jsx:167` and
`99+` at `NavBar.jsx:254`. Unify on one cap.

### 2.4 Why this arrangement changes

**[CONFIRMED current state]** The Letterbox (`NotificationDrawer`, full-screen
`fixed inset:0 z1000`) and the conversation list (`Matches.jsx`, a tab) are **separate
surfaces**, and the requests bell renders **only on the Deck tab**
(`Header.jsx:150`). Settings renders **only on the Profile tab** (`Header.jsx:151`).
v2 deliberately collapses requests into Chats and leaves the bell as an optional
shortcut to the same Requests section.

---

## 3. VERIFIED CODE BASELINE

Everything below was read in source. This section exists so a future session does not have
to re-derive it — and so no one designs against an assumption that isn't true.

### 3.1 Navigation architecture

| Fact | Evidence |
|---|---|
| **There is no router.** `react-router-dom` is installed with **zero imports** | `client/package.json:22`; author comments at `AppShell.jsx:118-120`, `utils/chrome.js:23-25`, `sw.js:152-154` |
| Five screens via `useState`: `splash / auth / reverify / onboarding / home` | `App.jsx:18-30` |
| Four tabs via `useState` inside `home`. `activeTab` defaults to `'discover'`, **never persisted** | `AppShell.jsx:51,76` |
| **Tab switching fully unmounts the page** — `AnimatePresence mode="wait"` keyed on `activeTab` | `AppShell.jsx:266` (desktop), `:326` (mobile) |
| **Browser Back closes nothing.** Only 3 `window.history` calls exist app-wide | `AppShell.jsx:208`; `AccountSuspendedScreen.jsx:112-113` |
| That screen **traps** Back by re-pushing forever | `AccountSuspendedScreen.jsx:111-116` |
| Responsive breakpoint is a single `resize` listener at **768px** — no `matchMedia`, no debounce. Crossing it remounts the tree | `utils/useIsDesktop.js:4-20` |

### 3.2 The two facts that shape the call architecture

| Fact | Evidence | Consequence |
|---|---|---|
| **Chat and Settings are flat SIBLINGS of the page stage, not nested inside it** | `AppShell.jsx:347` vs `:333` (mobile); `:281` vs `:273` (desktop) | ✅ Opening a chat overlay does **NOT** unmount the page beneath it. A live call can survive opening chat — *if* chat is opened from the same tab. |
| **`Chat`'s own root claims the entire viewport unconditionally** — `position: fixed; inset: 0`, `zIndex: 50`, no width/height clamp | `Chat.jsx:1081` | ❌ Chat **cannot** be embedded in a smaller panel without a geometry change. It has no intrinsic way to be sized by a parent. |

Chat unmounts on close: draft text, scroll position, and pagination are all destroyed;
messages survive in the React Query cache (`App.jsx:105`, 2-min staleTime).

### 3.3 Socket layer

| Fact | Evidence |
|---|---|
| One socket file only — `server/socket/chat.js` (266 lines) | `server/socket/` |
| Auth reads cookie `matchalize_jwt` first, then `handshake.auth.token`. Identity attaches to **`socket.user`**, *not* `socket.data` | `chat.js:31-37,42-47`; `admin.js:328` depends on this |
| Socket auth loads the **full** User document with no projection, and does **not** enforce `lastLogoutAt` | `chat.js:43` vs `middleware/auth.js:86,103-106` |
| Per-event suspension recheck uses a **60-second cache** | `chat.js:12,93-118` |
| **There is ZERO socket rate limiting.** `express-rate-limit` is HTTP-only, mounted at `app.use('/api/')` | `index.js:374`; socket.io listens on `/socket.io/` |
| Only bound on socket traffic is engine.io's 1 MB `maxHttpBufferSize` | library default |
| **No adapter configured** — default in-memory `Adapter`. Multi-instance unsafe | `index.js:221-245` |
| **Load-bearing payload guard.** Never destructure in a handler parameter list; a destructuring throw becomes an `uncaughtException` that kills the process | `chat.js:151-162`; `index.js:568-576` |
| `user-typing` emits **`socket.user.name`** — the client-sent `userName` is discarded | `chat.js:169` vs `Chat.jsx:506` |

### 3.4 Data model facts

| Fact | Evidence |
|---|---|
| `Alignment` has **4 fields**: `pairKey`, `users`, `isActive`, `unlockedByInteractionId`. **No `origin`** | `server/models/Alignment.js` |
| `pairKey` is **unique per unordered pair** — a Deck align and a Roulette align for the same two people map to the **same row** | `Alignment.js:5-10` |
| ⚠️ **`Interaction` already has an `origin` field** with `enum: ['block','unmatch','pass']` | `Interaction.js:27-31` |
| `Notification` enum is `['new_letter','priority_telegram','new_align']` but **only `new_align` is ever written**; the other two are marked retired | `Notification.js:17-23`; sole writer `discover.js:1629-1634` |
| `Notification.interactionRef` is **required** | `Notification.js:26-31` |
| **No transactions anywhere.** MongoDB M0 and the local standalone mongod don't support them | verified; `render.yaml:74-75`; `MONGODB_URI` comment in `server/.env` |
| An existing **retry-on-conflict pattern** to reuse: `DECK_RACE_RETRIES = 2` + `isConcurrentDeckRace` | `discover.js:1488-1516` |
| `showCollege` is the **only** identity field with a working server-side strip | `publicCard.js:64-69`; `discover.js:1676-1679` |
| `name` and `photos` are on the `CARD_FIELDS` allowlist and **always sent** | `publicCard.js:14-18` |

### 3.5 The accept path — the defect this design must branch around

**[CONFIRMED]** `POST /api/notifications/:id/accept` (`notifications.js:112-272`) currently:

1. Block check **first**, returning an indistinguishable 404 (`:144-146`)
2. 410 `USER_UNAVAILABLE` if sender is suspended/deleted (`:149-152`)
3. Records an `accept_letter` Interaction (`:155-175`)
4. **Atomic** `Alignment` upsert on `pairKey` (`:177-193`)
5. **Unconditionally creates an `opening_letter` Message** (`:195-235`), reading
   `senderProfile.photos[idx]` (`:208-216`) and `p.question` / `p.answer` (`:217-223`)
6. Clears the notification (`:237-238`)
7. Socket `match-notification` + push (`:247-265`)

**Step 5 is the leak.** Accepting a hidden Roulette request through this path would copy
the hidden party's photo and prompt text into the chat — precisely what the feature exists
to prevent. See §5.

### 3.6 Identity leak map — 22 inline render sites, no shared component

**[CONFIRMED] There is no shared avatar / user-chip / name-label component.** Every surface
re-derives name and avatar inline. A temporary name introduced anywhere would not
propagate — and conversely a real name re-renders independently in 22 places.

**The four leaks that no UI work can fix:**

| Leak | Evidence |
|---|---|
| **Push lock-screen title is the sender's real name** | `messages.js:238` — `title: sender?.name` |
| **Typing indicator re-derives the name from the DB** | `socket/chat.js:169` |
| **`profile-updated` broadcasts real name + photos to EVERY socket** | `users.js:408-417` — `toPublicCard(user)` |
| **No server-side strip for `name`/`photos`** — only `showCollege` has one | `publicCard.js:64-69` |

Additional name-embedding push call sites: `discover.js:1649`, `notifications.js:260`,
`alignments.js:252`. (Only `report.js:142-145` is clean.)

Other surfaces: `Chat.jsx:745` (header), `Chat.jsx:196` (profile sheet),
`NotificationDrawer.jsx:117,337`, `Matches.jsx:304`, and critically
**`Matches.jsx:144` — the Chats search filters on the real name**, so a masked row is
still findable by typing its real name. `alt` / `aria-label` attributes carry names to
screen readers at `ProfileCard.jsx:1071`, `Matches.jsx:291`, `Chat.jsx:735,189`,
`NotificationDrawer.jsx:153`.

`_id` is **never displayed to any user** — only used as a React key, comparison, or URL
segment.

### 3.7 Three different partner-object shapes reach the same `<Chat>` component

| Entry path | Object shape | `age` | `pronouns` | `branch` |
|---|---|---|---|---|
| Chats row | alignments `$lookup` (`alignments.js:121`) | fresh (recomputed from `dob`) | ❌ not sent | ❌ not sent |
| Accept in Requests | notification populate (`notifications.js:93`) | **stale** — stored once at onboarding | ✅ sent | ❌ not sent |
| Deck match modal | `targetProfile` (`discover.js:1664-1684`) | ❌ **not sent at all** | ✅ sent | ❌ not sent |

Known rendering consequences: `branch` falls back to the literal `'General'`
(`Chat.jsx:199`); `intent` falls back to **three fabricated chips**
`['Long-term','Connection','Growth']` (`Chat.jsx:222`); `bio` is **sent but never
rendered** anywhere in `Chat.jsx`.

### 3.8 Deck eligibility — reusable, with one important omission

`discover.js:254-276` defines exactly seven conditions, **inline and unexported**:

```js
{ isOnboarded: true, isVerified: true,
  suspended: {$ne:true}, shadowbannedAt: null, isDeleted: {$ne:true} }
// + conditional: gender $in interestedIn
// + conditional: mutual interestedIn $or
```

**There is no `collegeCode` filter.** The Deck is platform-wide by deliberate decision
(`discover.js:245-253`). `?campusOnly` was removed on purpose (`User.js:352-365`).

⚠️ **`baseFilter` must be extracted to a shared module before Roulette can use it.**
Otherwise a shadowbanned user could pass Roulette's gate while failing the Deck's.
Proposed: `server/utils/eligibility.js`, used by both. Acceptance gate: the Deck response
must be byte-identical before and after extraction.

Also note the Deck **ignores live presence** — `_recency` uses the stale `lastActive`
timestamp (`:308-336`). Roulette must invert this: live presence is the whole point.

### 3.9 Deployment

| Fact | Value | Evidence |
|---|---|---|
| Plan | **`free`** — 15-min spin-down | `render.yaml:19` |
| Instances | 1 | no `numInstances` |
| Disk | none | no `disk:` key |
| WebSockets | supported on all Render tiers including free | Render pricing page |
| Cheapest always-on | `0.5c-512mb` = **$7/mo** | verified 2026-10-16 |

⚠️ **The free plan will kill live calls.** Roulette needs always-on sockets. This is a
Stage 0 prerequisite.

⚠️ **Upgrading compute ≠ adding instances.** Moving to `starter` keeps one process and
breaks nothing. `numInstances: 2+` breaks presence, deck locks, real-time message
delivery, and every rate limiter simultaneously — there is no Redis adapter.

---

## 4. SCHEMA PROPOSAL

### 4.1 Naming collision — resolve first

`Interaction.origin` already exists with `enum: ['block','unmatch','pass']`
(`Interaction.js:27-31`). Putting `origin` on `Alignment` meaning `'deck'|'roulette'`
creates two unrelated fields with the same name.

> **Decision: use `source` everywhere. Never `origin`.**

### 4.2 `Alignment` — additions only

```js
// ① INITIAL CONNECTION SOURCE — provenance only. NEVER authorizes access.
source: { type: String, enum: ['deck','roulette'], default: 'deck' }

// ② DIRECTIONAL PROFILE-ACCESS PERMISSIONS — the authorization truth.
//    Absence of a grant = no access. Fail-closed by construction.
profileGrants: [{
  viewerId:  { type: ObjectId, ref:'User', required:true },  // who may look
  subjectId: { type: ObjectId, ref:'User', required:true },  // at whose profile
  source:    { type: String,
               enum: ['legacy','deck','roulette_visible','roulette_reveal'],
               required:true },
  grantedAt: { type: Date, default: Date.now }
}]

// ③ STABLE CONVERSATION NICKNAME — copied once at creation, never mutated.
conversationAliases: [{
  userId: { type: ObjectId, ref:'User', required:true },  // this person
  alias:  { type: String, trim:true, maxlength:24 }      // as the OTHER party sees them
}]

// ④ REVEAL-REQUEST STATE — single-document atomic state machine.
revealRequest: {
  state:       { type: String,
                 enum: ['none','pending','accepted','declined','expired'],
                 default: 'none' },
  requestedBy: { type: ObjectId, ref:'User' },
  requestedAt: Date,
  resolvedAt:  Date,
  consents:    [{ type: ObjectId, ref:'User' }]   // accumulated atomically
}
```

**Index to add:** `{ 'profileGrants.viewerId': 1, 'profileGrants.subjectId': 1 }`

### 4.3 `Notification` — additions only

```js
// ⑤ INDIVIDUAL REQUEST SOURCE + call-scoped expiry
source:        { type: String, enum: ['deck','roulette'], default: 'deck' },
callSessionId: { type: String, default: null },   // roulette only — enables expiry sweep
expiresAt:     { type: Date,   default: null },   // null = never expires (Deck)
```

`type: 'new_align'` is reused for both origins. `interactionRef` stays required.

### 4.4 `Interaction` — additions only

```js
source: { type: String, enum: ['deck','roulette'], default: 'deck' }
```

### 4.5 The uniform resolver — one rule, no special cases

```
canViewProfile(viewerId, alignmentId):
    partner := the other user in alignment.users
    return exists grant { viewerId, subjectId: partner }     // ← the ONLY rule

displayNameFor(viewerId, alignmentId):
    1. partner's alias in conversationAliases  → use it
    2. partner has a grant for viewer          → partner's real name
    3. otherwise                               → neutral generated label (never real name)
```

| Case | Alias? | Grant? | Result |
|---|---|---|---|
| Legacy Deck connection | no | yes (backfilled) | **real name** — behaviour unchanged |
| New Deck connection | no | yes | **real name** — behaviour unchanged |
| Hidden Roulette, pre-reveal | yes | no | **call name** |
| Revealed Roulette | yes | yes | **call name** in the list; real name in the profile sheet |
| Any row with a missing field | — | — | **no access, neutral label** — fail-closed |

**Why backfill rather than a legacy special case:** a special case keyed on
`source == null` becomes an accidental access grant the instant a new row is written
without `source`. A backfilled grant table has no such hole. This satisfies "missing
fields must not accidentally grant access" **structurally**, not by convention.

### 4.6 Existing-data defaults

`server/scripts/` already holds 12 migration scripts — this follows the house pattern.

| Field | Existing rows | New hidden Roulette rows |
|---|---|---|
| `Alignment.source` | `'deck'` | `'roulette'` |
| `Alignment.profileGrants` | **2 grants backfilled**, `source:'legacy'`, one per direction | **empty** |
| `Alignment.conversationAliases` | **absent** — real name shown, unchanged | **both parties' call names**, copied once |
| `Alignment.revealRequest.state` | `'none'` | `'none'` |
| `Notification.source` | `'deck'` | `'roulette'` |
| `Notification.expiresAt` | `null` | set to the call-end deadline |
| `Interaction.source` | `'deck'` | `'roulette'` |

**Rollback:** the migration is additive — `unset` the new fields.

### 4.7 Atomicity without transactions

⚠️ MongoDB M0 and the local standalone `mongod` do **not** support multi-document
transactions. Verified: none are used anywhere today.

Every transition must therefore be a **single-document atomic `findOneAndUpdate`** whose
filter includes the expected prior state. On no match → re-read and retry, bounded.

This is already an established pattern: `discover.js:1488-1516`. **Reuse it rather than
inventing a second mechanism.**

---

## 5. ACCEPT BRANCHING — Roulette must not copy profile content into messages

| `Notification.source` | Alignment creation | Opening letter | Push |
|---|---|---|---|
| `deck` | existing upsert (`:177-193`) | **existing behaviour** (`:195-235`) | unchanged |
| `roulette` | same upsert + `source:'roulette'` + `conversationAliases` + **no grants** | **NONE** | must not embed a name |

The accept endpoint returns `{ success, alignmentId, origin }` so the client renders the
correct disclosure.

**[CONFIRMED] also fix while here:** the 410 `USER_UNAVAILABLE` path is currently a
**silent no-op** — `NotificationDrawer.jsx:70-72` only `console.error`s. The client
pre-disables Accept when the sender is suspended/deleted (`:181`), but a suspension that
lands after the drawer loaded produces a dead button with no feedback.

---

## 6. PRIVACY ENFORCEMENT LEDGER

Incremental enforcement: each surface is fixed **before the relevant data can reach a
partner**. Stages 2–6 never touch the existing chat surfaces, because no hidden connection
can exist there until Stage 7.

| # | Surface | Leaks | Enforced by |
|---|---|---|---|
| 1 | New roulette signaling events | — | Stage 1 contract → Stage 3 code |
| 2 | `NotificationDrawer` row (`:117-118`) | `sender.name`, `photos[0]` | **Stage 8** |
| 3 | `GET /api/alignments` payload (`:121`) | `name`, `photos`, `interestedIn`, `intent` | **Stage 8** |
| 4 | `Matches.jsx:304` row name | real name | **Stage 8** |
| 5 | `Matches.jsx:144` search filter | **real-name correlation leak** | **Stage 8** |
| 6 | `Chat.jsx:745` header | real name | **Stage 8** |
| 7 | `ChatProfileView` (`Chat.jsx:196`) | full profile, unguarded | **Stage 8** |
| 8 | `socket/chat.js:169` typing | name from `socket.user` | **Stage 8** |
| 9 | Push `messages.js:238` | **name as lock-screen TITLE** | **Stage 8** |
| 10 | Push `notifications.js:260` | name in body | **Stage 8** |
| 11 | `profile-updated` broadcast (`users.js:408-417`) | name + photos to **every** socket | **Stage 8** |
| 12 | Avatar `alt` texts (4 sites) | name to screen readers | **Stage 8** |
| 13 | Accept → opening letter | photo + prompt text | **Stage 7** |

**Rows 2–13 are Stage 8's acceptance gate.** A hidden connection cannot be created in the
shared Chats list until they are all contract-compliant.

---

## 7. ALIGN REQUEST LIFECYCLE

### 7.1 Sending

```text
Send Align?

If they accept, you can keep chatting.
Your hidden profile will stay hidden.

[Send Align]   [Cancel]
```

Adapt the wording when the sender is already using a visible profile.

### 7.2 Receiving

```text
Moonwalker wants to stay connected.
[Accept]   [Not now]
```

On acceptance:
- Creates or retrieves **one** saved connection
- Makes its chat available
- **Does not reveal a hidden profile**
- **Does not end the video**
- Shows "You're aligned. Your chat is ready."

### 7.3 Precedence rules — APPROVED

> **A saved connection survives only if the server completes mutual acceptance before the
> session closes. A still-pending request expires when the call closes. Late accepts are
> rejected as expired. Duplicate or simultaneous accepts must return one connection/chat.
> Use server-owned state transitions and test the races.**

| Rule | Implementation |
|---|---|
| Survival | Accept transaction must commit **before** session close |
| Expiry | On call end, mark still-pending requests cleared + `expiresAt` passed |
| Late accept | Accept endpoint checks `expiresAt`; past → `EXPIRED`, no Alignment created |
| Idempotency | Accept filters on `isCleared:false`; a second call finds nothing and returns the **same** `alignmentId` rather than erroring |
| Race resolution | Single atomic `findOneAndUpdate` on `pairKey` (`notifications.js:177-193` already does this) |

### 7.4 First-version request policy

- One active request per pair per current conversation
- No repeat requests after a decline in that conversation
- **Pending requests expire when the call ends**
- Accepted connections persist
- Simultaneous outgoing requests **count as mutual acceptance**, provided both send
  actions included the disclosure
- The server resolves accept-versus-leave races
- Expired or declined requests **cannot** unlock chat or identity
- No new Align request after someone skips

The shared Requests section may show a pending live request, but its state must update
**immediately** when the call ends.

**Missed connections are out of scope for v1.**

---

## 8. REVEAL STATE MACHINE

### 8.1 Before reveal

The saved conversation shows:
- Stable conversation nickname
- Generic avatar
- "Profile hidden."
- Messages
- A separate **"Share profiles"** action

### 8.2 Transitions (all single-document atomic)

```text
        A requests
none ──────────────► pending   consents=[A]
  ▲                     │
  │                     │ B accepts (or A+B request simultaneously)
  │                     ▼
  │                  accepted   consents=[A,B]  → create 2 grants atomically
  │                     │
  │                     ├──► declined   (B declines)
  │                     │       └─► new request allowed once; no repeat pressure
  │                     │
  │                     └──► expired    (7 days)  → same
```

| Transition | Atomic predicate | Result |
|---|---|---|
| request (none) | `revealRequest.state ∈ {none, declined, expired}` | `pending`, `consents=[me]` |
| request (pending, other) | `state==='pending' && requestedBy != me` | **immediately** `accepted`, `consents=[both]` |
| accept | `state==='pending' && !consents.includes(me)` | push me to consents; if `consents` has both → `accepted` + 2 grants |
| decline | `state==='pending'` | `declined`, `resolvedAt` |

On acceptance:
- Update the connection's reveal permissions
- Show approved profile names/photos
- Allow opening the public profile
- Keep the small historical nickname label in the list

On rejection or expiry:
- Continue the hidden-profile chat
- **Do not** repeatedly pressure the recipient
- **Do not** automatically close the connection

**For visible/hidden connections:** explain that the already-visible profile has already
been shared; the remaining hidden participant must still explicitly consent.

### 8.3 Shared fields

Reveal only approved public-profile fields. **Never** email, full DOB, precise location,
security information, or moderation history.

Unmatching or blocking removes access **through the connection**, but cannot erase what
someone has already seen or saved elsewhere. State this honestly in the UI.

---

## 9. CROSS-ORIGIN INTERACTIONS

### 9.1 Existing connections meeting in Roulette — APPROVED

| Rule | Detail |
|---|---|
| An existing active Deck connection **may** meet in Roulette if otherwise eligible | |
| Do **not** duplicate its chat | `pairKey` is unique per pair, so this is automatic |
| Do **not** send a new Align request | |
| **Preserve existing profile permissions** — hidden mode does **not** revoke previously granted access | |
| Show **"You're already connected"** with **Open Chat** | |
| **Exclude previously unmatched pairs** pending a separate reconnection policy | |
| **Blocked pairs must never be matched** | Absolute, checked at pair time |

### 9.2 Hidden Roulette contact later encountered through Deck

`pairKey` is unique per unordered pair, so this is the **same Alignment row**. `source`
stays `'roulette'` (provenance, immutable), and `profileGrants` is the authorization truth
— which is exactly why §4.5's resolver has no `source` special case.

**Policy: hidden mode is scoped to Roulette conversations.** If the same person appears in
your Deck later, you see their normal public profile — that is how Deck works, and it is
unrelated to the connection. **This must be disclosed before the user picks hidden mode**
(§19).

**What we do NOT do:** silently upgrade permissions, or silently reveal identity through a
second surface.

**Account-ID correlation limitation, stated plainly:** the server can trivially correlate a
hidden session to a user record — that is unavoidable and not a defect. What this design
prevents is **the partner** learning the identity. If someone screenshots a video and
recognises you from the Deck, **no system prevents that, and we must not claim it does.**

---

## 10. NEARBY-FIRST PARTNER SELECTION

### 10.1 Candidate pool

Only consider students who:

- Explicitly pressed Start
- Are **currently connected and ready**
- Meet eligibility requirements (§3.8, extracted to a shared module)
- Are **not already assigned** to another call
- Are **not blocked in either direction**
- Satisfy the agreed intention/preferences
- Fall within **both** participants' accepted search scope

> **Never make an online Deck user callable unless they joined Roulette.**

### 10.2 Location source

- Use recent, consented **coarse** location where available — the existing helpers already
  round to 2 dp (~1.1 km) before storage (`geo.js:96-103`)
- Otherwise offer **college-area matching**, described honestly — *not* as "your current
  location"
- **Never** display coordinates or precise distances. The Deck already returns a band
  label only (`geo.js:77-82`); reuse that

### 10.3 Selection order

Within the eligible nearby pool:

1. Give meaningful priority to **waiting time**
2. Prefer **proximity** among reasonably comparable candidates
3. **Randomize** selection
4. Avoid **recently met** partners where alternatives exist

Do not always choose the closest person, and do not repeatedly deprioritize someone because
their campus is farther away.

*Rationale:* strict FIFO makes one user wait for everyone in turn. Instead, take the
longest-waiting ~30% as the candidate band, then choose randomly within it using distance
and repeat-penalty.

### 10.4 No nearby partner

```text
Nobody compatible nearby right now.

[Keep waiting]   [Search farther]   [Leave]
```

**No silent nationwide expansion.** The initial distance and expansion bands are
configurable **test settings**, not established ideal distances.

### 10.5 Tiny testing pool

- **Blocks are never relaxed.**
- Recent-partner avoidance is **not** a permanent block.
- If recent partners are the only options, explicitly offer repeat matching.
- **Do not hardcode a 24-hour exclusion** that makes two-account testing impossible.

### 10.6 Intention: Social / Dating / Either

Use **one** matching mechanism with compatibility rules, not three isolated queues.

| Combination | Behaviour |
|---|---|
| Social + Social | Social conversation |
| Social + Either | Social conversation |
| Dating + Dating | Allowed only if mutual dating preferences fit |
| Dating + Either | Allowed only if mutual dating preferences fit |
| Social + Dating-only | **Do not pair** |
| Either + Either | Social connection possible; romantic compatibility checked separately |

- For **Social**, explain there is no assumption of romantic interest.
- For **Dating**, use explicit reciprocal preferences. **Do not** infer compatibility from
  gender alone or from the word "Either."
- **Do not expose** someone's private preference settings to their partner.
- Changes to intention take effect on the **next search**, never mid-call.

⚠️ **[CONFIRMED]** `interestedIn` and `intent` are **currently in the alignments payload**
(`alignments.js:121`) — they already reach the client. They must be **stripped**, not just
hidden in the UI.

---

## 11. CALL LIFECYCLE

### 11.1 Required states

```text
Idle → Preview → Searching → Pairing → Connecting
                                         ↓
                                     Connected
                                         ↓
                            Ended → Ready / Search again
```

Plus recovery states for: **permission denial**, **connection failure**, **temporary
interruption**, **already connected**, **capacity reached**.

### 11.2 Call ownership

> **Keep call state outside disposable tab/page components.**

**[CONFIRMED reason]** tab changes unmount pages (`AppShell.jsx:266,326`) while the Chat
overlay is a sibling that leaves the underlying page mounted (`AppShell.jsx:347` vs `:333`).

So call state must live **above** `renderPage()` — alongside `activeChat` and
`settingsOpen` in `AppShell`, or in a provider wrapping it. **Not** inside the page
component.

### 11.3 Required safeguards

| Safeguard | Note |
|---|---|
| One active Roulette session per account | |
| Authorized call IDs and signaling | Server-generated sessionId; room membership server-granted only |
| **Socket-event validation and rate limits from Stage 3** | ⚠️ **none exist today** |
| Atomic pairing — nobody assigned twice | Compare-and-set on the waiting entry |
| Late signals from old calls rejected | Every event carries `sessionId` |
| Camera/microphone cleanup | `track.stop()` on unmount, `pagehide`, tab close, skip, leave |
| Disconnect, refresh, tab-close handling | Re-queue partner with **original** wait start preserved |
| Block/ban checks at entry **and** at pairing | ⚠️ the 60 s socket suspension cache (`chat.js:12`) means a fresh check is needed at pair time |
| In-call report / block / leave | |
| Post-call reporting **without** granting contact or profile access | |

### 11.4 Next behaviour

- **Next** ends the current call and searches again **for the person pressing it**.
- The other person returns to a clear **"Conversation ended"** state with **"Find next"**.
- Automatic next-search can be opted into later.
- **Reporting or blocking never automatically reconnects someone to the reported person.**

### 11.5 Navigation during a call (v1)

- Opening the current call's chat **does not end the call**.
- Attempting another main tab prompts **"Leave this call?"** → confirm ends the call before
  navigating; cancel preserves it.
- **Back closes an open panel first**, then offers to leave the call.
  ⚠️ **[CONFIRMED] browser Back currently does nothing app-wide** — this must be built.
- **Do not promise background video** while the browser or phone is locked. On iOS
  backgrounding **drops the call** — no fix.

---

## 12. VIDEO ARCHITECTURE AND QUALITY

### 12.1 Architecture

```text
Your backend:
  eligibility + queue + pairing + signaling + session rules

Media:
  A ↔ B directly where possible          (free)
  or
  A ↔ managed TURN ↔ B                  ($0.05/GB after 1,000 GB free)
```

**No SFU.** Cloudflare's own documentation: *"If your use case is one-to-one
communication… TURN by itself is usually sufficient. Adding an SFU is unnecessary
complexity for that topology."* (verified 2026-07-14)

**Why a relay does not give moderation.** WebRTC media is DTLS-encrypted end to end.
Cloudflare: *"Cloudflare cannot access the contents of the media being relayed… only
relays encrypted packets and cannot decrypt or inspect the media content."* **Buying TURN
does not buy moderation.**

### 12.2 Cloudflare TURN — verified 2026-10-16

| Protocol | Address | Ports |
|---|---|---|
| STUN/UDP | `stun.cloudflare.com` | 3478 |
| TURN/UDP | `turn.cloudflare.com` | 3478, 443 |
| TURN/TCP | `turn.cloudflare.com` | 3478, 80 |
| TURN/TLS | `turn.cloudflare.com` | 5349, 443 |

**Credential generation — server-side only.**

```
POST https://rtc.live.cloudflare.com/v1/turn/keys/{TURN_KEY_ID}/credentials/generate-ice-servers
Authorization: Bearer {TURN_KEY_API_TOKEN}
Content-Type: application/json

{"ttl": 86400}
```

Returns **201** with a ready-to-use `iceServers` array, passed straight to the browser.

| Requirement | Detail |
|---|---|
| Provider API secret | Server-side env only. **Never** `VITE_*`, never in a client bundle |
| Credential TTL | **Short-lived.** Max 48 h; on expiry Cloudflare **stops billing immediately**, then disconnects. Refresh via `setConfiguration()` |
| Issuance endpoint | Behind `protect` + its own rate limiter |
| Revocation | `POST …/credentials/{USERNAME}/revoke` → 204, stops billing instantly |
| Custom identifiers | Tag each TURN username with userId → per-user accounting + abuse detection |

**Constraints that affect design:**

| Constraint | Impact |
|---|---|
| Max TTL 48 h | Long sessions need credential refresh |
| ">50% of issued credentials should be used" | Over-issuing may be throttled |
| **IPv6: relay addresses are IPv4-only** | An IPv6-only peer can only achieve **one-sided** relay. Expected on some mobile networks |
| No RFC6062 TCP relay | A browser blocking UDP entirely cannot connect via TURN |
| Per-allocation limits: >5 new IPs/sec, >5–10 kpps, >50–100 Mbps | **Per call, not account-wide.** No single call can abuse |
| ICE restart | Explicitly recommended for maintenance resilience |

**Do not create an account or enable chargeable usage without explicit approval.**

### 12.3 Peer IP exposure

In a direct P2P call, WebRTC ICE typically reveals a host or STUN-reflexive IP to the peer
unless a TURN-only policy is enforced. **The current architecture addresses this nowhere**,
because there is no architecture yet. If peer-IP privacy matters, TURN-only for media is
the standard answer — at full bandwidth cost (no free direct path).

### 12.4 Managed vs self-hosted coturn

| | Cloudflare managed | Self-hosted coturn |
|---|---|---|
| Setup | Zero infrastructure | Provision VPS, ports, TLS, firewall |
| Edge latency | Anycast, ~300+ cities | Single region |
| Ops burden | None | Patches, abuse, monitoring |
| Cost | $0.05/GB after 1 TB free | VPS + bandwidth, region-dependent |
| Best when | You don't want to run infrastructure | Flat predictable cost at large scale |

**Recommendation: Cloudflare managed for the pilot.** One founder, free-tier
infrastructure, zero measurement history. Revisit around ~5M relayed minutes/month.

### 12.5 Quality settings to test

| Setting | Value | Note |
|---|---|---|
| Video ideal | **480p** (640×480) | |
| Video max | **720p** (1280×720) | |
| Frame rate | 24 fps ideal, 30 max | 24 is plenty for faces |
| Video bitrate ceiling | **800 kbps** @480p, **1.2 Mbps** @720p | via `maxBitrate` — resolution ≠ bitrate |
| Audio | Opus, **mono**, 32 kbps, `useinbandfec` | Stereo is wasted for speech |
| Adaptive ladder | drop to 360p on loss; audio-only if sustained loss >5% | hysteresis to avoid oscillation |
| Audio-only fallback | **A feature, not a failure.** Show a clear notice | |

> **No automatic quality downgrade solely because TURN was selected.** Use measured
> conditions and an explicitly approved cost policy.

**Do not present a fixed "cost per resolution" as measured fact.** Quality, duration,
one-/two-sided TURN, audio, and overhead assumptions must be stated separately. No call has
ever been placed, so **no bandwidth figure in this document is measured.**

Illustrative arithmetic only — **GB per relayed call-minute ≈ bitrate_Mbps × 0.9 ÷ 60**,
with the free 1,000 GB/month allowance applying before $0.05/GB overage. Two people
talking 15 minutes is **15 call-minutes**, not 30 — do not double-count participant-hours.

---

## 13. TEST-SETTINGS TABLE

**These are test settings. None is a commercial allowance or proven capacity.**

> **Roulette stays disabled until every required value is explicitly configured.**

| Setting | Env var | Test default | Rationale |
|---|---|---|---|
| Feature switch | `ROULETTE_ENABLED` | **`false`** | Must be explicitly `true` |
| Test account allowlist | `ROULETTE_TEST_ACCOUNTS` | **empty = nobody may queue** | Prevents a real account reaching a live queue |
| Max concurrent calls | `ROULETTE_MAX_CONCURRENT` | **5** | Founder-specified |
| Max queue size | `ROULETTE_MAX_QUEUE` | 25 | Bounds memory; overflow gets "busy" |
| Max wait | `ROULETTE_MAX_WAIT_SEC` | 300 | Then offer leave |
| Connection timeout | `ROULETTE_CONNECT_TIMEOUT_MS` | 20000 | |
| Pairing-offer validity | `ROULETTE_PAIR_TIMEOUT_MS` | 45000 | |
| Long-call policy | `ROULETTE_TEST_CALL_CEILING_MS` | **7200000 (2 h)** | **Runaway guard only**, deliberately far above any plausible product cap. A separate 30-min soak test proves no leak or stall |
| TURN credential TTL | `ROULETTE_TURN_TTL_SEC` | 3600 | Well under Cloudflare's 48 h max |
| Credential issuance | `ROULETTE_ICE_PER_HOUR` | 10 | Per user. Farm defence |
| Emergency disable | `ROULETTE_ENABLED=false` | — | Refuses new pairs, emits `call:terminated`, revokes TURN credentials |

### 13.1 Honest limits of the kill switch

- A **billing alert is not a spending cap.** Real protection is the concurrency cap +
  duration ceiling + admission control.
- **Stopping new pairings does not stop cost on existing calls.** Media already flowing
  continues until both sides stop.
- Revoking TURN credentials stops egress billing **immediately** — but the call dies.
- ⚠️ **A signaling command cannot guarantee termination of a modified client's direct media
  connection.** With P2P, the server cannot force a peer to stop sending. This is inherent
  to peer-to-peer media and must be described accurately, not papered over.

---

## 14. MODERATION

- Reports enter the existing review workflow.
- Preserve reporting context **without revealing profiles** to the other participant.
- **Review how the existing report-count escalation interacts with Roulette.**
  ⚠️ **[CONFIRMED] current behaviour: 3 reports → shadowban, 5 → suspension, with no human
  review** (`report.js:65-82`). **Do not introduce permanent sanctions solely from an
  unreviewed threshold without an approved policy.**
- ⚠️ **[CONFIRMED] the QA harness deliberately seeds one persona with `shadowbannedAt` and
  `contentFrozen: true`** (`seedSociety.mjs:169-172`) — automated shadowbans already appear
  in test data.
- **If safety controls fail, disable Roulette — not the controls.**

**No recording, face recognition, content uploads, or sampled-frame submission is
approved.** Neither is anything that resembles them by implication.

---

## 15. STAGED PLAN

| Stage | Build | Gate — must be **proven**, not asserted |
|---|---|---|
| **0** | Baseline: commit current work, regenerate dumps, record test-settings table. **Upgrade Render to always-on** | CI green; `ROULETTE_ENABLED=false`; no prod/test mixing |
| **1** | **Schema + privacy contract + resolver + migration script** | Resolver unit tests pass; backfill reversible; **no code path reaches a partner yet** |
| **2** | Camera preview, permission denial, track cleanup | Denial handled; `track.stop()` verified on unmount, `pagehide`, tab close |
| **3** | Authorized two-device call, **manual pairing**, STUN only | Only paired users exchange signaling; **malformed socket events do not crash the process** |
| **4** | TURN fallback + route measurement | Direct / forced-relay / restrictive-network all classified; secret server-side; credential endpoint auth'd + rate-limited |
| **5** | Nearby-compatible queue | All §16 queue tests pass |
| **6** | Skip / recovery / safety | No orphaned sessions; report/block ends the call; camera cleanup on every exit path |
| **7** | **Roulette Align + accept branching** | No opening letter for roulette source; expiry / decline / simultaneous-accept races pass |
| **8** | **Unified Chats/Requests + embedded panel** | **Ledger rows 2–13 all compliant**; one inbox; call survives panel; Deck flows unregressed |
| **9** | Mutual profile reveal | No reveal before consent; asymmetric matrix correct; every identity surface updates |
| **10** | Device / load / private pilot | Measured reliability, wait time, relay %, capacity |

**Stage 1 scope clarification:** Stage 1 means *define the privacy contract, schema, and
tests first.* It does **not** mean finishing a sweeping rewrite of all UI components before
testing a camera preview. Privacy changes are implemented **incrementally, before the
relevant data can reach a partner** — see §6.

**Every stage:**
- Keep the feature behind a flag
- Use isolated testing data
- Report tests **actually run**
- Keep a rollback path
- **Do not silently alter Deck behaviour**
- **Do not proceed past a gate with failures outstanding**

**Must not regress:** profile discovery, matching, messaging, login, reporting, blocking.

### 15.1 Files likely touched

| Stage | Server | Client |
|---|---|---|
| 1 | `models/Alignment.js`, `models/Notification.js`, `models/Interaction.js`, `utils/eligibility.js`, `utils/partnerView.js`, `scripts/migrate-roulette-source.mjs`, `tests/` | — |
| 2–4 | `socket/roulette.js`, `routes/roulette.js`, `utils/cloudflareTurn.js` | `pages/Roulette.jsx`, `utils/webrtc.js`, `utils/callState.jsx` |
| 5–6 | `socket/rouletteQueue.js` | `components/Roulette*.jsx` |
| 7–9 | `routes/notifications.js`, `routes/alignments.js`, `socket/chat.js`, `utils/push.js`, `routes/users.js` | `pages/Matches.jsx`, `components/NotificationDrawer.jsx`, `pages/Chat.jsx`, `components/AppShell.jsx` |

---

## 16. ACCEPTANCE TESTS

### 16.1 Race tests

| ID | Setup | Action | Assertion |
|---|---|---|---|
| **R1** | A,B paired | Both send Align; both accept in the same tick | **Exactly 1** Alignment, **1** chat, **same** `alignmentId`; zero duplicate grants |
| **R2** | A sends Align | Call ends, then B accepts 1 s later | Rejected `EXPIRED`; **no** Alignment created |
| **R3** | A sends Align | B accepts and call closes simultaneously | Accept either commits before close (**survives**) or after (**expires**). Never both, never neither |
| **R4** | Not paired | A sends Align twice | One request row; second returns the same `notificationId` |
| **R5** | Hidden → revealed | Both send reveal simultaneously | Single `accepted` state; **exactly 2** grants, created once |
| **R6** | Reveal declined | Same person requests reveal again in the same connection | Rejected — no repeat pressure |

### 16.2 Queue tests

| ID | Setup | Action | Assertion |
|---|---|---|---|
| **Q1** | A in queue | A double-taps Start | One queue entry, one session, one partner |
| **Q2** | A,B compatible | Match runs | Neither assigned twice |
| **Q3** | A blocked by B | Both wait | **Never paired** — checked at pair time, not just queue time |
| **Q4** | Small pool | Only recent partners available | Explicit "meet X again?" offered; **not** a silent hard block |
| **Q5** | No compatible partner | Wait | "Nobody compatible nearby right now" + 3 options; **no** automatic expansion |
| **Q6** | A skips B | B's session ends | "Conversation ended · Find next"; **no** new Align to A |
| **Q7** | A unmatches B | Both later in Roulette | **Never paired** |
| **Q8** | A,B already connected | Both in Roulette | Allowed; **no duplicate**, **no new Align**, "You're already connected · Open Chat"; existing grants preserved |

### 16.3 Privacy contract tests

| ID | Setup | Action | Assertion |
|---|---|---|---|
| **P1** | Hidden A,B paired | Inspect every partner-facing payload | **Zero** occurrences of A's real `name`, `photos[]`, `college`, `email`, `dob` |
| **P2** | Hidden connection | A opens chat | Header shows **call name**; profile control **absent**, not merely disabled |
| **P3** | Hidden connection | A types | Remote receives **no** name in the typing event |
| **P4** | Hidden connection, B offline | Send message | Push **title and body** contain no real name |
| **P5** | Hidden connection | A types B's real name in Chats search | **No result** |
| **P6** | Hidden connection | Any profile-update save | `profile-updated` payload contains no real identity for a hidden partner |
| **P7** | Hidden request accepted | Inspect chat messages | **Zero** opening-letter rows; no copied photo/prompt text |
| **P8** | A visible, B hidden | Each views the other | A's profile reachable by B ✅; **A cannot** view B ✅ |
| **P9** | Mutual reveal accepted | Both open profiles | Real name + photos appear; **2** grants exist; row label stays the call name |
| **P10** | Screen-reader sweep | Hidden connection | No `alt` / `aria-label` contains the real name |
| **P11** | Blocked pair | Any payload path | Neither name reaches the other, **including** push |

### 16.4 Call-safety tests

| ID | Action | Assertion |
|---|---|---|
| **C1** | Malformed / empty payload on every roulette socket event | Server survives; handler returns silently (pattern `chat.js:151-162`) |
| **C2** | Late ICE candidate from a prior `sessionId` | Rejected |
| **C3** | Socket dies without clean disconnect | Reaped within the reaper interval; partner re-queued with **original** wait start |
| **C4** | Refresh mid-call | Camera stops; partner returned to READY |
| **C5** | Network change mid-call | ICE restart; recover or cleanly end |
| **C6** | Report during call | Call ends immediately; reported user **never** re-paired |
| **C7** | Block during call | Call ends immediately; removed from any queue |
| **C8** | Open chat panel during call | **Call continues** — verified: Chat is a sibling (`AppShell.jsx:347` vs `:333`) |
| **C9** | Switch tab during call | "Leave this call?" → confirm ends, cancel preserves |
| **C10** | Back with panel open | Closes panel first, then offers to leave |

### 16.5 How to verify

| Type | Covers | How |
|---|---|---|
| Unit / integration | R1–R6, Q1–Q8, P1, P7, P8 | `node:test` files in `server/tests/` |
| Two devices | Q2, Q8, C2–C10 | Two real phones/laptops |
| Network | C5, TURN path | One device campus Wi-Fi, one on mobile data |
| Payload inspection | P1, P3–P6, P10, P11 | `curl` + socket client + devtools Network tab |
| Comprehension | §19 | Fresh testers |

⚠️ **P1 and P3–P6 cannot be verified from the client alone** — they require inspecting raw
server responses and push payloads.

---

## 17. UNRESOLVED DECISIONS

| # | Question | Recommendation |
|---|---|---|
| **1** | **Hidden-Roulette pair later aligns on the Deck.** Same `pairKey` → same row. Does a Deck align grant access, overwriting hidden state? | **No silent upgrade.** Keep `source` immutable; require the hidden party to explicitly accept a "share profiles" request. Otherwise "Profile hidden" breaks by using the app normally |
| **2** | Should a Roulette Align permanently suppress that person's Deck card? | **Yes** — reuse the permanent-`archive` Interaction |
| **3** | Conversation nickname: one shared, or one per viewer? | **One shared for v1.** Decision 9.1 removes the rename hazard |
| **4** | Reveal-request expiry window? | **7 days**, then `expired`. One request per recipient per connection after |
| **5** | Does hidden mode apply when meeting an existing connection? | **Scoped to Roulette.** Grants persist. Label the call: "You're already connected — profiles visible to each other" |
| **6** | Intention (Social/Dating/Either): per-session or persistent? | **Per-session**, defaulting to last choice, visible and editable |
| **7** | Does "Search farther" persist across sessions? | **No.** Re-consent every time |
| **8** | Do any gender/orientation preferences apply to Roulette matching? | **None unless specified.** Social/Dating/Either is the only compatibility input |

---

## 18. EXPLICITLY OUT OF SCOPE

- Group finder and double dates
- Missed-connections contact after a skip
- Payments and premium packages
- Automatic recording / content inspection / NSFW detection
- Full rebranding or internal-key renaming
- Multi-server architecture without demonstrated need
- Unlimited-use promises
- App-wide background calling
- Multiple independent request/chat systems
- Call-duration and daily-session **commercial** caps — deliberately undecided

**In scope** because the feature depends on them: authentication gaps, identity exposure,
request handling, and call safety.

---

## 19. WHAT MUST BE DISCLOSED IN THE UI

The honest full version of the privacy promise:

> "Roulette does not display your profile until you choose to share it — **within Roulette
> conversations.** If the same person appears in your Deck later, you will see their normal
> public profile. That is how Deck works."

**This must appear before the user chooses hidden mode**, not buried in a policy. It is the
single most likely source of the "I thought my profile was hidden" failure in §20.

**Also remove from the v1 placeholder screen** `[CONFIRMED]`:
- `"Each session is anonymous until you choose to reveal yourself."` — false; the camera
  is on (`Roulette.jsx:102`)
- `"...that flows straight into your Matches."` — implies post-call matching that does not
  exist (`Roulette.jsx:94`)
- `Splash.jsx:1475` — `"The preview cards can be swiped horizontally."` — **no swipe
  handler exists anywhere in the codebase**

---

## 20. COMPREHENSIBILITY CHECKS

Before a broader student launch, ask fresh testers to:

1. Start without revealing their profile
2. Explain what their partner can see
3. Send / accept Align
4. Find the saved conversation afterward
5. Share profiles mutually
6. Decline, leave, block, and report
7. Open and close chat without ending the call

**Watch especially for these — they are design failures to correct, not user mistakes:**

- "I thought Align revealed my profile."
- "I thought accepting meant agreeing to dating."
- "I couldn't find the request."
- "I accidentally left while opening chat."
- "I thought anonymous meant nobody could identify me."

Note: "I couldn't find the request" is **already a live bug** — the bell is Deck-only today
(`Header.jsx:150`), so requests are unreachable from three of four tabs.

---

## 21. THE ROUNDETTE ENTRY SCREEN

One compact setup screen — **not** multiple compulsory onboarding pages.

```text
ROULETTE

Meet college students around your area.

So, what are you here for, huh?
[Social]  [Dating]  [Either]

Your call name
[Moonwalker                    Edit]

Profile hidden
Your face is visible. Your profile is not displayed.

[Preview & start]

Preferences
```

**Defaults and rules:**

- **Profile hidden is the initial default.**
- Generate a temporary name; editing is optional.
- Require a deliberate **intention** selection on first use.
- Remember approved preferences for future visits, but keep them **visible and editable**.
- "Show my profile" lives under **Preferences**, not another mandatory setup screen.
- Temporary names must **not** impersonate official staff or contain abusive content.
- Changing a name must **not** reset account restrictions, blocks, or report history.
- Real-user access requires genuine account eligibility. Development login arrangements
  must remain isolated — **[CONFIRMED] today the only isolation is the hard-asserted
  `matchalize_test` database name** (`tests/lib/mongo.mjs:5,29-37`), with **no
  `isSeed`/`isTest` flag anywhere**. Do not add one.

### 21.1 Mobile call layout (starting point)

```text
┌─────────────────────────────┐
│ Temporary name     Safety ⋮ │
├─────────────────────────────┤
│                             │
│        Partner video        │
│                             │
├─────────────────────────────┤
│       Smaller self-preview  │
├─────────────────────────────┤
│ Mic   Camera   Align   Chat │
│        Next       Leave     │
└─────────────────────────────┘
```

Prototype the stacked arrangement first. **Test relative tile sizes rather than assuming
equal halves are best.**

**Controls:** tap video to hide secondary controls; keep Leave and an obvious safety entry
reachable; retain understandable camera/mic status; **no swipe-to-next in v1**; prevent
hidden controls from receiving accidental taps.

**Desktop:** keep video and chat side by side where space allows.

⚠️ **[CONFIRMED] Chat cannot be embedded without a geometry change** — `Chat.jsx:1081` is
`position: fixed; inset: 0` with no size clamp. This is a real Stage 8 task.

---

## 22. WHAT THIS PLAN DELIBERATELY CORRECTS FROM v1

| v1 said | v2 says | Why |
|---|---|---|
| `Alignment.origin = 'discover' \| 'roulette'` | **`source`** | `Interaction.origin` already exists with a different enum |
| "Skip = permanent (no re-queue)" | **Next re-searches** for the presser; other person gets "Conversation ended · Find next" | Matches the actual product flow |
| Self-hosted coturn, ₹400–500/mo VPS | **Cloudflare managed TURN**, 1,000 GB free | Verified free tier; kills the coturn ops burden |
| "free = 10 connections/day" as a monetization seam | **No invented caps.** Pilot limits are test settings | A 10/day cap is a commercial decision, not an engineering default |
| Mandatory gender-ratio rails | **None unless specified** (§17 #8) | Not invented |
| "anonymous until you reveal" | **Never say anonymous** — the camera is on | False promise |
| No hidden-profile concept | **First-class**, with a directional grant model | The core of v2 |
| Requests in a Deck-only bell | **Requests inside Chats** | Reachability |
| A fixed cost-per-resolution table | **Assumptions stated separately; nothing labelled measured** | v1's table had arithmetic errors |

---

**Design documented. Not implemented. Stage 0 is the next action.**

````

