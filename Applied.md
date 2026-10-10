# Matchalize — Applied

What this document is: **everything decided and built in this session**, in one place.
Nothing here is a plan or a wish. Anything not yet decided lives in its own section near
the end so it can never be mistaken for settled.

**Update rule:** rewrite this file at the end of every session. Corrections are recorded,
not quietly deleted — the mistake is usually the useful part.

---

## 1. What this app is

A student dating app. Every account is verified with a real college email address, so the
audience is students only. One person is shown at a time; you pass or you interact.

---

## 2. Profiles

### The score

Every profile carries a score out of 100, recalculated automatically on every edit. Nobody
types a number.

| Score | Name | What it actually does |
|---|---|---|
| Below 45 | **Newcomer** | Nothing is enforced. They appear in decks and get reserved slots. |
| 45 – 74 | **Published** | Still nothing enforced. |
| 75 – 100 | **Interactable** | Can like and message from the deck. |

**Only 75 is a real gate.** Someone below it who tries to like gets a "finish your profile"
message instead. There is **no** rule hiding anyone below 45 from decks — a brand-new profile
with one photo still appears, it just gets reserved slots.

> This corrects an earlier belief in this project that 45 was a visibility gate. It never
> was, and nothing enforced it.

**The gate is checked live on every request**, never cached. If someone deletes photos and
falls from 80 to 44, they lose the ability to like on their very next attempt.

### What's on a profile

| Field | Limit | Notes |
|---|---|---|
| Photos | 4 | Slots 1–4 earn score; a 5th and 6th would earn **nothing** |
| Interests | 10 | Raised from 6 — six could not express a personality |
| Intents | **No cap** | All three may be held |

**Intents** are Relationship, Friendship and Activity Partner. A person may hold one, two or
all three.

> The cap of 2 was removed. The argument for it was that a profile claiming everything
> matches everyone, so the signal stops discriminating — true of the first slice, irrelevant
> by the second, because with only three options holding all three is very close to "no
> preference". The cap had its own cost: a genuinely open person had to lie about one, and a
> user who tapped a third chip and watched it not stick had no way to tell that from a bug.

> The photo limit was **always 4**. A `PHOTO_LIMIT: 6` constant existed in the shared config
> and was read by nothing — server and client both enforced 4. It was removed rather than
> corrected, because a second copy of a number enforced elsewhere is exactly how it drifts.

---

## 3. The feed

Everything about how people appear, in the order the reader meets them.

### 3.1 What you see

One person at a time, full screen. Swipe down to go back briefly, then forward. Like and
message buttons sit below the card.

Cards carry: photo, name and age, vitals, seeking, interests, and a **campus badge**. If
someone has turned off showing their college, the field is stripped on the server — it never
reaches your phone at all, so hiding it is real rather than cosmetic.

### 3.2 How the deck is built

**The order is decided once and saved.** When you open the app, all 500 places in your deck
are decided and written down. Your phone only ever holds 10 at a time.

| | |
|---|---|
| Deck window | 500 people, the whole ordered deck for one session |
| Cards per page | 10 |
| Session length | 30 minutes idle |

**500** is 50 pages, roughly 25 minutes of swiping — matched to the session length so a
normal browsing session never runs out mid-way.

### 3.3 The 30-minute rule — why your deck never moves under you

Every time you ask for more cards, the app notes that you are active.

- **Under 30 minutes** since your last request → the same deck, same order, nothing changes
- **Over 30 minutes** → a brand new order is built

Swiping resets the clock, so **your deck cannot rearrange itself while you are using it.**
Only stepping away for more than half an hour rebuilds it.

### 3.4 No repeats — by construction

Because the order is decided once and written down, **the same person cannot appear twice in
a session.** This is structural, not a filter that could be bypassed.

> This was the bug it replaced. The app used to roll a random number on **every** request, so
> page 1 and page 2 came from two independent shuffles: people repeated, others were skipped
> entirely.

Verified: 124 eligible people drained across 12 pages → **124 unique cards, zero repeats.**

