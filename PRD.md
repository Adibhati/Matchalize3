# Matchalize — Product Requirements Document (PRD)

> Updated: Sun Jul 26 2026. Reflects the actual codebase state.

## 1. Product Overview

**Name:** Matchalize
**Type:** Campus dating & social networking PWA
**Tagline:** "Your Campus. Your People."
**Platform:** Web (Progressive Web App, installable on mobile)
**Stack:** React 19.2 (Vite 8.1) + Node.js/Express 4.19 + MongoDB/Mongoose 8.4 + Socket.IO 4.7

Matchalize connects verified college students for dating, friendships, and study partnerships within their own campus community. It restricts access to `.ac.in` academic emails, ensuring an exclusive, campus-only user base.

---

## 2. Target Users

| Attribute | Details |
|-----------|---------|
| **Audience** | Indian college/university students |
| **Age** | 18-40 (enforced) |
| **Access** | `.ac.in` email verification (or all emails in dev mode) |
| **Supported colleges** | IIT Delhi, Bombay, Kanpur, Kharagpur, Madras, Roorkee, Guwahati, Hyderabad, BHU, ISM Dhanbad (expandable via `COLLEGE_MAP`) |

---

## 3. Feature Inventory

### 3.1 Authentication & Verification

| Feature | Status | Description |
|---------|--------|-------------|
| Email OTP login | Done | Enter `.ac.in` email -> receive 6-digit OTP |
| Auto-verification | Done | OTP auto-submits on 6th digit |
| Rate limiting | Done | Max 10 OTP requests/hr per IP, 15 verification attempts/15min per IP, 3 attempts per OTP |
| JWT sessions | Done | 7-day httpOnly cookie, sliding expiration at 6 days |
| College auto-detection | Done | Domain prefix maps to college name (e.g., `iitb` -> "IIT Bombay") |
| Dev mode | Done | OTPs logged to console when SendGrid not configured |
| Suspended user block | Done | Suspended users cannot log in (403 response) |
| Deleted user block | Done | Soft-deleted users cannot log in (403 response) |
| Multi-device logout | Done | `lastLogoutAt` timestamp invalidates older tokens |

### 3.2 Onboarding (9-step wizard)

| Step | Fields | Validation |
|------|--------|------------|
| 1. Basic Info | Name, DOB (auto-calculates age) | name + age required, age 18-40 |
| 2. Gender & Pronouns | Gender (single), Pronouns (optional, 7 options + custom), Interested In (multi-select) | gender required, interestedIn validated with `Array.isArray` |
| 3. Campus Details | Branch (12 options), Year (6 options), Hostel (optional) | branch + year required |
| 4. Photos | Upload up to 6 images (Cloudinary) | >= 1 photo required, URL validated with `isValidImageUrl` |
| 5. Prompts | Select from 43 campus-themed prompts, write answers | >= 3 answered prompts, photo URLs validated |
| 6. Intent & Bio | Connection intent (Dating/Friends/Study), Bio text | >= 1 intent |
| 7. Interests | Pick up to 6 from 22 tags (with Material icon mapping) | -- |
| 8. Compatibility Quiz | 7 multiple-choice questions | all 7 required |
| 9. Profile Preview | Card preview with "Edit" loop-back | -- |

**Submit:** `POST /api/users/setup` -> sets `isOnboarded: true` -> redirects to Discover.
**Resume:** `GET /api/users/onboarding/resume` returns saved progress. `PUT /api/users/onboarding/save` saves per-step. `DELETE /api/users/onboarding/clear` resets.

### 3.3 Discovery (Swipe Deck)

| Feature | Status | Description |
|---------|--------|-------------|
| Flipbook deck | Done | 2-page flipbook via `react-pageflip` (active + preview) |
| Like (send letter) | Done | `POST /api/discover/like/:id` with optional note + target artifact |
| Super Like (Telegram) | Done | `POST /api/discover/superlike/:id` — sends as `seal_stamp` |
| Pass | Done | `POST /api/discover/pass/:id` — 7-day cooldown via atomic upsert |
| Match detection | Done | Mutual letter/telegram -> creates Match -> real-time socket + push notification |
| Compatibility score | Done | 0-100% computed from 7-question matrix (1.0=same, 0.6=similar, 0.2=different) |
| Filtering | Done | Same `collegeCode`, excludes acted/blocked/ghosted/deleted users, respects `interestedIn` + `ageRange` |
| Daily limit | Done | 7 letters + 7 telegrams per day (accepts do NOT count) |
| Haptic feedback | Done | Vibration on swipe and match events |
| Dedup | Done | `actionPendingRef` prevents double-sends; `isActionFlip` prevents duplicate pass on page flip |
| Sort tabs | Done | "All" / "Era" (same year) / "Branch" (same branch) |
| Empty state | Done | "The Ledger is Empty" themed card with retry button |
| Connection banner | Done | Amber "Reconnecting..." banner on socket disconnect |

