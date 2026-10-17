# huh? / Matchalize — Read-Only Engineering Audit

```
Generated:            2026-10-16
Audited against:      working tree on main @ 50c0095 (+45 uncommitted changes)
Method:               read-only static inspection
                      No app started, no test executed, no database touched,
                      no provider contacted, no secret value reproduced.
Pricing:              verified from official vendor pages on 2026-10-16
Re-verify before relying on this. Nothing in CI detects documentation staleness.
                      A stale doc handed to an investor is worse than none.
```

**Confidence legend used throughout:**

| Marker | Meaning |
|---|---|
| **[CONFIRMED]** | Verified by reading the cited code |
| **[INFERRED]** | Reasoned from code, not runtime-verified |
| **[NOT FOUND]** | Searched exhaustively, absent |
| **[UNKNOWN]** | Cannot be determined without dashboard/DB access |

---

# ONE-PAGE SUMMARY

## What this app actually is

**A substantially built, working MVP for one of its two features, and an empty shell for the other.**

The **Deck** (profile discovery), **matching**, **chat**, **notifications**, **reporting** and **admin moderation** are genuinely implemented end-to-end — frontend, backend, database, permissions. This is not a mockup. Users can really sign up with a college email, build a profile, browse people, match, and chat.

**Roulette is a placeholder.** `client/src/pages/Roulette.jsx` is 125 lines. It has one `useState`, imports no networking, and its Start button fires `toast.info('Roulette is coming soon.')` (`Roulette.jsx:40`). There is **no roulette server route, no queue, no WebRTC, no camera code, and no media provider** anywhere in the repository. Two devices cannot complete a call.

## Ready for what?

| Stage | Verdict |
|---|---|
| Private testing (you + a few friends) | **Yes**, after fixing §13 blockers |
| **IITB limited launch** | **Not yet** — three blockers, one of them legal |
| Public launch | **No** |

## The five findings that matter most

**1. The Deck is platform-wide, not intra-college — and this was deliberate.**
`discover.js:254-260` has **no `collegeCode` filter**, with a comment saying *"This deck is PLATFORM-WIDE: an IIT Bombay student should see IIT Delhi, NIT Trichy and everyone else."* The `?campusOnly` option was **removed on purpose** (`User.js:352-365`). Your spec says the deck is intra-only; your founder brief says own-college + nearby. **The code does neither — it does global.** There is no way to restrict it to your campus. This is a product decision that contradicts your written plan and must be resolved before IITB.

**2. Both brands ship simultaneously, including in your legal documents.**
`client/index.html:25` sets the browser tab to *"Matchalize"*; `Header.jsx:174,182,184` renders the wordmark **"Matchalize"**; the shipped **Privacy Policy and Terms of Service** say "Matchalize" (`Settings.jsx:653,712,728-779`). Meanwhile every OTP email says **"huh?"** (`render.yaml:98`) and the landing page says "huh?". You have **three different domains** for one product: `matchalize.com` (support/legal), `matchalize.app` (push), `huh.app` (email). A student signing up under "huh?" is agreeing to terms for a differently-named entity. **Fix before IITB.**

**3. There is no demo/seed marker, and 1,200 seeded users exist.**
Confirmed by exhaustive search: no `isSeed`/`isDemo`/`isBot` field in the schema, none in the card allowlist (`publicCard.js:14-18`), zero references in the client. `server/seedRealistic.js` creates 1,200 users across 44 colleges who are **indistinguishable from real signups**. If that was ever run against production, you cannot tell them apart. This is an investor-meeting hazard.

**4. Account deletion promises a 30-day purge that does not exist.**
`users.js:904,946,951` refers to a "background cleanup job." **That job does not exist** — there is no cron, no scheduler, no `setInterval` anywhere in the codebase (confirmed: 0 occurrences). Messages, chat media, and Interactions are retained **indefinitely**, while the in-app privacy policy promises 30 days. There are also **no backups configured in the repo**.

**5. Free-tier hosting will break Roulette by design.**
`render.yaml:19` is `plan: free` — 15-minute spin-down. Roulette needs always-on sockets. The comment at `render.yaml:24-28` says you plan to upgrade to Starter for exactly this. But scaling to 2+ instances **breaks four things silently**: presence (`onlineUsers`), deck race protection (`deckLocks`), real-time message delivery, and all six rate limiters. There is no Redis adapter and no shared store.

## What cannot be determined from the repo

Real provider plans and bills; whether `RESEND_API_KEY`/`SENTRY_DSN` are set in Render; actual user count and DAU; whether any call has ever been made; Cloudinary delivery settings; Atlas backups; whether the production DB is M0 or paid.

---

# SECTION 1 — EXECUTIVE SUMMARY

**Classification: partially functional product — one complete feature, one absent. Not production-ready.**

Evidence for that label: the Deck path has working frontend, backend, persistence, authorization and an admin review pipeline. Roulette has a nav entry and a toast.

**What the app does today:**
1. User picks a college, enters a college email, receives a 6-digit OTP, verifies, and gets a session.
2. Completes an 8-step onboarding (name, DOB, photo, gender, preferences, UG/PG, intent, location).
3. Browses a ranked, distance-banded deck of verified students **from all colleges**, swipes/pass/aligns.
4. On mutual interest, gets an "Alignment" (match) and opens a real-time chat.
5. Can report, block, delete their account, and is moderated by an admin panel.

**What the app does not do:** anything involving live video. No queue, no call, no media. Also absent: group features, payments, appeals, and automated cleanup.

---

# SECTION 2 — TECH STACK AND ARCHITECTURE

| Component | Technology | Role here | Evidence | Unknowns |
|---|---|---|---|---|
| Frontend | React **19.2.7**, plain JSX (no TypeScript) | Whole UI | `client/package.json:5-6` | — |
| Build | Vite **8.1.0** + `@vitejs/plugin-react` | Bundling, 5 lazy chunks | `vite.config.js`; `AppShell.jsx:19-23` | — |
| Lint | oxlint 1.69 | Client + server lint | `client/package.json:9` | — |
| Routing | **None.** `useState` screen switcher | Screens/tabs | `App.jsx:18-30`; author comment `AppShell.jsx:118-120` | `react-router-dom` v7 installed, **zero imports** |
| Backend | Node 22, Express **4.19.2** | All API + WebSocket | `server/package.json:25`; `render.yaml:56` | — |
| Database | MongoDB via Mongoose 8.4, Atlas | All persistence | `config/db.js` | Which tier — dashboard only |
| Auth | **OTP-only. No passwords exist.** HS256 JWT in httpOnly cookie `matchalize_jwt` | Sessions | `middleware/auth.js:24-33`; `User.js:339` (no password field) | — |
| Realtime | Socket.IO 4.7 | Chat typing/presence/messages | `server/socket/chat.js` | — |
| Email | Resend | OTP + college-live | `server/utils/email.js` | **Key empty locally** |
| Media | Cloudinary, public delivery | Photos, voice notes | `routes/upload.js` | Dashboard |
| Monitoring | Sentry (server wired; **client not configured in prod**) | Errors | `index.js:54-61`; `main.jsx:11-13` | `VITE_SENTRY_DSN` absent from `render.yaml` |
| Push | Web Push / VAPID | Notifications | `utils/push.js` | Keys set? dashboard |
| Video/TURN/SFU | **NONE** | — | 0 hits repo-wide | — |
| Payments | **NONE** | — | 0 hits for stripe/razorpay | — |
| Analytics | First-party only (`Analytics`, `DeckImpression`) | Funnel, impressions | `models/Analytics.js` | No Mixpanel/GA |

## Architecture diagram

```
User device ──HTTPS──► Render (singapore, plan:free, 1 instance)
                        │
                        ├─ Express serves BOTH the API and the built React app
                        ├─ Socket.IO (chat only — no media)
                        ├─► MongoDB Atlas  (users, messages, reports, colleges)
                        ├─► Cloudinary     (photos, audio — public URLs)
                        ├─► Resend         (OTP email)   ⚠ key empty locally
                        ├─► Web Push       (VAPID)
                        └─► Sentry         (only if DSN is set in Render)
```

## Deployment shape

**ONE combined service**, not two. `render.yaml` defines a single `web` service that builds the client and serves it from `client/dist` (`index.js:418-419`). This is why `VITE_API_URL` is unnecessary — the client falls back to `window.location.origin` (`api.js:9`).

**[CONFIRMED] If the client is ever split onto a separate host, this breaks silently** — the build-time var would be required and is not declared in `render.yaml`.

## Unused declared dependencies

`react-router-dom` (zero imports), `react-pageflip` (zero refs), `canvas-confetti` (zero refs), `gsap` (zero refs). **[CONFIRMED]**

---

# SECTION 3 — FEATURE-BY-FEATURE STATUS