### 3.5 How people are ordered

Three signals, in this order:

1. **Distance** — nearest first
2. **Shared intent** — people looking for the same thing as you
3. **Quality and recent activity** — the tiebreaker

**Every eligible person is considered.** Ranking runs across the whole pool, not a sample.

> This replaced a ceiling nobody could see: the app used to grab 80 people at random and rank
> *those 80*. With thousands signed up, anyone ranked 81st was unreachable forever — the app
> never looked at them. Proven by planting a perfect profile in 301st place and watching it
> rank first.

### 3.6 Distance and the label on the card

| Distance | Label |
|---|---|
| 0–30km | **Near you** |
| 30–100km | **In your area** |
| 100–300km | **Further away** |
| 300km+ | *(no label — college badge only)* |

**No exact kilometre figure is ever shown.** A band is enough to act on, and a precise
distance is a stronger privacy disclosure for no benefit. Labelling thousands of distant
strangers is noise when the college badge already says where they are.

### 3.7 Where the distance is measured from

| Available | Measured from | Means |
|---|---|---|
| Personal position, **fresh (≤ 30 days)** | Their own position | Accurate — knows they're home for a break |
| Personal position, **older than 30 days** | **Their campus position** | A stale fix is not a location; it is treated as absent |
| No personal position | **Their campus position** | Assumes they're at their campus |
| Neither | No distance ranking | Intent and quality only |

**The candidate's own position is primary; campus is the fallback.** An earlier build measured
campus-to-campus unconditionally, so a student who had moved to Pune was still ranked as though
sitting at their campus. The feed is a person-to-person ranking now — campus coordinates only
apply to a candidate who has no fresh reading of their own.

⚠️ **The freshness check on the candidate side was missing entirely** and was added with this
change. `isFreshLocation` was only ever applied to the *viewer*, so a reading stored months ago
was treated as if the person were standing there at that moment today. A stale reading now falls
through to the campus rather than lying about where someone is. Both sides honour the same 30-day
TTL.

The pipeline reads the candidate's `currentLatLng` and falls back to `$_c.latLng` (the `$lookup`
of their college). The `select: false` on `currentLatLng` is a *query* projection and does not
affect an aggregation, so the value is visible to the pipeline — verified, not assumed.

> A candidate with a location and a candidate without one compete on identical terms: neither is
> penalised and neither is separated into another pool. A location-off candidate is ranked as
> though standing at their college, which is the honest cost of not having shared a position.

**When no distance signal exists at all**, the feed is not empty. Everyone eligible is shown,
ordered by shared intent then quality, and the caught-up screen explains that turning location
on would show nearby people.

### 3.8 Missing information reads as unknown, never as nearby

An unreadable value scores as **unknown** — the same as a profile whose last activity can't be
read. It is never treated as zero, because zero means "this person is right here" and would
float them to the top.

### 3.9 Reserved slots

**Newcomers — 50 of the 500.** Profiles under 45 get reserved slots so a brand-new signup is
never invisible. Only newcomers pulled in from *outside* the 500 are repositioned, and they are
**spread evenly** — roughly one every ten cards — so your first screen is real people.

> This used to stack up to 50 incomplete profiles at the very front, meaning the first five
> screens were empty before anyone real appeared. It also ignored distance entirely, and
> silently dropped the mutual-preference filter — so reserved slots could surface people you had
> said you were not interested in.

**Your own campus — 100 of the 500.** A deck that is 100% your own campus means you meet
nobody, and this is an inter-college network.

**The campus cap only applies when you are actually at your campus** — within 30km of it. Away
on a break, the cap drops and the nearest people fill your page instead. Reserving campus slots
for someone 1,400km from that campus is how a campus deck becomes useless in July.

### 3.10 When you reach the end

If the 500 run out and more people are eligible, a fresh 500 is built **in the same request** —
you are never handed an empty screen while the app claims to have more.

