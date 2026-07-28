# Matchalize — Handoff Status Report

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

`ALLOW_ALL_EMAILS=true` bypasses `.ac.in` restriction. When `SENDGRID_API_KEY` is unset, OTP codes log to console only (no email sent). Both conditions print warnings at startup.

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