### 3.4 Likes You (Blurred Reveal)

| Feature | Status | Description |
|---------|--------|-------------|
| Blurred grid | Done | 2-column grid of blurred user cards |
| Tap to reveal | Done | Click removes blur with CSS transition |
| Action buttons | Done | Like back or Pass on revealed user |
| Match creation | Done | Liking back may create a match -> MatchNotification overlay |
| Telegram priority | Done | Telegrams (`seal_stamp`) sorted to top |
| Block exclusion | Done | Blocked users hidden from likes-you grid |

### 3.5 Matching & Notifications

| Feature | Status | Description |
|---------|--------|-------------|
| Match celebration | Done | Compact card modal: avatar + "It's a Match!" + "Send a Message" / "Ignore" |
| Push notifications | Done | Web Push (VAPID) for matches, messages, and info events |
| In-app notifications | Done | Bell icon with unread count, dropdown panel, mark-all-read |
| Notification types | Done | `match`, `message`, `info`, `letter`, `seal_stamp` |
| Letter accept | Done | `POST /api/notifications/:id/accept` — creates match, distinct `accept_letter`/`accept_seal` actionTypes |
| Socket real-time | Done | `match-notification`, `unmatch-notification`, `new-message`, `online-update`, `typing`/`stop-typing`, `messages-read`, `message-deleted` |
| Unmatch real-time | Done | Matches page listens for `unmatch-notification` socket event |
| Icebreakers | Done | `GET /api/matches/:id/icebreakers` — shared interests, same hostel/branch, prompt-based + 5 fallbacks |

### 3.6 Messaging (1:1 Chat)

| Feature | Status | Description |
|---------|--------|-------------|
| Text messages | Done | Send/receive with optimistic UI |
| Image messages | Done | Attach via gallery or camera, upload to Cloudinary |
| Audio messages | Done | Voice recording with iOS fallback (`audio/webm` -> `audio/mp4`/`.m4a`) via `CassettePlayer` |
| Opening letter | Done | First message stored as `type: 'opening_letter'` with upsert |
| Reply threading | Done | Reply-to with quoted message preview |
| Emoji reactions | Done | 6 emoji options (heart, laugh, fire, thumbs up, wow, cry) -- one per user per message |
| Read receipts | Done | `deliveryStatus: 'sent'` -> `'read'` with `readAt` timestamp |
| Typing indicators | Done | Real-time "typing..." dots, cleanup on disconnect + unmount |
| Online status | Done | Green dot, "Online" / "Xm ago" / "Xh ago" |
| Message grouping | Done | Consecutive same-sender messages within 60s visually grouped |
| Soft delete | Done | "This message was deleted" placeholder; Cloudinary media cleaned up |
| Long-press menu | Done | Copy, Reply, React, Report, Delete (own messages only via `showOnlyIfMine`) |
| Photo viewer | Done | Full-screen image overlay with loading spinner + opacity fade |
| Pagination | Done | ObjectId cursor-based (`{ matchId: 1, _id: -1 }` compound index) |
| Duplicate prevention | Done | `clientMsgId` idempotency key; duplicate key error returns existing message (200) |
| Block check | Done | Prevents sending messages to blocked users |
| Character limit | Done | `maxLength={5000}` on input |
| Scroll anchor | Done | `useLayoutEffect` freezes viewport when older messages prepended; `scrollTop < 5` threshold |

### 3.7 Profile Management