| Feature | Status | Notes |
|---|---|---|
| College list | **Working** | Live Mongo `College` collection. `COLLEGE_MAP` (10 entries) is dead code, never imported. Actual count = dashboard |
| Sign-up / login | **Working** | 3 steps: college → email → OTP. `Auth.jsx:1615` |
| OTP + resend | **Working** | 10-min expiry, 3 attempts, 5/email/hour. **No resend button in the normal flow** — only "Wrong email? Go back". Resend exists only on the re-verify screen (`Auth.jsx:2036-2048`) |
| Password reset | **N/A** | There are no passwords. Losing email access = permanent loss of account |
| Age / DOB | **Working, hard block** | 18–40. Server recomputes from DOB, ignores client age (`users.js:308-315`, HTTP 400). Immutable after onboarding (`users.js:526-527`) |
| Profile create/edit | **Working** | 8-step onboarding with draft autosave + resume; 7 editable drawers |
| Photos/bio/prompts/interests | **Working** | 4 photos, 3 prompts, 10 interests, bio 160 chars |
| Deck discovery | **Working** | Full-pool Mongo aggregation, ranked, frozen per session |
| **Own-college filtering** | **REMOVED** | No `collegeCode` filter. Only a ~20% cap (`discover.js:490`). `?campusOnly` deleted |
| **Cross-college / nearby** | **Working (globally)** | Distance bands: ≤30km / ≤100km / ≤300km / beyond. Computed in-Mongo via haversine. Card shows a **label, never a distance** |
| Gender/preferences | **Working** | Mutual check (`discover.js:263-276`). Users with empty `interestedIn` are treated as open |
| Align / likes | **Working** | Requires profileScore ≥75 (ladder gate) + 10/day IST cap |
| Reciprocal matching | **Working** | Atomic `findOneAndUpdate` upsert on `pairKey` (`discover.js:1686-1703`) |
| Letterbox / incoming | **Working** | `Notification` collection. Accept creates Alignment + opening letter, race-safe via partial unique index |
| Messaging | **Working** | Persisted, socket live, authorized by alignment membership on **every** route. Cannot read another user's messages |
| Notifications | **Working** | Only `new_align` is ever written. 30s polling + web push + socket |
| Pass/skip | **Working** | Writes an `Interaction` with cooldown |
| Reporting | **Working** | 5 reasons. 3 reports → shadowban; 5 → suspension. **No admin notification on report** |
| Blocking | **Working** | Deactivates alignment, writes 2 permanent archives. Unblock does NOT reverse passes. Block-status oracle deliberately removed (`report.js:205-217`) |
| Account deletion | **Partial** | Soft delete works. Media wiped. **Email + reports retained 30d; messages/media retained indefinitely — the cleanup job does not exist** |
| Privacy/settings | **Working** | Blocked list, privacy policy, ToS, college change, distance preference, theme |
| **Roulette** | **Interface only** | 125-line stub. See §4 |
| Group finder | **NOT FOUND** | 0 hits. No model, route, or UI |
| Double-date | **NOT FOUND** | 0 hits |
| Premium / payments | **NOT FOUND** | No Stripe, no Razorpay, no plan model. ("premium" hits are a QA CSS class in `scenes.mjs:35-37`) |
| Admin tools | **Working** | 19 endpoints. Report queue, user mgmt, college CRUD, request queue, analytics |

## Actual user flows

**Sign-up:** `Auth.jsx:1615` sets `step` to `'college'` → `'email'` → `'otp'`. OTP auto-submits on the 6th digit (`:1929`) or on paste (`:1918`). There is **no profile step inside auth** — `App.jsx:67-72` routes to `'onboarding'` separately.

**Deck:** `GET /api/discover?limit=N` → per-viewer lock → frozen `DiscoverSession` → 500-id window → Mongo aggregation ranks the whole eligible pool → first 10–20 returned.

**Match:** `POST /api/discover/align/:id` → self-block check → ladder gate → `Interaction` → `Notification` → mutual check → atomic `Alignment` upsert → `opening_letter` message → socket ping.