If genuinely nobody is left, you get an honest **"You're all caught up"** screen with no fake
escape. **Refresh is shown until the server confirms exhaustion** (`deckExhausted`), then hidden
— once nobody eligible is left anywhere, re-requesting can only return the same people, so a
button offering to do that is a button that lies about the system. (An earlier version of this
document claimed the caught-up screen had no refresh button at all. That was never true.)

There is **no "Show everyone" button**. It existed to escape a campus-narrowed deck; there is no
narrowed deck to escape.

---

## 4. Location

### What is stored

A position rounded to about **one kilometre**. Rounding happens **on the server**, so the
precise reading never reaches the database, request logs, or anything else that captures
requests.

### What is never done

- No background tracking, ever
- No tracking history — nothing records where you have been
- No watching while the app is closed
- **Nobody else ever sees your position** — they see a band label, or nothing

### It checks itself

Each time the app opens, **one** reading is taken silently and compared with what is stored.
Past **25km** of drift the position is updated and the deck is rebuilt immediately, rather
than waiting out the 30-minute session.

That is one reading per app open, not tracking. Someone travelling Mumbai → Bangalore gets a
correct deck on their next open with nothing to tap. A refresh control sits beside the deck
actions as a convenience — the automatic check is the mechanism.

### Choosing what you're shown by

One optional question at signup. **"Not now"** is a first-class answer that skips it
permanently; onboarding is never blocked.

In Settings it is a **choice between two options, not a status readout**:

| Option | Ranking uses |
|---|---|
| **Use my precise location** | Your own position — people closest first, deck rebuilds when you travel |
| **Use my college location instead** | Your college's position — nearby colleges, plus everyone further out |

The labels were renamed from "Near me" / "My campus" because the old pair read as an abstract
distance preference: nothing in them said that one option reveals where you live and the other
does not. This is a privacy choice and now looks like one on the surface.

Switching away from **Near me** genuinely **deletes** the stored coordinates. It is not a
hide-the-setting.

> **This replaced a "Location: On/Off" row under Privacy, and the old shape was wrong twice.**
>
> First, it reported a boolean derived from `locationSource`, which stays truthy for a reading
> the ranking has already stopped using. A location set 94 days ago displayed as **"On"**, with a
> "Turn off" button for something that was effectively off — the 30-day rule working in the
> ranking while the UI contradicted it.
>
> Second, **no other dating app shows a privacy row for location.** Tinder, Bumble and Hinge
> each expose one distance preference and nothing more, because the OS permission prompt and the
> onboarding copy already disclose that location is used, and the OS settings app is where it
> gets withdrawn. Our own argument for keeping the row — "there must be a way to revoke it" —
> was wrong, because that is what iOS and Android already provide.
>
> A two-option choice also **cannot lie the way a boolean can**: the stored preference *is* the
> selection, so there is no second flag to fall out of sync with reality. A stale reading shows as
> **Near me** plus an honest note — *"Your location is 94 days old, so it isn't being used"* —
> rather than silently claiming to be active.

### Freshness — 30 days

A stored position not refreshed within 30 days **stops affecting ranking entirely** and reads
as unknown.

Without this, someone who set their position in April and moved in May is shown as "near you"
in September — confidently and wrongly. The app would rather know nothing than know something
stale.

Past 30 days the setting stays visibly selected — the choice is remembered — but the line
underneath says plainly that it is not in use and offers to refresh it.

### It needs a secure connection

Browsers only hand over a position on an encrypted connection. `localhost` counts as one, so a
laptop is fine. A phone on plain Wi-Fi is not, and the app says so plainly instead of pretending
you declined.

---

## 5. Account states

| State | What happens | Reversible |
|---|---|---|
| Annual re-verification | Re-confirm the college email yearly | Yes, by confirming |
| Admin suspension | Moderation action | By appeal |
| Account deletion | Permanent | No |

**There is no pause or deactivate.** A "taking a break" mode was considered and deliberately
left out — it would be functionally identical to the voluntary Ghost Mode whose toggle was
removed, so both would mean maintaining two names for one behaviour.

### Ghost Mode — removed, and what the flag really means