| Feature | Status | Description |
|---------|--------|-------------|
| View profile | Done | Renders as ProfileCard (same view others see) |
| Edit profile | Done | Bio, hostel, branch, year, prompts, interests, photos |
| Photo validation | Done | `isValidImageUrl` checks trusted hosts; caps at 6 photos, 3 prompts |
| Orphaned photo cleanup | Done | Compares old vs new photos on save, deletes removed ones from Cloudinary |
| Score animation | Done | Animated compatibility score sweep on profile load |
| Blocked Subjects | Done | Bottom sheet modal with list/unblock functionality |
| Account deletion | Done | Soft delete with 30-day safety retention, themed confirmation dialog |

### 3.8 Report & Block System

| Feature | Status | Description |
|---------|--------|-------------|
| Report user | Done | 5 reasons: Inappropriate photos, Harassment/bullying, Fake profile/spam, Underage user, Other |
| Auto-suspend | Done | 3-4 reports -> shadowban (`isGhost: true`); 5+ reports -> full suspension |
| Block user | Done | Deactivates match + creates bidirectional permanent archive Interactions |
| Unblock user | Done | Removes block + deletes archive Interactions (allows re-encounter) |
| Block exclusion | Done | Blocked users hidden from Discover, Likes You, Chat via `getBlockExclusionQuery()` |
| Block status check | Done | Bidirectional: `iBlockedThem` vs `theyBlockedMe` |
| Duplicate prevention | Done | Unique compound indexes on Report and Block |

### 3.9 Account Lifecycle (Enterprise-Grade)

| Feature | Status | Description |
|---------|--------|-------------|
| Soft delete | Done | `isDeleted: true`, `deletedAt: new Date()`, PII wiped, profile photos removed from Cloudinary |
| Safety retention | Done | Messages, Matches, Interactions retained for 30-day Trust & Safety window |
| Auth guard | Done | `protect` middleware blocks deleted users from all API endpoints |
| Login block | Done | Login endpoint rejects deleted users with 403 |
| Two-tier cleanup | Done | Public profile media -> immediate wipe. Chat media -> retained for safety |
| Match deactivation | Done | All matches set to `isActive: false` on deletion (chats vanish from inboxes) |

### 3.10 PWA & Mobile

| Feature | Status | Description |
|---------|--------|-------------|
| Service Worker | Done | Caches core assets, handles push events |
| Manifest | Done | Standalone display, black theme, orange accent |
| Install prompt | Done | Add to Home Screen on supported browsers |
| Haptic feedback | Done | 7 vibration patterns for mobile UX |
| Notch safe | Done | `viewport-fit=cover` with safe area padding |
| iOS keyboard | Done | `minHeight: 100dvh` + flex layout prevents keyboard overlay |

---

## 4. Architecture

### 4.1 Frontend

```
client/src/
├── main.jsx
├── App.jsx                    # Router, auth guard, socket provider
├── index.css                  # Global styles
├── pages/                     # 7 pages
│   ├── Splash.jsx             # Landing screen with video bg
│   ├── Auth.jsx               # OTP login (2-step)
│   ├── Onboarding.jsx         # 9-step wizard with progress save
│   ├── Discover.jsx           # Flipbook swipe deck + sort tabs
│   ├── Matches.jsx            # Connections list with search
│   ├── Chat.jsx               # Real-time chat (1184 lines)
│   └── Profile.jsx            # View/edit profile + settings
├── components/
│   ├── AppShell.jsx           # Layout wrapper with nav + unread badges
│   ├── NavBar.jsx             # Bottom nav (4 tabs)
│   ├── PolaroidCard.jsx       # Profile card with score animation
│   ├── ProfileCard.jsx        # Draggable profile card
│   ├── ProfileCardSkeleton.jsx
│   ├── ArchivalToast.jsx      # Toast notifications
│   ├── CassettePlayer.jsx     # Audio message player
│   ├── ErrorBoundary.jsx
│   ├── Header.jsx
│   ├── Icon.jsx
│   ├── NotificationDrawer.jsx
│   ├── PopoutItem.jsx
│   ├── Skeleton.jsx
│   └── chat/                  # 7 chat sub-components
│       ├── EmojiPicker.jsx
│       ├── MessageActionMenu.jsx
│       ├── MessageBubble.jsx
│       ├── PhotoViewer.jsx
│       ├── ReplyPreview.jsx
│       ├── ReportModal.jsx
│       └── SearchOverlay.jsx
└── utils/
    ├── api.js                 # Axios instance with interceptors
    ├── AppConfigContext.jsx   # App configuration provider
    ├── AuthContext.jsx        # Auth state + useAuth hook
    ├── dummyProfiles.js       # Test data
    ├── haptics.js             # Vibration patterns
    ├── push.js                # Web Push subscription
    ├── socket.js              # Socket.IO client singleton
    ├── theme.js               # Design tokens
    ├── toast.js               # Toast notifications
    └── useChat.js             # Chat utilities (unused — Chat.jsx has own logic)
```

