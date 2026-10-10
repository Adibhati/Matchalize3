# Matchalize Discover Deck — Execution Plan

Decided across conversation with the user. Every choice traces to an explicit answer.
Read-only artifact — no code has been written.

## Decisions (all user-confirmed)

| Decision | Answer |
|---|---|
| Deck re-roll | Automatic after 30 min idle |
| Exhausted deck | Rebuild immediately — never show a dead end |
| "New deck" button | **Dropped** — not an industry pattern |
| Genuinely empty pool | Honest "You're all caught up" screen |
| Session storage | `_id`s, never names (duplicate names are safe) |
| Page size | **Unchanged at 10** |
| Prefetch threshold | Raised 4 → 6 |
| Away from campus | College cap drops; nearest people fill the page |
| Campus within 30km of GPS | Own college takes the 2 slots |
| Campus beyond 30km | Nearest campus takes the 2 slots |
| College cap | Max 2 per page, random positions |
| Distance bands | 0–30 "Near you", 30–100 "In your area", 100–300 "Further away", 300+ no label |
| Band labels | Bands 0–2 only; band 3 shows college badge alone |
| Band order | Nearest band first |
| Intent | Ranking signal, **never** a hard filter |
| Shared interests | Server-side tiebreak, replaces stale localStorage read |
| Quality score | Final tiebreak within a band |
| Missing data | Reads as **unknown**, never as zero or "nearby" |
| GPS | Browser API — free, no vendor, no API key |
| GPS prompt | Dedicated onboarding step, "Not now" always available |
| Stored precision | Rounded to 2dp (~1.1km) |
| Location visibility | Never exposed to other users — derived label only |
| Tracking | One-shot on app open. No background, no watchPosition |
| Stale location | 30 days |
| Target scale | 1,000+ campuses → ~500k–1M users. Must work at worst case |
| Branch/hostel | Stays deleted |

## Industry precedent checked

- **Hinge** — "Most Compatible" refreshes every 24h automatically. No manual button.
- **Tinder** — deck refreshes naturally on exhaustion. No button.
- **Bumble** — no button; expired profiles clear automatically.

Conclusion: no major dating app exposes a user-triggered re-roll. The "New deck" button
was my invention and is dropped. Auto-rebuild covers the dead-end case instead.

## Two bugs found

### Bug 1 — deck reshuffles every request
`server/routes/discover.js:398` rolls `Math.random()` per request. Page 1 and page 2
come from two independent shuffles, so people repeat and others are skipped.

### Bug 2 — only 80 candidates are ever ranked (worse)
`server/routes/discover.js:434` fetches a hardcoded `.limit(80)`, then ranks **in
JavaScript** at `:497`. At 50k users, only 80 are ever considered. Someone ranked 85th
is invisible forever — no matter how many times you swipe.

There is **no index supporting a score sort**: `discover_deck_filter_index` ends in
`randomSeed` (sampling), so the database physically cannot rank by score today.

Bug 2 caps who can ever be met. Fix it before any ranking work — including geolocation.

## P1 — Fix the 80-person ceiling (prerequisite for everything)

1. Move `hybridScore` into a Mongo aggregation `$sort`; stop ranking in JS.
2. Add sort index:
   `{ isDeleted, isVerified, isOnboarded, suspended, isGhost, profileScore, lastActive }`
3. Replace `.limit(80)` with `.limit(30)` — now "top 30 of all eligible", not
   "80 random, best of those 80".
4. Remove the JS `scoredUsers.sort()` at `:497`.

Identical fix at 1k users or 1M.

## P2 — Session-stable materialized deck (Bug 1)

- New `DiscoverSession`: `viewerId`, `userIds[]`, `cursor`, `lastSeenAt`, `rankingVersion`
- Store `_id`s only — two users named "Adi Bhati" have distinct ObjectIds
- Window of top ~300 IDs per session (~7KB, never grows with pool size)
- Page = slice `userIds[cursor, cursor+10]`, advance cursor
- 30 min idle → rebuild on next open
- Window exhausted → extend before the user notices
- Pool genuinely empty → "You're all caught up"

## P3 — Geolocation (depends on P1; enables P4)

- New `server/utils/geo.js`: `haversineKm`, `bandFor`, `sanitizeLatLng`
  - `bandFor(null)` returns `null`, **not** band 0 — unknown stays unknown
- `College` + `latLng: [Number]`, optional, validated range. Seed IITB + admin form
- `User` + `currentLatLng`, `locationSource`, `locationUpdatedAt`
- Rounding happens **server-side in the route**, never in the client
- `POST /users/setup` accepts optional `currentLatLng` (rides existing payload)
- New `PUT /users/location`; `null` clears it
- Stale after 30 days → treated as unknown, not as 0km
- Client: onboarding step after `intent`
- **HTTPS required in production** — `localhost` exempt, so dev is unaffected
- `publicCard.js` allowlist gains `distanceBand` (string), **must not** gain coords

## P4 — Rank by distance

Sort key: `[distanceBandIndex, intentMatch, hybridScore]`

- Band 0–2 labelled; band 3 shows college badge only
- `band === null` sorts **last**, never first
- **College cap 2/page:** own college if within 30km of GPS, else nearest campus;
  drops entirely when away from all campuses. Remaining slots filled by distance.
- Requires P3 coords first

## P5 — Config changes already agreed

- `INTENTS`: `"Study Buddy"` → `"Activity Partner"` (`server/config/appData.js:73`)
- `MAX_INTERESTS`: 6 → 10 (`server/config/appData.js:253`)

## Loose ends (not blocking)

- **socket.io CORS missing `credentials: true`** (`server/index.js`) — breaks every
  realtime connection including the `profile-updated` broadcast
- **`_recency` / `hybridScore` leak to client** (`discover.js:489` spreads them after
  `toPublicCard()`, contradicting the comment at `:484`). Not sensitive.
- **`Research.md:447` is now wrong** — says don't use GPS. Do not follow it
- **`Research.md:243` `collegeWeight`** — vestigial, superseded by `latLng`
- **5 dead `branch`/`hostel` reads** — `Settings.jsx`, `Admin.jsx`, `Chat.jsx`,
  `NotificationDrawer.jsx`. Orphan dots in Settings/Admin; everyone shows "General"
  in Chat

## Sequencing rationale

P1 before P2 — a stable order over only 80 people still hides most of the pool.
P3 before P4 — distance cannot sort without coordinates. Both must land before any
GPS-based matching goes live.