The **voluntary feature is now fully gone.** The user-facing toggle was removed earlier, and
the `PUT /api/users/ghost-mode` endpoint has now been deleted too — so a member can no longer
hide themselves, not even by calling the API directly.

`isGhost` **existed** for a while because the deck's visibility filter read it and it was written
by two things that were not ghost mode (removed entirely in Session 8):

| Writer | Trigger | Also sets |
|---|---|---|
| `report.js` auto-escalation | 3 reports → freeze content; 5 reports → suspend | `shadowbannedAt`, `contentFrozen` |
| Admin panel | Moderator judgement | *(see the inconsistency below)* |
| `DELETE /api/users/account` | Member deletes their account | — |

So `isGhost` then meant **"shadowbanned or deleted"** — a legacy superset flag, not the
voluntary-hiding switch. The deck filtered on it, which is what kept moderated and deleted
accounts out of every feed. Both jobs now use their own flags.

### ✅ The flag has been removed (Session 8)

The legacy `isGhost` field is gone. `shadowbannedAt` is now the single source of
truth for shadowbans and `isDeleted` for deletion; the deck filter reads those two.
Migration: `server/scripts/migrate-remove-isghost.mjs` (sets `shadowbannedAt` where
a shadowban date was missing, unsets the field, drops the old index — run with
`--execute`).

**Campus comes from your verified email** — with one supported change: see the
campus-change flow below.

**Campus changes via re-verification (Session 8).** Settings → "Change college" → pick new
college → prove control of an email at that college with a one-time code → the account moves:
new email/college/collegeCode, re-verified for one year, the saved deck is dropped so a fresh
one builds around the new campus, and a "My campus" location marker (no GPS) is cleared so
ranking doesn't stay aimed at the old school. One active campus at a time.

---

## 6. Verified working

Each checked against a running server, not assumed.

- **Full-pool ranking** — a profile planted 301st now ranks first; previously only 80 were ever
  seen
- **Zero repeats** — 124 people drained across 12 pages, 124 unique
- **Window rebuild** — 700 candidates across the 500 boundary: 72 requests, 704 unique, zero
  duplicates, no empty page claiming more
- **Honest exhaustion** — everyone eligible seen exactly once, then it stops
- **Newcomer reserve** — spread at roughly one per ten cards, respects distance, and never
  surfaces anyone who isn't interested in you
- **Campus cap** — applied at your campus, dropped when away
- **Distance bands** — including a campus with no stored position being shown rather than hidden
- **Campus fallback** — a viewer with no personal location still gets correct bands
- **Intent ranking** — a matched intent genuinely changes the order, and the order reverses when
  the viewer's intent changes
- **Location privacy** — no coordinates in any response, ever
- **Clearing location** — actually deletes it
- **Distance choice is honest** — a 94-day-old reading shows as selected *and* says it isn't being
  used; switching to **Use my college location instead** deletes the coordinates
- **Impression positions are server-owned** — a client claiming `?served=9999` cannot shift the
  recorded depths, and a rebuilt deck restarts the log at 0
- **Ghost route removed** — `PUT /api/users/ghost-mode` 404s and cannot flip a member's own flag;
  shadowbanned and deleted accounts remain hidden; `isGhost` still persists and clears
- **Drift detection** — 3km keeps the session, 120km replaces it
- **Real-time profile edits** — repaint the card on screen

---

## 7. Open questions

Nothing here is decided.

4. **Labels for people returning after a long absence** — NEW / BACK IN DISCOVER / UPDATED.
   Rejected as decoration with no effect on ranking. Recorded so it is not re-proposed without a
   reason.

The following were resolved in Session 8: campus change (re-verify at the new domain,
one active campus), gap year (self-described chip in Profile → vitals, "GAP YEAR" badge on
the deck card, no ranking effect), the location nudge (shown once on the caught-up screen,
"Turn on location and you'll see people near you first." with a dismissible Got it), the
shadowban split (`shadowbannedAt` everywhere), and deletion no longer writing `isGhost`.