### 4.2 Backend

```
server/
├── index.js                   # Express + Socket.IO server, CORS, Helmet, rate limiting
├── seedDummies.js             # Seed test profiles
├── config/
│   ├── appData.js             # Static data (prompts, branches, years, genders, etc.)
│   ├── cloudinary.js          # Cloudinary config + deleteCloudinaryFile helper
│   ├── compatQuestions.js     # Compatibility questions + computeCompatibility()
│   └── db.js                  # MongoDB/Mongoose connection
├── middleware/
│   ├── auth.js                # JWT protect, setAuthCookie, clearAuthCookie
│   ├── blockFilter.js         # areBlocked(), getBlockExclusionQuery()
│   ├── rateLimiters.js        # 4 rate limiters (message, discover, verify OTP, OTP request)
│   └── validate.js            # Express-validator middleware
├── models/                    # 10 Mongoose models
│   ├── User.js                # 30+ fields, discover compound index, isDeleted
│   ├── Match.js               # pairKey, users[], isActive, unlockedByInteractionId
│   ├── Message.js             # deliveryStatus, clientMsgId, reactions, soft delete
│   ├── Interaction.js         # 5 actionTypes, cooldownExpiresAt, compound indexes
│   ├── Notification.js        # match/message/info/letter/seal_stamp types
│   ├── OTP.js                 # TTL auto-delete
│   ├── Report.js              # 5 reasons, status tracking
│   ├── Block.js               # Unique {blocker, blocked}
│   ├── Analytics.js           # User event tracking
│   └── Setting.js             # Key-value config
├── routes/
│   ├── auth.js                # OTP send/verify, logout, /me
│   ├── users.js               # Setup, profile CRUD, account deletion (soft delete)
│   ├── discover.js            # Deck, like/superlike/pass, likes-you
│   ├── matches.js             # List, unmatch, icebreakers
│   ├── messages.js            # CRUD, reactions, ObjectId cursor pagination
│   ├── notifications.js       # VAPID, push subscribe, accept letter, read/dismiss
│   ├── report.js              # Report, block/unblock with archive Interactions
│   ├── upload.js              # Cloudinary upload
│   └── config.js              # App config endpoint
├── socket/
│   └── chat.js                # Socket.IO: join room, typing, online status, disconnect cleanup
└── utils/
    ├── AppError.js            # Custom error class
    ├── asyncHandler.js        # Async wrapper
    ├── email.js               # SendGrid OTP emails
    ├── push.js                # Web Push notifications
    └── queue.js               # Async task queue
```

### 4.3 Database (10 collections)

| Collection | Key Fields | Indexes |
|------------|-----------|---------|
| **User** | email, name, photos[], isOnboarded, isGhost, isDeleted, suspended, randomSeed | discover_deck_filter_index (7 fields), text (name+email), randomSeed |
| **Match** | pairKey, users[], isActive, unlockedByInteractionId | { users: 1, isActive: 1 } |
| **Message** | matchId, senderId, type, text, clientMsgId, mediaUrl, deliveryStatus, replyTo, reactions[], deleted, readAt | { matchId: 1, createdAt: 1 }, { matchId: 1, _id: -1 }, { senderId: 1, createdAt: -1 } |
| **Interaction** | actorId, targetId, actionType, targetArtifact, letterContent, cooldownExpiresAt | { actorId: 1, targetId: 1 }, { actorId: 1, cooldownExpiresAt: 1 }, { actorId: 1, actionType: 1, createdAt: -1 }, { targetId: 1, actionType: 1 } |
| **Notification** | recipientId, senderId, type, interactionRef, isCleared | -- |
| **OTP** | email, otp, expiresAt, attempts | TTL on expiresAt |
| **Report** | reporter, reported, reason, details, status | unique {reporter, reported} |
| **Block** | blocker, blocked | unique {blocker, blocked} |
| **Analytics** | user, event, step, timestamp | -- |
| **Setting** | key, value | -- |

