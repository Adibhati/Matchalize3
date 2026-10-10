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