---

## 8. Change log

### Session 1 — deck correctness
- Fixed ranking that could only ever see 80 people. Now ranks everyone.
- Fixed the deck reshuffling every request. Order is decided once and saved.
- Added honest exhaustion instead of a premature "no more people".
- Smoothed activity decay; a missing timestamp now reads as unknown rather than zero.
- Logged every card shown with its position, so invisible users become measurable.

### Session 2 — location
- Added location, rounded server-side, one-shot, no background tracking.
- Added distance bands and nearest-first ordering.
- Added an optional signup question and a Settings control.
- Fixed campuses with no stored position being hidden rather than shown unlabelled.

### Session 3 — configuration and exposure
- Fixed realtime connections, which were failing entirely.
- Renamed "Study Buddy" to "Activity Partner" and migrated existing profiles.
- Raised the interest limit from 6 to 10.
- Capped intents at 2. *(Superseded later — cap removed.)*
- Gave brand-new profiles reserved slots.

### Session 4 — audit
- Found **intent ranking was never running at all**: the viewer's intent was never loaded, and
  the signal was also wrongly tied to having location enabled. Both fixed, with a test that
  proves the signal changes the order rather than merely existing.
- Removed Ghost Mode's user-facing toggle. The underlying `isGhost` field stays because
  moderation shadowban and account deletion both write to it — see section 5.
- Found four faults in the newcomer reserve — front-loading, ignoring distance, dropping the
  mutual-preference filter, and a pointless full scan.

### Session 5 — the reserve and the loop
- Newcomers spread evenly instead of stacked at the front.
- The reserve's search ordered by distance and preserved the mutual-preference filter.
- The second search skipped when the pool is smaller than the window.
- A rebuilt deck now serves cards in the same request, and an empty page stops the client
  asking again — closing an unbounded request loop.
- Removed an O(n²) de-duplication that ran on every page request for nothing.

### Session 6 — the last three decisions, and the ghost route
- **Intent cap removed.** All three may be held.
- **Photos.** The dead `PHOTO_LIMIT: 6` constant was removed; the real limit has always been 4.
- **Location checks itself.** 25km drift on every app open rebuilds the deck, plus a manual
  refresh control.
- **Campus position as the base** when there's no personal location, so distance ranking works
  for everyone rather than only those who grant permission.
- **Deleted `PUT /api/users/ghost-mode`**, closing the last route by which a member could hide
  themselves. Verified the route 404s, a normal member still appears in the deck, and
  shadowbanned and deleted accounts are still excluded. No migration was needed — nobody was
  voluntarily ghosted.

### Session 11 — location became required, and the campus fallback became visible

- **Onboarding no longer skippable on location.** The step blocks until the user either shares a
  reading or explicitly picks the college fallback. This is *not* Next held hostage: both buttons
  leave the screen, and declining is a stated choice rather than an absent one. The fallback button
  reads "Use my college location instead" and its confirmation says the feed will be ranked by
  college — because "Not now" would be a lie here, since a feed without a reading is campus-ranked
  rather than neutral.
- **Server records the basis explicitly.** `POST /api/users/setup` now always writes a
  `locationSource`: `'gps'` on a good reading, `'campus'` otherwise. `null` previously meant three
  different things — declined, never asked, and onboarding from before the question existed — and
  the fallback notice cannot be honest if it cannot tell them apart. A malformed pair still does
  **not** fail onboarding; it falls back like a decline.
- **Nothing is stored positionally for a campus-backed user.** Their college coordinates are
  resolved at query time, so a later college change reads as a move rather than as a stale fix.
- **📍 Visible fallback notice on the feed** (`LocationNotice`). Loud banner for the first 7 days,
  then a permanent one-line chip. It never auto-dismisses and has no "Got it": a dismissible
  banner is exactly how someone ends up not noticing their feed stopped updating, and the notice
  is cheap to ignore but expensive to miss. Only turning location on removes it.