---

## 5. API Endpoints (35+)

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /send-otp`, `POST /verify-otp`, `POST /logout`, `GET /me` |
| Users | `POST /setup`, `GET /profile`, `PUT /profile`, `DELETE /account`, `GET /onboarding/resume`, `PUT /onboarding/save`, `DELETE /onboarding/clear`, `POST /logout-all` |
| Discover | `GET /`, `POST /like/:id`, `POST /superlike/:id`, `POST /pass/:id`, `GET /likes-you` |
| Matches | `GET /`, `DELETE /:id`, `GET /:id/icebreakers` |
| Messages | `GET /:matchId` (cursor pagination), `POST /:matchId`, `POST /:matchId/reaction`, `DELETE /:matchId/:msgId` |
| Notifications | `GET /vapid-key`, `POST /subscribe`, `DELETE /subscribe`, `GET /unread-count`, `GET /`, `POST /:id/accept`, `PUT /:id/read`, `PUT /read-all`, `PUT /:id/dismiss` |
| Report/Block | `GET /reasons`, `POST /:userId`, `POST /block/:userId`, `DELETE /block/:userId`, `GET /block/list`, `GET /block/status/:userId` |
| Upload/Config | `POST /upload`, `GET /config` |

---

## 6. Environment & Deployment

| Variable | Purpose | Status |
|----------|---------|--------|
| `PORT` | Server port (5005) | Configured |
| `MONGODB_URI` | MongoDB Atlas | Configured |
| `JWT_SECRET` | JWT secret | Required (server exits if missing) |
| `ALLOW_ALL_EMAILS` | Dev bypass | `true` in dev |
| `SENDGRID_API_KEY` | Email OTP | Optional (console fallback) |
| `CLOUDINARY_*` | Photo/audio storage | Configured |
| `VAPID_*` | Push notifications | Configured |
| `SENTRY_DSN` | Error monitoring | Configured |

**Deployment:** Render.com + MongoDB Atlas

---

## 7. Security

| Control | Implementation |
|---------|---------------|
| Helmet.js | CSP headers, XSS protection |
| CORS | Strict Set-based whitelist (no regex wildcards) |
| Rate limiting | Messages: 30/10min per user. Discover: 100/10min per user. OTP: 15/15min + 10/hr per IP |
| OTP | 3 attempts per code, 10-min TTL |
| JWT | 7-day httpOnly cookie, sliding expiration at 6 days |
| Socket.IO | JWT auth on connection |
| Upload | 5MB file limit, `isValidImageUrl` trusted host validation |
| Auto-suspend | 3 reports = shadowban, 5+ reports = full suspension |
| Block exclusion | Discover, Likes You, Chat, Socket rooms |
| Self-interaction guard | Cannot like/pass/report yourself |
| Deleted user guard | All API endpoints + login blocked for `isDeleted` users |
| Idempotency | `clientMsgId` on messages prevents duplicate sends |
| Input validation | `express-validator` on auth, setup, and message routes |

---

## 8. Design System

| Element | Value |
|---------|-------|
| Primary | Orange (#f97316) |
| Background | Near-black (#000) |
| Surface | Dark gray (#1a1a1a) |
| Text | White / dim |
| Border radius | 12-24px (cards), 99px (buttons) |
| Headings | Geist Sans 700 |
| Body | Inter 400-600 |
| Icons | Material Symbols Outlined + Lucide React |
| Max width | 430px |
| Animations | Framer Motion (page transitions, card gestures) + GSAP (score sweep) |

---

## 9. Known Gaps

| # | Gap | Severity |
|---|-----|----------|
| 1 | No message editing (deletion only) | Feature gap |
| 2 | No `delivered` delivery status (goes `sent` -> `read`) | Nice-to-have |
| 3 | No empty chat placeholder for zero-message matches | Minor UX |
| 4 | No error message on Discover fetch failure | Minor UX |
| 5 | No rate limiting on message delete or block/unblock | Low risk |
| 6 | Delete uses `window.confirm` instead of themed modal | Polish |
| 7 | No admin dashboard for reports/suspensions | Feature gap |
| 8 | No E2E or unit tests | Quality gap |
| 9 | No CI/CD pipeline | DevOps gap |
| 10 | Seed is destructive (`deleteMany` on run) | Dev tooling |