**Chat:** `join-alignment` socket event → `GET /api/messages/:alignmentId` (ObjectId cursor pagination, marks others' messages read) → `POST /api/messages/:alignmentId` → socket broadcast to the alignment room.

## Missing links in those flows

- A shadowbanned user is hidden from other decks but **can still send Align** (`discover.js:1560-1575` does not check `contentFrozen`). Their outgoing notifications still fire.
- `Notification` has 3 enum values but only `new_align` is ever written. Blocks and unmatches create notifications via socket/push but **no durable `Notification` row**.
- `shadowbanScore` (`User.js:301-304`) is **never written and never read** — always 0. Dead field.
- Three of five admin settings keys are validated and then read nowhere (`admin.js:23-29`).

## Demo/seed separation

**[CONFIRMED: none exists.]** No `isSeed`/`isDemo`/`isBot` field in the schema, none in `CARD_FIELDS` (`publicCard.js:14-18`), zero references anywhere in the client. `server/seedRealistic.js` has two guards (`NODE_ENV=production` exit at `:30-41`, `--allow-fake-data` requirement at `:43-52`) and then runs `User.deleteMany({})` at `:305`.

**Location handling is genuinely well-built:** one-shot coarse geolocation on user gesture, never `watchPosition`, rounded to 2 decimal places (~1.1 km) before storage (`geo.js:96-103`), band labels only, explicit `$unset` on opt-out, 30-day TTL.

---

# SECTION 4 — ROULETTE: WHAT EXISTS TODAY?

**Direct answer: it is only a screen. Two real devices cannot complete a call.**

| Question | Finding |
|---|---|
| Screen or working call? | **Screen only.** `Roulette.jsx:34-40` — one boolean state, toast, 400ms timeout |
| Camera/mic permission + local preview | **Not implemented.** Zero `getUserMedia` outside voice notes (`Chat.jsx:596`) |
| Matching queue | **Not implemented.** No route, no model, no Redis |
| Queue storage | **N/A** |
| Pairs only verified/eligible users | **N/A** |
| Blocks respected | **N/A** |
| Same/cross-campus filters | **N/A** |
| Signaling | Socket.IO exists for **chat only**. Zero offer/answer/ICE events |
| WebRTC connections | **None.** 0 `RTCPeerConnection` hits repo-wide |
| STUN/TURN configured | **None** |
| Media provider integrated | **None** |
| P2P / TURN / media-server routing | **No architecture exists** |
| Relay-only mode | **Not implemented** |
| TURN credential lifetime | **N/A** — no TURN. When added, must be short-lived HMAC, never static |
| Cloudflare TURN integrated | **No.** Zero code references. Only mentioned in `ambitions/roulette.md` |
| coturn configured | **No.** Proposed in docs only, never implemented |
| Skip/disconnect/rematch | **Not implemented** |
| Abandoned queue cleanup | **N/A** |
| Duplicate pairing / race protection | **N/A** |
| Leave / refresh / network change | **Not handled** |
| Duration / retry / concurrency limits | **None** |
| Post-call matching / reveal | **No.** Only marketing copy: `Roulette.jsx:94` *"flows straight into your Matches"* |

**Also missing from the data model:** `Alignment` has 4 fields (`pairKey`, `users`, `isActive`, `unlockedByInteractionId`) — no `origin`. No `RouletteInteraction` model exists. `server/models/` has 16 models, none roulette-related.

**Note on `origin`:** a field named `origin` exists on `Interaction` (`Interaction.js:27-31`) but its enum is `['block','unmatch','pass']` — it is unrelated to roulette.

## A. Implemented now

Nav tab (mobile `NavBar.jsx:25` + desktop `DesktopSidebar.jsx:12`), header title (`AppShell.jsx:51`), chrome colour (`:70`), lazy-loaded page (`AppShell.jsx:23,234-235`), masked-lobby visual design, haptic + toast.

## B. Missing before a real two-device test

- `Alignment.origin` field
- Queue model + eligible-user matching logic
- Signaling events (offer / answer / ICE candidate)
- `RTCPeerConnection` + `getUserMedia` + local preview + permission UX
- STUN/TURN config + short-lived credential minting
- Face masking/blur implementation
- Skip + rematch + abort
- Call timer
- Text-only fallback path
- QA scene — note **`s13` is missing** from the 14-scene list (`scenes.mjs`), between `s12` and `s14`

## C. Missing before public launch

- Rate limits and abuse detection during calls
- In-call reporting with immediate disconnect
- Concurrency caps per user
- TURN cost instrumentation
- Age assurance beyond self-reported DOB
- Multi-instance safety (Redis adapter for presence + pub/sub)
- Legal review (see §6)
- Mobile-network testing (campus Wi-Fi vs cellular)

---

# SECTION 5 — VIDEO QUALITY, ROUTING, COST MEASUREMENT

**None of these settings exist.** There is no resolution, frame rate, codec, bitrate, audio codec, or adaptive-quality code anywhere. Any number in a planning document is a proposal, not a configuration.

**Resolution does not determine bitrate.** 360p can be 0.3 or 1.5 Mbps. In WebRTC, `getUserMedia` constraints plus `RTCRtpSender.setParameters().maxBitrate` are separate decisions from resolution.

| Setting asked about | Status |
|---|---|
| Video resolution | Not implemented |
| Frame rate | Not implemented |
| Video codec | Not implemented (browser would negotiate; no constraint set) |
| Max/target bitrate | Not implemented |
| Audio codec / channels / bitrate | Not implemented |
| Adaptive quality | Not implemented |
| Audio-only fallback | Not implemented |
| Mobile/browser compatibility | Not tested — no call exists |
| Direct vs relay route selection | Not implemented |
| Additional media copies / recording / moderation uploads | None exist |

## How to identify direct vs TURN from the selected candidate pair

After connection, read `RTCPeerConnection.getStats()`. Each candidate pair reports a `selectedCandidatePairId`. Look up that pair, then its `localCandidate` / `remoteCandidate`:

- `candidateType === 'host'` (or `srflx` / `prflx`) on both sides → **direct P2P, zero relay cost**
- `candidateType === 'relay'` on either side → **TURN is in the path**
- Relay on **both** sides → two-sided relay, roughly double the egress

**[CONFIRMED] A `relay` candidate does not mean the server can read the media.** WebRTC media is SRTP-encrypted end-to-end, and Cloudflare documents that its TURN forwards encrypted traffic it cannot inspect. **Buying TURN does not buy moderation.** This distinction matters for any investor or safety claim.

## Peer IP-address exposure

In a direct P2P call, WebRTC ICE will typically reveal a host or STUN-reflexive IP to the other peer unless a TURN-only policy is enforced. **The current architecture addresses this nowhere, because there is no architecture.** If peer IP privacy matters, TURN-only for media is the standard answer — at full bandwidth cost (no free direct path).

## What the app measures today

**Nothing.** No instrumentation for:

| Metric | Status |
|---|---|
| Successfully connected calls | Not implemented |
| Participant-minutes | Not implemented |
| Two-person call-hours | Not implemented |
| Peak concurrent calls / participants | Not implemented |
| Queue waiting time | Not implemented (no queue) |
| Direct connections | Not implemented |
| One-sided TURN | Not implemented |
| Two-sided TURN | Not implemented |
| Actual bytes sent/received | Not implemented |
| Provider-reported billable egress | Not implemented |
| Failed calls and reasons | Not implemented |
| Average / high-percentile call duration | Not implemented |

`Analytics` covers only the onboarding funnel. `DeckImpression` covers only deck cards. There is no `/metrics` endpoint and no request IDs.

## What to add later (not implemented, proposal only)

Per-call record with `durationSec`, `route` (`direct` / `one-sided` / `two-sided`), `bytesSent`, `bytesReceived` from `getStats()`, failure reason, candidate-pair id → aggregated into daily rollups → reconciled against the provider invoice.

**Do not label any bandwidth estimate "measured" until real calls exist.**

---

# SECTION 6 — SAFETY, MODERATION, PRIVACY

## Implemented

| Control | State |
|---|---|
| College email verification | Working, per-college domains, any TLD (`collegeDomain.js:62-69`) |
| Age check | 18–40, server hard block. **Self-reported DOB — not strong age assurance** |
| Reporting | Working — deck card (`ProfileCard.jsx:1332`) and chat (`Chat.jsx:1033`) only |
| Blocking | Working, immediate alignment deactivation |
| Admin review queue | Working — paginated, filters, bulk action (`admin.js:65-188`) |
| Suspension / shadowban | Working, thresholds 3 and 5 (`report.js:65-82`) |
| Rate limiting | 6 named limiters + global 1000/5min (`rateLimiters.js`; `index.js:367-374`) |
| Global ban | Working across deck, chat, socket, login |
| Cloudinary image moderation | Webhook implemented, signature-verified, replay-guarded (`upload.js:111-168`) |
| Location consent | One-shot, on explicit user gesture, never `watchPosition` |

## Not implemented

| Control | Status |
|---|---|
| **Appeals** | **Not implemented** — a `mailto:` link only (`AccountSuspendedScreen.jsx:102-104`) |
| **Repeat-account abuse detection** | **Not implemented** — no device/IP/college-crossing detection |
| **Report during live video** | **N/A** — no video |
| Server-side content inspection | **None** |
| On-device NSFW detection | **None** — spec calls it optional and explicitly not the safety system |
| Evidence collection (screenshots, frames, transcripts) | **None** beyond text transcripts on report |
| Human review | One person (the operator) via the admin panel |
| Audit log of admin actions | **Not found.** `adminNotes` is a free-text note, not a log |
| Automated background moderation | None |

## What each party receives

| Party | Receives |
|---|---|
| Your server | Text messages, image URLs, metadata, reports. **No audio/video path exists** |
| Cloudinary | Photo + audio files on upload |
| Resend | College email address, one OTP per sign-in |
| Web Push provider (Google/Mozilla/Apple) | First **100 characters** of message text (`messages.js:239`) + recipient |
| MongoDB Atlas | Everything above, stored |

## End-to-end encryption

**Not applicable — no calls exist.** If Roulette is built P2P, WebRTC media *would* be E2E encrypted, and neither your server nor the TURN provider could read it.

**That is a genuine privacy property AND it means you cannot moderate call content.** The trade-off must be decided deliberately, not by accident.

## Claims that must not be made

- ❌ **"College verification proves age."** A `.ac.in` address does not prove 18+. The DOB is self-entered.
- ❌ **"College verification makes it safe."** Untested hypothesis. It may improve accountability and make repeat registrations harder. It has not been measured.
- ❌ **"TURN lets us moderate."** It does not. TURN forwards encrypted packets it cannot inspect.
- ❌ **"Verified students only, so no risk."** Verified students can still harass, misuse images, or share credentials. A campus ban is only "socially expensive" if it has teeth, which is not automatic.

## Legal questions for qualified Indian counsel

- Intermediary obligations and preservation duties under the IT Act / IT Rules — **what is actually required, and what is not?**
- Age assurance expectations for a service with minors-possible exposure
- Whether on-report recording is advisable — **note this cuts both ways.** Not recording limits evidence but avoids privacy, retention and security burden. Recording everything is *not* automatically the safe choice and introduces its own access-control, retention and child-safety risks.
- Whether a campus NAT / shared-IP situation affects any IP-based control
- Who is the legal entity named in the Privacy Policy versus the brand users see
- Whether DPDP consent language in `Settings.jsx:679-706` matches actual behaviour

**No compliance claim can be made from code inspection.**

---

# SECTION 7 — DATA STORAGE AND SECURITY

## Data categories

| Data | Location | Access control | Retention | Evidence / unknown |
|---|---|---|---|---|
| College email | Mongo `User.email` | Unique index; never in `CARD_FIELDS` | Kept 30d after deletion | `User.js:6-12` |
| DOB / age | Mongo `User.dob`, `User.age` | `dob` stripped on read via `withFreshAge` | Until deletion | **Leaks to localStorage** — see below |
| Profile details | Mongo | `CARD_FIELDS` allowlist | Until deletion | `publicCard.js:14-18` |
| Photos | **Cloudinary, public URLs** | None — URL = access | Destroyed on delete | `upload.js:36-55` |
| Location | Mongo `currentLatLng` | `select:false`, never in cards, 2-dp rounded | 30-day TTL | `User.js:231-246` |
| Likes / matches | Mongo `Alignment`, `Interaction` | Alignment membership | Deactivated on block/delete | — |
| Messages | Mongo `Message` | Alignment membership on every route | **Indefinite** | `messages.js:82-86` |
| Reports | Mongo `Report` | Admin only | **Indefinite** (intended 30d) | `users.js:944-946` |
| Session / call metadata | **None exists** | — | — | — |
| Verification selfies / ID docs | **None collected** | — | — | — |

## Media storage and delivery

**MongoDB stores references only, never media files.** **[CONFIRMED]**

**Cloudinary delivery is fully public.** Exhaustive search for `type: 'authenticated'`, `'private'`, `sign_url`, `auth_token`, `acl:` returns **zero hits** in `server/**`. Every photo is at an unguessable-but-public `https://res.cloudinary.com/<cloud>/…/matchalize/photos/<userId>/<file>` URL that anyone can fetch with no auth, no signature, no expiry.

**Upload authorization and restrictions:**
- Requires auth — `upload.js:72` (`protect`)
- Any authenticated, non-suspended, non-deleted user can upload
- Max 10 MB (Cloudinary path) / 5 MB (local fallback)
- MIME **and** extension must both match (`upload.js:14-17`)
- Folders scoped per user: `matchalize/photos/<userId>`, `matchalize/audio/<userId>`
- Image transform: 800×800, `crop: 'limit'`, `quality: 'auto'`

**Sensitive documents use different storage rules from profile photos?** **No** — there are no sensitive documents. No ID upload, no selfie verification, no document storage exists anywhere.

**Do image URLs bypass college-only access?** **Yes.** Because delivery is public, any Cloudinary URL that leaks (via a shared chat, a screenshot, browser history, or a cache) is retrievable without any authentication, forever, regardless of the college gate.

**Per-user folder names embed the user's Mongo ObjectId**, which is a stable pseudonymous identifier visible in every photo URL. Changing this would orphan all live media.

## Verified security strengths

- **No passwords to leak** — OTP-only. Codes stored as HMAC-SHA256 fingerprints, never plaintext (`otpHash.js:16-20`), compared with `crypto.timingSafeEqual`
- **JWT in httpOnly cookie**, `sameSite: 'lax'`, `credentials: 'include'` on every request, no token readable by JS
- **Media ownership enforced** — `deleteCloudinaryFile` refuses to destroy anything you don't own (`config/cloudinary.js:26-32`). The cross-user wipe hole from the spec is genuinely **fixed**
- **`express-mongo-sanitize`** applied globally — blocks NoSQL injection
- **Body size limits** — 1 MB JSON, 10 MB uploads, 5,000-char messages
- **`NODE_ENV` fails closed** (`index.js:82-87`) — prevents dev-only branches in prod
- **CORS is a strict allowlist** with an exact-match function, never `*`
- **No committed secrets.** `git ls-files` shows only `.env.example`; `git log --all -- '*.env'` is empty; `.gitignore` covers `.env` at two levels
- **Message authorization on every route** — user A cannot read user B's messages

## Verified issues

**HIGH — plaintext OTP logged to stdout**
`email.js:97` prints the full OTP **and** the user's full email whenever `RESEND_API_KEY` is unset. **It is unset in `server/.env` right now.** Anyone with Render log access can complete any login. `email.js:137` does the same whenever `NODE_ENV !== 'production'`.

**HIGH — message search queries logged in plaintext**
`index.js:335` logs `req.originalUrl` including the query string. `messages.js:48` reads `req.query.q`. Anyone searching chat history for a secret writes it to logs.

**HIGH — `VITE_SENTRY_DSN` is declared nowhere**
Absent from `render.yaml`, `server/.env.example`, and `client/`. Server Sentry may be live; **client Sentry and the React error boundary are almost certainly inert in production.**

**HIGH — 19 admin endpoints, zero input validators**
`express-validator` is installed (`server/package.json:28`) and used on 4 of 11 route files. `admin.js` has **0**. `messages.js`, `notifications.js`, `report.js`, `alignments.js`, `config.js`, `upload.js` also have 0.

**MEDIUM — Cloudinary delivery is public** (described above)

**MEDIUM — `/auth/me` returns the full user document**
Including `dob` and `email` (`auth.js:553-558`), which `AuthContext.jsx:88` `JSON.stringify`s into `localStorage['matchalize_user']`. Readable by any XSS or shared-device access.

**MEDIUM — admin force-disconnect doesn't invalidate the session**
`lastLogoutAt` exists and is enforced (`auth.js:102-106`), but `admin.js:342-358` never writes it. A kicked user keeps a valid cookie.

**MEDIUM — destructive routes have no rate limiter**
`DELETE /api/users/account`, `DELETE /api/alignments/:id`, `DELETE /api/messages/:id`, `POST /api/upload`, `PUT /api/users/location` (which forces a full 500-id deck re-rank — an amplification vector). Also all 22 admin routes.

**MEDIUM — `POST /api/users/change-college` has no limiter and an unguarded attempt counter**
`users.js:844` increments OTP attempts with **no `$lt: 3` guard**, unlike `auth.js:256`.

**MEDIUM — `express-mongo-sanitize@2.2.0` is Express-4-only**
Upgrading to Express 5 crashes at boot. Documented in-file (`index.js:14-27`).

**MEDIUM — shadowban is incomplete**
A shadowbanned user cannot edit their profile but **can still send Align** and still triggers notifications (`discover.js:1560-1575`).

**MEDIUM — local upload fallback is ephemeral**
`render.yaml` declares **no `disk:`**, so `server/uploads/` is wiped on every deploy and spin-down. A Cloudinary misconfiguration silently degrades to a broken, non-persistent target.

**LOW — unindexed queries**
`Report` has a unique compound index on `{reporter, reported}` only — `countDocuments({reported})` scans. `User.countDocuments({collegeCode})` does **not** use an index (the comment at `admin.js:460` claiming otherwise is wrong). No standalone `createdAt` index. Admin text search bypasses the existing text index by using regex (`admin.js:205-208`).

**LOW — `/health` deliberately does not touch the DB**
A lost Mongo connection is invisible: the instance serves 200s while every API call 500s. No `mongoose.connection.on('error'|'disconnected')` handlers exist.

**LOW — CSP `connect-src` contains a `*.onrender.com` wildcard**
`index.js:265`. Any Render service could be reached from the browser. `sameSite: 'lax'` limits the impact.

**LOW — rejected CORS origins are logged verbatim**
`index.js:216` logs an attacker-controlled string → log-injection surface.

**No backups.** Zero `mongodump` / backup configuration anywhere in the repo. `drop-waitlist.mjs:37` says *"There is no undo without a backup"* — and there is no backup. `npm run seed` (`server/package.json:14`) runs `deleteMany` with no guard preventing it from running against the production URI.

## Exact vs rounded location

Rounded to 2 decimal places (~1.1 km) before storage (`geo.js:96-103`). The exact value is never stored and never returned. `GET /api/users/location` returns only `{locationSource, active, storedDaysAgo}` — deliberately not the coordinates. **This is a genuine strength.**

## Account / media deletion behaviour

**Immediate:** all Cloudinary profile/bio/prompt photos destroyed; name → `'Deleted User'`; photos, bio, prompts, interests, intent cleared; alignments deactivated; blocks and notifications deleted; session cookie cleared.

**Retained:** `email` (30 days, to block re-registration and preserve moderation evidence), `Report` rows, Messages, Alignments, Interactions, and **chat media**.

**[CONFIRMED] The "background cleanup job" referenced at `users.js:904,946,951` does not exist.** No cron, no scheduler, no `setInterval` anywhere. Chat media and Messages are therefore retained **indefinitely**, contradicting the shipped privacy policy's 30-day promise.

---

# SECTION 8 — DEPLOYMENT AND SCALING

## Current setup

| Property | Value | Evidence |
|---|---|---|
| Provider | Render | `render.yaml:15-20` |
| Region | singapore | `render.yaml:20` |
| Plan | **`free`** | `render.yaml:19` |
| Instances | 1 | no `numInstances` key |
| Disk | **none** | no `disk:` key |
| Health check | `/health` | `render.yaml:52` |
| Build | `npm install --include=dev --prefix client && npm install --prefix server && npm run build --prefix client` | `render.yaml:43` |
| Start | `npm start --prefix server` | `render.yaml:50` |

**WebSockets: supported on all Render tiers including free.** Good news for future Roulette signaling.

**Restart loses:** `deckLocks`, `onlineUsers` (correct — sockets are gone), and **every queued push notification** — `shutdown()` (`index.js:526-554`) does not drain the queue.

## Environment configuration

17 variables declared in `render.yaml`. **Every secret-bearing key uses `sync: false` or `generateValue: true` — no secret values appear in the file.** But `sync: false` means the value lives only in the Render dashboard, so the repo cannot tell you what is actually set.

**Declared but possibly unset:** `FRONTEND_URL`, `MONGODB_URI`, `RESEND_API_KEY`, `RESEND_SENDER_EMAIL`, `CLOUDINARY_*`, `VAPID_*`, `SENTRY_DSN`, `ADMIN_EMAIL`.

**Read by code but NOT declared in render.yaml:** `VITE_SENTRY_DSN`, `VITE_API_URL`, `VITE_SOCKET_URL`, `API_GENERAL_MAX`, `OTP_EMAIL_LIMIT_MAX`, `OTP_VERIFY_MAX`, `COLLEGE_REQUEST_LIMIT_MAX`, `REVERIFY_MAX`, `SPLASH_TAGLINE`, `SPLASH_VIDEO_URL`.

**Dead flag:** `ALLOW_ALL_EMAILS` is set in `server/.env` and read by **zero lines of code**. `index.js:147-152` states it no longer gates anything. It is still described as live in `HANDOFF.md:51`.

## Multi-instance is currently unsafe — four confirmed breakages

| State | Location | Breaks because |
|---|---|---|
| `onlineUsers` | `socket/chat.js:9` | No Redis adapter. Instance B reports users as offline. Messages sent to a socket on another instance are **never delivered in real time** |
| `deckLocks` | `discover.js:1448` | In-process only. The code says so itself at `:1442-1443`. Deck race returns at full severity |
| All 6 rate limiters + global | `rateLimiters.js`, `index.js:367` | `express-rate-limit` default in-memory store. Every limit becomes N× weaker |
| `/api/config` 30s cache | `config.js:17-18` | Instances disagree for up to 30s |

**[CONFIRMED] `render.yaml:24-28` explicitly plans an upgrade to `starter` for roulette/presence.** That is precisely the upgrade that triggers all four.

## Health checks

`GET /health` at `index.js:406-412` returns 200 **without touching the database**. This is intentional and documented (`:402-405`) so a dependency outage doesn't cause pointless restarts. The cost is that DB loss is invisible.

## Database

- Mongoose `maxPoolSize: 20`, `serverSelectionTimeoutMS: 15000`, `connectTimeoutMS: 10000` (`db.js:6-10`)
- MongoDB Atlas M0 caps at ~100 concurrent connections cluster-wide → **5 instances would exhaust it**
- Reads go to primary — no secondary offload
- `retryWrites` not set (driver default `true`, correct for Atlas SRV) — **not configurable without editing code**
- `syncIndexes()` runs at boot and **refuses to start on failure** (`db.js:41-56`) — good
- No transactions used anywhere; all writes are single-document or independently idempotent

## In-memory queues and session state

| State | Lost on restart | Multi-instance safe |
|---|---|---|
| `deckLocks` (`discover.js:1448`) | Yes | **No** |
| `onlineUsers` (`socket/chat.js:9`) | Yes (correct) | **No** |
| Task queue (`utils/queue.js:27`) | **Yes — up to 1,000 pending notifications vanish silently** | Yes (no scheduling) |
| `/api/config` cache (`config.js:17`) | Cache only, harmless | **No** (stale up to 30s) |

`getQueueStats()` (`queue.js:104-111`) exists but **is never called by any route** — a wedged pool would be invisible.

## Database indexes and query patterns

`syncIndexes()` verifies all models at boot. Declared indexes are sound, but several queries are unindexed:

| Query | Site | Problem |
|---|---|---|
| `Report.countDocuments({reported, status})` | `report.js:65-68` | `reported` is 2nd in the compound → not usable as a prefix |
| `Report.find({status:'pending'})` | `admin.js:44,99` | No index on `status` |
| `User.countDocuments({collegeCode})` | `admin.js:543,606` | `collegeCode` is 6th in `discover_deck_filter_index`, not a prefix |
| `User.countDocuments({createdAt: {$gte}})` | `admin.js:41,367` | `createdAt` not indexed standalone |
| `User.countDocuments({lastActive: {$gte}})` | `admin.js:42-43` | Not indexed |
| `User.find({$or:[{name:rx},{email:rx}]})` | `admin.js:205-208` | Text index exists at `User.js:350` but regex bypasses it |
| `Message.find({..., text: {$regex}})` | `messages.js:60-65` | Regex cannot use an index |
| Deck `$sort` | `discover.js:838` | **In-memory sort of the whole eligible pool**, requires `allowDiskUse:true` |

## Pagination

Implemented via ObjectId cursor on messages (`messages.js:95-118`) and notifications. The deck uses a frozen 500-id window (`RANK_WINDOW=500`, `discover.js:398`) with a 24h TTL and 30-min idle expiry.

## Image loading and optimization

Client-side compression before upload (`Onboarding.jsx:1381-1432`): max dimension 1280, JPEG q0.85, skipped under 400 KB. Server transform 800×800, `quality: 'auto'`. Service worker deliberately **does not cache** cross-origin media (`public/sw.js:45-60`) — correct for privacy.

## Background jobs

**None.** Zero `setInterval`, zero cron libraries. Recurring cleanup is handled by MongoDB TTL indexes (OTPs, impressions, sessions, notifications) which are multi-instance safe. `reverify-sweep.mjs` is a **manual** substitute for a cron — nothing invokes it automatically.

## Monitoring and error handling

- **Sentry server-side: wired** (`index.js:54-61`, error handler at `:439-441`, captured at `:474,561,572`). Traces + profiles at 20% sampling.
- **Sentry client-side: gated on `VITE_SENTRY_DSN`, which is declared nowhere → almost certainly inert in production.**
- **No Winston/Pino/Datadog/New Relic.** All server logging is raw `console.*` to stdout — unstructured, unleveled, no request IDs.
- Central Express error handler: 4-branch cascade (`index.js:444-482`), no stack traces in responses.
- `uncaughtException` → Sentry flush → `exit(1)` (correct). `unhandledRejection` → log + Sentry + **keeps running** (`index.js:559-566`) — the standard footgun.

## Scale scenarios

| MAU | Likely first bottleneck |
|---|---|
| **1,000** | Probably fine. Free Render spin-down hurts UX. M0's 100 ops/sec becomes noticeable under deck ranking |
| **10,000** | **M0 is the hard wall.** The deck's full-pool aggregate with `allowDiskUse` competes for the same 100 ops/sec. Rate limiter memory store. Single-instance socket capacity |
| **50,000** | Requires: paid Render, M10+ Mongo, **Redis for rate limits + presence + pub/sub**, and a queue that isn't in-process |
| **100,000** | Needs a real media architecture decision, a CDN strategy, and a moderation staffing plan. Cannot be extrapolated from this codebase |

**Peak simultaneous users/calls: unknown.** No load testing exists. **No plan can be promised for a user count without one.**

## CI

`.github/workflows/ci.yml` (90 lines) runs on every push to main and every PR. Gating steps:

| Step | Blocks PR? |
|---|---|
| Lint client + server (oxlint) | ✅ Yes |
| Build client (vite build) | ✅ Yes |
| Dump freshness (`regenerate_dumps.py --check`) | ✅ Yes |
| Server syntax check (`node --check` on 9 files) | ✅ Yes |
| Server boots | ❌ No |
| **Any actual test** | ❌ **No — zero automated tests run in CI** |
| QA harness job | ❌ **Commented out** (`ci.yml:70-90`, "deliberately") |

**Additional gaps:** CI uses **Node 20** while Render runs **Node 22**. Only 9 of ~20 server files are syntax-checked — `auth.js`, `admin.js`, `colleges.js`, `report.js`, `upload.js`, `config.js`, `socket/chat.js`, and all `utils/*` are **not** checked at all.

---

# SECTION 9 — PROVIDER PLANS AND CURRENT COSTS

*All verified from official sources, 2026-10-16.*

| Service | Actually used? | Plan confirmable from code? | Current price | What causes charges |
|---|---|---|---|---|
| **Render** | Yes | **Partly** — `plan: free` at `render.yaml:19` | Hobby $0 + Free compute $0 (512 MB). Upgrade `0.5c-512mb` = **$7/mo**. Bandwidth 5 GB included then **$0.15/GB**. Builds 500 min/mo then $5/1K. WebSockets ✓. Log retention 7 days. 750 instance-hours/mo | Bandwidth, build minutes, upgrade |
| **MongoDB Atlas** | Yes | **No** — dashboard only | **M0 free forever: 512 MB storage, 32 MB sort memory, 100 ops/sec**. Flex $0.011/hr (~$8/mo). M2 $9/mo. M10 $0.08/hr (~$57/mo) | Cluster tier, storage, egress (Free/Flex not charged egress) |
| **Cloudinary** | Yes | **No** — dashboard only | **Not verified this session** | Transformations, storage, bandwidth |
| **Resend** | Code present, **key empty locally** | **No** — dashboard only | Free: **$0, 3,000/mo, 100/day cap**, 3 domains, 30-day retention. Pro $20/mo = 50,000/mo | Volume over plan; extra domains $20/mo |
| **Cloudflare TURN** | **NO** | N/A | **$0.05/GB egress, first 1,000 GB/mo free** (shared SFU+TURN) | Billable GB over 1,000 |
| **Twilio TURN** | No | N/A | $0.40/GB US/EU · **$0.60/GB Mumbai** | Volume |
| **Metered** | No | N/A | $99/150 GB, $199/500 GB, $499/2 TB — all **ingress + egress** | Volume |
| **Sentry** | Wired | **No** — DSN `sync: false` | Free tier exists | Event volume |

## Notes per provider

**Render** — cheapest always-on option is the `0.5c-512mb` plan at **$7/mo**. Hobby workspace is $0. WebSockets work on free, which is genuinely useful.

**MongoDB Atlas** — the **100 ops/sec** limit on M0 is shared across the entire cluster. A full-pool aggregation with in-memory sort is expensive. **[CONFIRMED] This is the first wall you will hit, and it arrives long before bandwidth costs anything.**

**Resend** — the Free plan is capped at **100 emails/day**, which is the binding constraint, not the 3,000/month figure. With 7-day JWTs, OTP volume should be low.

**Cloudflare vs Twilio vs Metered** — Cloudflare is ~8× cheaper than Twilio US/EU and ~12× cheaper than Twilio Mumbai, with a 1,000 GB free allowance on top. **Metered is the most expensive**, not the cheapest, and its plans count **ingress + egress** while Cloudflare bills edge→client egress, so the headline $/GB figures are **not directly comparable**.

**⚠️ Critical caveat:** an env var present in `render.yaml` proves nothing about what is set in the Render dashboard. Every `sync: false` value is dashboard-only.

## Usage data, alerts, budget controls

- **Usage data available:** Render (service metrics, dashboard). MongoDB (billing breakdown, Cost Explorer). Resend (usage page). No in-app usage telemetry for anything.
- **Alerts in code: none.** No billing alerts, no usage caps, no TURN spend limit, no quota on uploads.
- **Rate limiters are the only cost control**, and the global one is 1,000 requests / 5 min / IP.

## What remains unknown

Whether `RESEND_API_KEY` is set on Render · whether `SENTRY_DSN` is set · which MongoDB tier · which Cloudinary tier · whether Atlas backups are enabled · actual monthly spend on any provider.

---

# SECTION 10 — HYPOTHETICAL COST MODEL

**These are scenarios, not forecasts. No call has ever been made. No bandwidth figure here is measured.**

## The formula, in plain words

```
GB per relayed call-hour  =  bitrate (Mbps) × 0.9
```

Why: two people talking for one hour is **1 call-hour** (not 2). In a two-sided TURN relay, both streams leave Cloudflare, so egress is `bitrate × 2`. At 1 Mbps that is `2 × 3600 ÷ 8 ÷ 1000` = **0.9 GB per call-hour**. A **one-sided** relay is roughly **half** that.

**Assumptions:**
- Exchange rate **₹85/$ — my assumption, not verified**
- Direct P2P costs ₹0 — the video never touches your infrastructure
- Billable GB = relay share × call-hours × GB/hr
- **Cloudflare bills egress to TURN clients** (`developers.cloudflare.com/realtime/pricing`)

## Hypothetical bitrate assumptions

*Resolution alone does not set bitrate. These are explicit guesses.*

| Label | Video | Audio | Combined | GB per relayed call-hour |
|---|---|---|---|---|
| 360p | 0.6 Mbps | 0.03 | ~0.6 | 0.54 |
| 480p | 1.0 Mbps | 0.03 | ~1.0 | 0.90 |
| 720p | 2.0 Mbps | 0.03 | ~2.0 | 1.80 |
| 1080p | 4.0 Mbps | 0.03 | ~4.0 | 3.60 |

## Scenario A — IITB pilot

| Input | Value |
|---|---|
| MAU | 200 |
| Fraction using Roulette | 40% → 80 video users |
| Sessions per user per day | 2 → 160 calls/day |
| Call length | 5 min |
| Call-hours/month | 160 × 5/60 × 30 = **400** |
| Relay share | 25% → 100 relayed call-hours |
| Bitrate | 360p, 0.54 GB/call-hour |
| **Billable GB** | **54 GB** |
| Free allowance | 1,000 GB |
| **Overage charge** | **₹0** |

## Scenario B — small public beta

| Input | Value |
|---|---|
| MAU | 2,000 |
| Fraction using Roulette | 30% → 600 video users |
| Sessions per user per day | 3 → 1,800 calls/day |
| Call length | 6 min |
| Call-hours/month | 1,800 × 6/60 × 30 = **5,400** |
| Relay share | 25% → 1,350 relayed call-hours |
| Bitrate | 480p, 0.90 GB/call-hour |
| **Billable GB** | **1,215 GB** |
| Free allowance | 1,000 GB |
| Overage | 215 GB × $0.05 = **$10.75 ≈ ₹915/mo** |

## Scenario C — growth

| Input | Value |
|---|---|
| MAU | 10,000 |
| Fraction using Roulette | 30% → 3,000 video users |
| Sessions per user per day | 3 → 9,000 calls/day |
| Call length | 6 min |
| Call-hours/month | 9,000 × 6/60 × 30 = **27,000** |
| Relay share | 25% → 6,750 relayed call-hours |
| Bitrate | 480p, 0.90 GB/call-hour |
| **Billable GB** | **6,075 GB** |
| Free allowance | 1,000 GB |
| Overage | 5,075 GB × $0.05 = **$253.75 ≈ ₹21,570/mo** |

**Same Scenario C at 720p instead of 480p:** 6,750 × 1.8 = 12,150 GB → 11,150 over → **≈ ₹47,400/mo.**

*Resolution choice is close to a direct cost multiplier.*

## All cost categories

| Category | Scenario A | Scenario B | Scenario C |
|---|---|---|---|
| **A. Video/TURN** | ₹0 | ~₹915 | ~₹21,570 |
| **B. Hosting** (Render) | ₹0 → ₹595 needed for always-on | ₹595 | ₹595–₹2,100 |
| **C. Database** | ₹0 (M0, ops-capped) | ₹0–₹680 | ₹680–₹4,800 |
| **D. Images** (Cloudinary) | Not verified | Not verified | Not verified |
| **E. Email** (Resend) | ₹0 (3k/mo free) | ₹0 (watch the 100/day cap) | ~₹1,700 at 50k/mo |
| **F. Moderation tools** | ₹0 (manual) | ₹0 (manual) | Unknown — not priced |
| **G. Human moderation** | ₹0 (founder) | **₹0–15,000** | ₹30,000+ |
| **H. Monitoring / backups** | ₹0, **no backups** | ₹0, **no backups** | Unknown |
| **I. Legal / security** | ₹0 | **₹20,000–₹75,000** one-off | Recurring |
| **J. Domain** | ~₹80/mo amortised | same | same |

## Exclusions and uncertainty

- Cloudinary pricing **not verified**
- No moderation tooling priced
- Human moderation (category G) is the line most likely to dominate and the hardest to forecast
- **The ₹0 figures assume the free tiers hold, and MongoDB M0's 100 ops/sec will likely break before any video bill appears**
- **Nothing here is measured.** No call has ever been placed.

---

# SECTION 11 — TESTS AND EVIDENCE

## Tests I ran

**None.** No app was started, no test executed, no database touched, no provider contacted. This audit is static code inspection only. **I am not reporting any passing test.**

## What exists

| Asset | Detail |
|---|---|
| Playwright QA harness | `server/tests/qa/` — real browser, real server, **14 scenes**, 240s wall-clock cap each, writes `REPORT.md` + `index.html` + videos. Run via root `npm run qa` |
| QA society seeder | `server/tests/society/` — ~40 deterministic personas, emails `@iitb.ac.in` |
| Verification scripts | `server/scripts/verify-deck-metrics.mjs` (asserts zero-repeat across a deck drain, `:209`), `verify-location-swap.mjs` |
| CI gate | `ci.yml:54-55` — dump freshness |

**Roulette scene: does not exist.** And **`s13` is missing** from the scene sequence (`scenes.mjs:151-222`), between `s12` and `s14`.

## What was not tested

| Gap | Impact |
|---|---|
| **The QA job is commented out in CI** (`ci.yml:70-90`) | 21 lines disabled, "deliberately". **Zero automated tests run on any push or PR** |
| CI uses **Node 20**; Render runs **Node 22** | Production runtime is never tested |
| Server is never booted in CI | Top-level-await failures invisible |
| Only 9 of ~20 server files are `node --check`ed | `auth.js`, `admin.js`, `colleges.js`, `report.js`, `upload.js`, `config.js`, `socket/chat.js`, all `utils/*` are unchecked |

## What requires what to test

| Requires | To test |
|---|---|
| **Two real devices + two accounts** | Anything involving Roulette; also mutual match, letterbox accept, chat between distinct users |
| **Campus Wi-Fi + mobile data** | Location bands, TURN fallback rate, push reliability, connect success |
| **Production / dashboard access** | Provider plans, env vars actually set, backups, Cloudinary delivery settings |
| **Load testing** | Everything in §8 — no capacity claim is possible without it |

---

# SECTION 12 — WHAT WE CAN HONSTLY TELL INVESTORS

## 1. What is built

> "A verified-college-student social platform with a working discovery, matching and messaging product. Sign-up is gated on institutional email addresses. Users build profiles, browse a ranked cross-campus deck, match reciprocally, and chat in real time. There is a moderation pipeline with reporting, shadowban thresholds, suspension, and an operator review queue. Deployed on Render with MongoDB, Cloudinary and web push."

## 2. What remains

> "A live-video Roulette feature is designed but not built — there is no queue, no calling infrastructure and no media integration. We have not run a load test or a two-device call. Automated test coverage is not yet in CI. We are pre-revenue and pre-launch."

## 3. Claims to avoid until validated

❌ "first" / "only" in this category
❌ "production-ready"
❌ "fully secure" or "unlimited"
❌ "users" — say **demo viewers** about the 50–60 IITB people
❌ "safe because verified students"
❌ any MAU, retention or engagement figure
❌ "moderation by TURN"
❌ any bandwidth figure presented as measured

## 4. Claims requiring founder confirmation

Total real signups · DAU/WAU · match rate · message rate · how many of the 50–60 IITB people **created accounts** vs. saw a demo · whether `seedRealistic.js` was ever run against production · whether `RESEND_API_KEY` is set on Render · whether the deck's platform-wide scope was deliberate

## 5. Next measurable pilot milestones

1. Resolve brand + legal entity
2. Decide deck scope
3. Deploy and verify with 10 real IITB students
4. Measure D1 and D7 retention
5. Measure deck-view → match → message conversion
6. Fix the CI test gate
7. **Then** size Roulette

---

# SECTION 13 — PRIORITIZED NEXT STEPS

*No completion dates are given, because none can be responsibly estimated from this codebase.*

## Must fix before private testing

| Issue | Evidence | Why it matters | Next step | Dependency |
|---|---|---|---|---|
| Plaintext OTP in logs | `email.js:97,137` | Anyone with log access can log in as anyone | Remove or gate behind an explicit dev-only flag | Resend key |
| `VITE_SENTRY_DSN` missing | absent from `render.yaml` | Client errors are invisible | Add as a build-time var | Render dashboard |
| Brand / legal entity split | `index.html:25`, `Header.jsx:174`, `Settings.jsx:653-779` | Users agree to terms under a different name than they see | Pick one name; update legal text | **Founder decision** |
| Three product domains | `matchalize.com` / `.app` / `huh.app` | Broken links, wrong sender identity | Consolidate | **Founder decision** |

## Must fix before IITB launch

| Issue | Evidence | Why it matters | Next step | Dependency |
|---|---|---|---|---|
| **Deck scope undecided** | `discover.js:254-260` | Code is global; your plan says intra-only | Decide: global, campus-only, or user-toggle | **Founder decision** |
| **No backups** | 0 matches repo-wide | Data loss is unrecoverable | Enable Atlas backups; **test a restore** | Atlas dashboard |
| **Cleanup job doesn't exist** | `users.js:904` vs. no cron | Privacy Policy promises 30d; reality is forever | Either build the job or correct the policy | **Founder decision + legal** |
| Message search logged | `index.js:335` + `messages.js:48` | Users' private searches written to logs | Strip query strings from the request log | — |
| Admin endpoints unvalidated | `admin.js` 19 handlers, 0 validators | Malformed input to destructive routes | Add `express-validator` | — |
| Mongo M0 ops ceiling | 100 ops/sec shared | Deck ranking will stall before launch | Load test against M0 | Atlas dashboard |

## Can wait until after launch

| Issue | Evidence |
|---|---|
| Dead code: `AuthFlow.jsx` (912 lines), `react-router-dom`, `react-pageflip`, `canvas-confetti`, `gsap` | Zero importers/refs |
| Dead fields: `shadowbanScore`, `COLLEGE_MAP`, three of five admin setting keys | Never read |
| Client identifier rename (`Matches.jsx`, `['matches']` query keys, `match-*` CSS) | ~95% done in copy, ~0% in identifiers |
| Unindexed admin queries | `admin.js:41-43, 205-208, 543` |
| `/health` DB-blind spot | `index.js:406-412` |
| `express-mongo-sanitize` Express-5 landmine | `index.js:14-27` |
| Incomplete shadowban (can still align) | `discover.js:1560-1575` |
| `GET /health` never exposing queue stats | `queue.js:104-111` |

## Needs a founder / product decision

Deck scope · brand and legal entity · whether `ALLOWED_COLLEGES` stays at `iitb` (`render.yaml:130-131`) · age policy beyond self-reported DOB · whether to pay for always-on hosting · whether to build Roulette at all yet · monetisation model

## Needs external legal / security expertise

IT Act / IT Rules intermediary obligations · age assurance expectations · whether on-report recording is advisable · privacy policy and ToS review against the chosen brand · a security review before handling real student data at scale · DPDP consent language verification

---

# SECTION 14 — QUESTIONS ONLY THE FOUNDER CAN ANSWER

1. **Is `RESEND_API_KEY` set on Render?** Locally it is empty, so OTPs print to logs and no email is sent. If it is also empty in production, sign-up is silently broken.
2. **Which providers are on which plan?** MongoDB (M0 or paid?), Cloudinary, Sentry, Resend. Only a dashboard reveals this.
3. **Has `seedRealistic.js` ever been run against the production database?** It creates 1,200 users and deletes all colleges, with no in-app marker.
4. **Real numbers:** how many people created accounts, how many are active weekly, how many matches and messages occurred?
5. **Is the platform-wide deck intentional?** This is the single biggest product-scope question in the repo.
6. **Which brand is the legal entity**, and what domain owns it?
7. **Target launch size and date?** Determines whether free-tier limits are survivable.
8. **Is 18–40 self-reported DOB sufficient**, or do you intend stronger age assurance?
9. **Budget:** can you afford ~$7/mo for always-on hosting? Roulette requires it.
10. **Monetisation:** what are you willing to charge, and for what? Nothing exists in code.
11. **Are `SENTRY_DSN` and `VITE_SENTRY_DSN` set anywhere?**
12. **Is Atlas backup enabled?** Nothing in the repo suggests it is.

---

# APPENDIX A — BRANDING INCONSISTENCY (full detail)

Both brands are live, simultaneously, in production-facing surfaces.

## "huh?" — in code and config (shipping to users)

| Location | Surface |
|---|---|
| `render.yaml:98` | `RESEND_SENDER_NAME` value — **the From display name on every OTP email** |
| `server/utils/email.js:31` | `senderName()` default |
| `client/src/pages/Splash.jsx:898, 1238, 1831, 1838, 1919, 1982, 2045, 2400` | Landing page content + `aria-label`s |
| `client/src/pages/Auth.jsx:1496, 2083` | Auth screen headline + aria-label |
| `client/src/pages/AuthFlow.jsx:641, 717, 758, 836, 886` | 5 auth-flow headlines (dead code) |
| `server/index.js:503` | "Another Matchalize server is already running" (operator-facing) |

## "Matchalize" — in code and config (also shipping)

| Location | Surface |
|---|---|
| `client/index.html:25` | **`<title>Matchalize — Your Campus. Your Story.</title>`** — the browser tab title |
| `client/src/components/Header.jsx:174, 182, 184` | **The wordmark rendered in the app header** |
| `client/src/pages/Settings.jsx:647` | `support@matchalize.com` |
| `client/src/pages/Settings.jsx:653, 712, 728, 733, 779` | **Privacy Policy + Terms of Service** |
| `client/src/components/LearnMoreSheet.jsx:167` | `mailto:support@matchalize.com` |
| `client/src/components/AccountSuspendedScreen.jsx:103, 104, 144` | support email, appeal mailto, "Matchalize Support" |
| `client/src/pages/Profile.jsx:716` | `mailto:support@matchalize.com` |
| `server/utils/push.js:9` | `mailto:admin@matchalize.app` — push-notification fallback |
| `server/utils/push.js:46` | `title: 'Matchalize'` — push-notification default title |
| `server/routes/users.js:461` | `'… Contact support@matchalize.com'` |
| `server/routes/report.js:143` | `title: 'Matchalize'` |
| `server/index.js:423` | `GET /` → `'Matchalize API Server is running'` |

## Internal-only occurrences (harmless, but do not rename casually)

localStorage keys (`matchalize_user`, `matchalize_suspended`, `matchalize_discover_*`, `matchalize:theme`, `matchalize:pushState`) · service worker cache name `matchalize-v3` (`public/sw.js:7`) · auth cookie `matchalize_jwt` (`appData.js:269`) · Cloudinary folder prefixes `matchalize/photos/`, `matchalize/audio/` (`media.js:6,7,87,88`; `upload.js:45,46`; `messages.js:34,35`) · test DB `matchalize_test` · package names.

**⚠️ Changing the Cloudinary folder prefix would orphan all live media.**

## ⚠️ THREE different domains for one product

- **`matchalize.com`** — user-facing support + legal
- **`matchalize.app`** — push notifications
- **`huh.app`** — the Resend sending domain
- Plus **`*.onrender.com`** in the CSP

**`huh-app` does not exist anywhere in the repository** (0 hits). If a `huh-app.onrender.com` service was ever deployed, it is not recorded in this codebase.

**Legal exposure:** the shipped Privacy Policy and ToS name **"Matchalize"**, while the product, the landing page, and every OTP email say **"huh?"**. A user signing up under "huh?" with a college email is agreeing to terms for a differently-named entity. **Resolve before the IIT-B pilot.**

---

# APPENDIX B — DOCUMENTATION INVENTORY AND STALENESS

## Root documentation files

| File | Size | Topic | Status |
|---|---|---|---|
| `summary.md` | this file | **This audit** | **Current** |
| `HANDOFF.md` | 10 KB | Status report | **MOST STALE — ~12 weeks old** |
| `Applied.md` | 32 KB | Session decisions | Stale |
| `errors.md` | 40 KB | Findings list | Stale |
| `newissues.md` | 7.5 KB | Consolidated issues | Working list |
| `solved.md` | 1.4 KB | 5 verified fixes | Superseded by errors.md |
| `TOAST-CHANGES.md` | 43 KB | Notification review log | Working log |
| `Research.md` | 106 KB | Deck algorithm research | Notes |
| `deck.md` | 216 KB | Pitch deck source | Generated |
| `matchalize_full_dump.md` | 1.5 MB | Full codebase dump | Generated |
| `server_dump.md` | 550 KB | Server-only dump | Generated |
| `codebase.txt` | 726 KB | Monolith dump | **VERY STALE** — points at `/Users/adibhati/Documents/vybe` |
| `claude-chat.html` | 9 KB | Saved chat | **VERY STALE** — same dead path |
| `AI` | 22 KB | Raw AI conversation log | **UNTRACKED** |
| `.opencode/summary.md` | 4.8 KB | Session summary | **VERY STALE** — different repo path |
| `ambitions/roulette.md` | 13 KB | Roulette design spec | **UNIMPLEMENTED** |

## `HANDOFF.md` claims contradicted by current code

| Claim | Line | Reality |
|---|---|---|
| "client/src/pages — 7 files" | `:26` | **11** |
| "server/routes — 9, including `matches`" | `:29` | **11**; `matches.js` **does not exist** |
| "server/models — 10, including `Match`" | `:30` | **16**; `Match.js` **does not exist** |
| "server/utils — 5" | `:34` | **13**; `asyncHandler.js` **does not exist** |
| "no custom error utility" | `:46` | **FALSE** — `utils/AppError.js` exists |
| "Per-IP for OTP" | `:47` | **FALSE** — both OTP limiters are keyed **by email**, deliberately |
| "`ALLOW_ALL_EMAILS=true` bypasses `.ac.in`" | `:51` | **FALSE** — read by zero lines of code |
| "No admin dashboard for reports" | `:148` | **FALSE** — `Admin.jsx` + 19 admin endpoints |
| "No CI/CD pipeline" | `:150` | **FALSE** — `ci.yml` runs 10 gating steps |
| "No E2E or unit tests" | `:149` | **MISLEADING** — a Playwright harness exists, just not in CI |
| "verified via `.ac.in`" | `:3` | **STALE** — now per-college domains, any TLD |

**Practical consequence:** handing an AI or an investor `HANDOFF.md` produces confidently wrong answers. `summary.md` is correct as of 2026-10-16 and will go silently stale.

---

# APPENDIX C — SECRETS EXPOSURE AUDIT

**[CONFIRMED] No committed secrets. The repository is clean.**

| Pattern searched | Hits |
|---|---|
| Resend `re_[A-Za-z0-9]{15,}` | **0** |
| `mongodb+srv://` | **0** |
| `cloudinary://` | **0** |
| AWS `AKIA…` | **0** |
| Private key blocks | **0** |
| GitHub `ghp_…` | **0** |
| Stripe `sk_live_` / `sk_test_` | **0** |
| Slack `xox[baprs]-` | **0** |
| Google `AIza…` | **0** |
| Long literals assigned to secret-named variables | **0** |

**`git ls-files | grep -i env`** returns only `server/.env.example` and `server/tests/lib/env.mjs` — both non-secret.

**`git log --oneline --all -- '*.env' 'server/.env'`** returns **empty**. No `.env` was ever committed.

**`.gitignore` coverage** — root `.gitignore:7-14` covers `.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`, `.env.qa`, `/server/.env`, `/server/.env.test`. `server/.gitignore:1` adds `.env`. `uploads/` and `client/dist/` also ignored.

## The one secret-shaped literal in a tracked file

| Location | Nature | Severity |
|---|---|---|
| `server/tests/lib/env.mjs:51` | `serverEnv.JWT_SECRET \|\| '<hardcoded-test-secret>'` | **Low.** Test-only fallback, unreachable in production because `index.js:64-70` hard-fails boot without `JWT_SECRET` |

## Dump-generator leak vector (currently closed)

`regenerate_dumps.py:83` `SKIP_NAMES` excludes `.env` but **not `.env.test`**. It is currently safe only because `.test` is not in `SOURCE_EXTS` (`:86-90`). **[INFERRED] If anyone adds `.test` to `SOURCE_EXTS`, `server/.env.test` would be committed into a dump.** Recommend adding `.env.test` to `SKIP_NAMES`.

Scanned all committed dumps and monoliths for every secret pattern: **0 hits.**

## Local `.env` files (gitignored, not in git)

`server/.env` — SET: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `ALLOW_ALL_EMAILS`, `FRONTEND_URL`, `RESEND_SENDER_EMAIL`, `RESEND_SENDER_NAME`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `ADMIN_EMAIL`, `OTP_HASH_SECRET`, `NODE_ENV`. **EMPTY: `RESEND_API_KEY`.**

`server/.env.test` — SET: `NODE_ENV`, `PORT`, `ALLOW_ALL_EMAILS`, `ADMIN_EMAIL`, `FRONTEND_URL`, `RESEND_SENDER_EMAIL`, `RESEND_SENDER_NAME`, `OTP_VERIFY_MAX`, `API_GENERAL_MAX`. **EMPTY: `RESEND_API_KEY`, `CLOUDINARY_*`, `VAPID_*`, `SENTRY_DSN`.**

*Values intentionally not reproduced.*

---

# APPENDIX D — LOGGING HYGIENE

## Risky logging

| Location | What | Risk |
|---|---|---|
| `server/utils/email.js:97` | Full plaintext OTP **+ full email** | **CRITICAL** when `RESEND_API_KEY` unset — the current local state |
| `server/utils/email.js:137` | Full OTP + email when `NODE_ENV !== 'production'` | **HIGH** — fires even with a valid key |
| `server/utils/email.js:43` | Email + college name | Medium |
| `server/index.js:335` | `req.originalUrl` **including query string** | **HIGH** — `messages.js:48` reads `req.query.q`, so chat searches are logged |
| `server/index.js:560, 473` | Raw promise / error objects | Medium — Mongoose errors embed the offending document |
| `server/routes/auth.js:212, 380, 560` | Raw errors | Medium — filter contains `email` |
| `server/socket/chat.js:79, 228` | Full name + userId on connect/disconnect | Low |
| `server/routes/auth.js:98-100` | Admin email on bootstrap | Low |
| `server/index.js:216` | Rejected CORS origin verbatim | Low — log-injection surface |

## Confirmed NOT logged

- **No JWT, token, or cookie value is ever printed.** `jsonwebtoken` errors carry only `name` + `message`.
- **`req.body` is never printed.**
- **No message content is logged** (though the first 100 chars do go to the push provider).
- **No password hash or OTP hash is printed.**

## Mitigating controls

`index.js:92-94` warns when no Resend key · `index.js:113-137` hard-errors if a key is set but the sender is still the sandbox address · `index.js:138-140` warns if `OTP_HASH_SECRET` is unset · `index.js:82-87` fails closed on invalid `NODE_ENV` · `auth.js:442` gates `__testOtp` on `NODE_ENV === 'test'`.

---

# APPENDIX E — RATE LIMITING COVERAGE

## Global

`index.js:367-374` — 5 min window, 1,000 max, keyed by `req.ip` (with `trust proxy = 1`). Mounted at `/api/`.

## Named limiters

| Limiter | Window | Cap | Key | Applied at |
|---|---|---|---|---|
| `messageLimiter` | 10 min | 30 | user → IP | `messages.js:126,253` |
| `discoverLimiter` | 10 min | 100 | user → IP | `discover.js:1785,1787` |
| `verifyOtpLimiter` | 15 min | 15 | **email** | `auth.js:223,454` |
| `otpEmailLimiter` | 60 min | 5 | **email** | `auth.js:150` |
| `collegeRequestLimiter` | 60 min | 5 | **IP** | `colleges.js:87` |
| `reverifyLimiter` | 15 min | 10 | user → IP | `auth.js:400` |

OTP limiters are keyed **by email, not IP**, deliberately — campus NAT would otherwise lock out an entire hostel (`rateLimiters.js:23-26, 41-45`).

## Destructive or expensive routes with NO dedicated limiter

`POST /api/auth/logout` · `GET /api/auth/me` · `POST /api/users/change-college` (**unguarded OTP attempt counter**) · `DELETE /api/users/account` · `POST /api/users/logout-all` · `PUT /api/users/profile` (triggers a Cloudinary delete per removed photo) · `PUT /api/users/location` (**forces a full 500-id deck re-rank — amplification vector**) · `PUT /api/users/onboarding/save` · `POST /api/report/:userId` · `POST /api/report/block/:userId` · `DELETE /api/report/block/:userId` · `POST /api/notifications/:id/accept` · `DELETE /api/alignments/:id` · `DELETE /api/messages/:alignmentId/:msgId` (**destroys a Cloudinary asset**) · `POST /api/upload` (**cost-bearing**) · `GET /api/config` · `GET /api/colleges` · **all 22 `/api/admin/*` routes**

---

# APPENDIX F — SOURCES FOR PRICING

All checked **2026-10-16**:

| Provider | Source |
|---|---|
| Cloudflare TURN | `developers.cloudflare.com/realtime/pricing`, `/realtime/turn/faq` |
| Twilio TURN | `twilio.com/en-us/stun-turn/pricing` |
| Metered TURN | `metered.ca/stun-turn` |
| Render | `render.com/pricing` |
| MongoDB Atlas | `mongodb.com/pricing` |
| Resend | `resend.com/pricing` |
| Cloudinary | **Not verified this session** |

---

# "SHARE THIS WITH THE OTHER AI"

**Stack.** React 19.2 + Vite 8 (plain JSX, no TypeScript, **no router** — `useState` switcher) · Node 22 / Express 4.19 · MongoDB Atlas + Mongoose 8.4 · Socket.IO 4.7 (chat only) · Resend (OTP) · Cloudinary (public delivery) · Web Push/VAPID · Sentry (server wired, client not) · **Render singapore, `plan: free`, single combined service, no disk, no backups.** Zero WebRTC, zero payments, zero third-party analytics.

**Working.** College email OTP sign-up (10-min expiry, 3 attempts, HMAC-stored codes) · 8-step onboarding with draft autosave · profile CRUD with 4 photos / 3 prompts / 10 interests · **platform-wide ranked deck** with distance bands, ladder gating (score ≥75), 10 aligns/day · mutual matching via atomic upsert · Letterbox with race-safe accept · persistent messaging with per-route authorization, socket delivery, read receipts, reactions, soft delete · report/block with shadowban (3) and suspend (5) thresholds · admin panel with 19 endpoints incl. report queue and college CRUD · coarse location (2-dp rounding, band labels only) · account deletion (soft) · PWA with web push.

**Partial / missing.** Deck is **global, not campus-filtered** — `?campusOnly` was deliberately removed · **Roulette is a 125-line placeholder**, zero backend · group finder **not found** · double-date **not found** · payments/premium **not found** · appeals (mailto only) · repeat-account detection · background cleanup job **referenced in code but does not exist** · no scheduled jobs · no load tests · no CI test gate (QA job commented out).

**Roulette status.** Screen only. No queue, no queue store, no signaling, no `RTCPeerConnection`, no `getUserMedia` outside voice notes, no STUN/TURN, no Cloudflare or coturn integration, no masking, no skip/rematch, no in-call reporting, no measurement. `Alignment` has no `origin` field. No roulette QA scene (`s13` missing from the sequence).

**Data / privacy.** No passwords exist. JWT in httpOnly cookie. Media ownership enforced per-user Cloudinary folders. Location rounded to ~1.1 km, never exposed. **Issues: plaintext OTP logged when the Resend key is empty; message-search queries logged; Cloudinary delivery is fully public; `/auth/me` puts DOB + email into localStorage; admin force-disconnect never invalidates the session; 19 admin endpoints have zero validation; Cloudinary folder names embed the user's ObjectId.**

**Deployment.** One Render service serving both API and client. Free tier spins down after 15 min idle. **Scaling to 2+ instances silently breaks presence, deck race protection, real-time message delivery, and all rate limiters — and `render.yaml` already plans that upgrade.** Mongoose pool 20; Atlas M0 caps ~100 connections cluster-wide. Restart drops all queued push notifications.

**Costs.** Currently $0 across Render / Mongo / Resend. Cloudflare TURN would be **$0.05/GB with the first 1,000 GB/month free** (verified 2026-10-16). Hypothetical: IITB pilot ₹0 TURN; 10k MAU ≈ ₹21,570/mo at 480p, ≈ ₹47,400/mo at 720p. **The likely first real ceiling is MongoDB M0's 100 ops/sec, not bandwidth.** No billing alerts or spend caps exist anywhere.

**Top launch blockers.** (1) Unresolved brand + legal entity. (2) Undecided deck scope. (3) No backups. (4) Deletion-retention promise unfulfilled. (5) Logging leaks. (6) Unvalidated admin routes.

**Decisions needed.** Brand and legal entity · deck scope · age-assurance standard · whether and when to build Roulette · monetisation model · paid-hosting budget.

**Do not claim.** "first", "only", "production-ready", "fully secure", "unlimited", any MAU/engagement figure, or that demo viewers are users. Do not state that college verification proves age or makes the product safe. Do not present any bandwidth figure as measured — no call has ever been placed.