- **The notice re-reads permissions rather than assuming.** If the browser has already locked a
  denial it will never prompt again, so the button's failure path says "turn it on in your browser
  settings" instead of silently failing.
- **Enable → full reload, deliberately.** The frozen card order was decided from a campus-derived
  position; only a fresh session re-decides it, so a local state swap would leave a stale order on
  screen under a new claim.
- **No push notification, on purpose.** A notification cannot deliver a permission grant, browsers
  lock denials permanently, and muting notifications to escape the nagging would cost the user
  their match and message alerts.

### Session 10 — RETIRED: the campus scope toggle no longer exists

The "Everyone" ↔ "My campus" toggle has been **removed entirely**, along with the cross-scope
behaviour it was built around. Campus is now **verification and a card badge only** — it never
narrows the feed and never orders it.

- **Why:** a campus is not where a person is. A mode that silently narrowed an inter-college
  network to one campus produced a 13-person deck for an IIT Indore viewer, and the
  "Show everyone" escape hatch existed only to undo it. The feed ranks people by distance from
  the viewer, which requires the platform-wide pool.
- **One feed, one session, one cursor.** Sessions were keyed `{viewerId, scope}` so two frozen
  orders could coexist; the key is now `{viewerId}` alone and the unique index was narrowed to
  match. Two stale campus-scoped sessions were deleted and the compound index dropped in the same
  migration, so the next write could not have hit `E11000`.
- **`?campusOnly=true` is gone** from both the client request and the server filter. The server
  no longer narrows by `collegeCode` under any input.
- **Removed from the interface:** the header chip under the wordmark, the "Deck scope" dropdown,
  the caught-up screen's "Show everyone" button, and the `matchalize_deck_scope_*` localStorage
  preference (with `readScope`/`writeScope` deleted from `discoverStore`).
- **⚠️ The cross-scope seen-list is no longer a question.** It existed because two independent
  frozen orders could each hold the same person, so a union of `servedIds` was needed to stop
  repeats. With one order the union is meaningless, and the old "exhausting one scope can leave
  the other empty — that is correct, not a bug" caveat is moot. **It was, however, the mechanism
  behind a real dead end**: a card seen in the campus view was permanently blocked in the
  everyone view, so "Show everyone" could legitimately bring back nobody. One feed removes the
  class of bug entirely.

- **#1 double fetch on mount.** `fetchProfiles` now joins the in-flight promise on a second
  call (StrictMode double-mount, Profile→Discover remount) instead of firing a parallel
  request the server 500s on.
- **#6 stale scope.** *(Superseded — the scope toggle is gone, so there is no second order to
  flash. The cache/index/served-counter reset on a genuine location-driven rebuild still applies,
  since that path rebuilds the single order.)*
- **#9 served counter reset.** After a location-driven deck rebuild (manual refresh or the
  silent app-open check), `servedRef` returns to 0 so impressions number from the new deck's
  start, not from where the old one got to.
- **#4/#5 distance label survives.** The background merge and the live `profile-updated`
  socket handler now carry over the card's existing `distanceBand` when the incoming payload
  doesn't have one.
- **#8 confirmed already fixed** — the empty-page append path already sets both
  `hasMore=false` and `deckExhausted`, so no change was made.
- **Polish:** "↓ back" added to the desktop keyboard hints; haptics fire on desktop keyboard
  shortcuts; the gate's retry counter resets on scope change; the location refresh button
  hides when the browser reports location permission denied; a small "Updating…" pill shows
  during the background merge; the dead `scrollRef` prop on `ProfileCard` is gone.
- Deliberately **not done:** #12 (blank band 3 is the documented choice), #3 (versioned
  thresholds — client and server deploy together), #11 (entrance replay couldn't be
  reproduced), #2 (campus label already on the card), #15 (token duplication is cosmetic).

### Session 8 — isGhost cleanup, campus change, gap year, location nudge
- **Removed `isGhost` entirely.** `shadowbannedAt` is the one shadowban marker: the admin
  shadowban toggle writes it, unshadowban clears it (and lifts `contentFrozen`), the dashboard
  count and the user-list filter read it, and the deck excludes anyone whose date is set.
  Account deletion no longer touches it — deletion is `isDeleted` alone. Migration script
  backfills missing `shadowbannedAt` values before the field is unset.
- **Campus change.** `POST /api/users/change-college` verifies a fresh OTP at the new
  college's email, swaps email/college/collegeCode, resets the yearly re-verification clock,
  deletes the saved deck session, and clears a campus-derived location marker. Settings has
  the full flow behind "Change college".
- **Gap year.** Optional switch in Profile → vitals; the deck card shows a small "Gap year"
  label. Discoverable, not hidden, no score effect.
- **Location nudge.** One line on the caught-up screen — "Turn on location and you'll see
  people near you first." — only when no location has ever been set and it hasn't been
  dismissed; dismissal is stored on the user.

### Session 7 — the audit, and two bugs it caught
- **Full audit against `Applied.md`,** reading each claim in the code rather than trusting the
  changelog. Most held up. Four did not.
- **Fixed: Settings lied about a stale location.** A 94-day-old reading displayed as "On" with a
  "Turn off" button, because the boolean came from `locationSource` rather than the server's own
  `active` flag.
- **Fixed: impression depths were wrong after travel.** `deckPosition` came from the client's
  `?served=` total, never reset when the app-open check discarded a deck — so a rebuilt deck's
  first page logged as cards 41–50. The server now counts `cardsServed` on the session and derives
  the position itself. The cards were always correct, because slicing runs off the session cursor;
  only the recorded depths were wrong.
- **Replaced the Privacy → Location row with a two-option distance choice** in Show me
  (**Use my precise location** / **Use my college location instead**), matching how Tinder,
  Bumble and Hinge expose location and
  matching the existing gender-chip styling. A choice cannot drift out of sync with what is stored;
  a status boolean could.
- **Added `server/scripts/verify-deck-metrics.mjs`** — 28 checks, including the two regressions
  above and the three testing traps that produced convincing false failures first.

---

## How to keep this file honest

Two rules, both learned the hard way here:

1. **Nothing goes in sections 1–6 unless it was built and checked against a running server.**
   A decision that has not been implemented belongs in the change log marked as such, never in
   the sections above. Two features were reported as "done" while their ranking signal was
   inert — a ranking key that is *constant* still sorts successfully, with no error and no
   warning, so a green test suite is not proof on its own.
2. **Corrections get recorded, not quietly edited.** Four claims in this project's history were
   wrong: that 45 was a visibility threshold, that an overnight gap kept the same deck, that
   photo uploads were capped at 6, and — twice in this session — that "Ghost Mode was removed".
   It was removed from the app and still lives in the database for two unrelated jobs. All four
   are written down rather than deleted.

**The checklist that would have caught all of them:**

1. Every new ranking signal needs a test asserting it *changes the order* when nothing else
   could. Presence is not behaviour.
2. Before declaring a feature "removed", grep the codebase rather than trusting the changelog — a
   UI-only removal leaves the endpoint, the field and every automated writer intact.
3. When two features share one boolean, write down **every** writer of it before changing any of
   them. `isGhost` now means "shadowbanned or deleted", and the code only agrees with that about
   half the time.
4. **Assert a value is correct, never just that nothing threw.** Both bugs fixed in session 6
   passed every existing test: one because the tests asked "does it break?" and never "is the
   number right?", the other because nothing checked the UI against what the server actually
   stores.
5. **Prefer a choice over a status boolean wherever a user is picking a behaviour.** A boolean is
   a claim about state, and every extra thing that can change the state silently makes the claim
   wrong. A selection is the state, so it cannot drift — `?served=` and the Settings location
   toggle were both the same mistake wearing different clothes.

The regression suite for both is `server/scripts/verify-deck-metrics.mjs` (28 checks). Its header
records three testing traps that each produced a convincing false failure first — ObjectIds never
`===` strings, `pass` is deliberately not an exclusion, and deleting a session does not delete its
impressions.
