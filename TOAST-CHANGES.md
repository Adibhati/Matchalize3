# Toast changes

Running log of the notification review. One entry per distinct message, decided
one at a time.

**Source of truth for the review:** `client/src/components/UiGallery.jsx` — the
dev-only gallery. Every message can be fired on demand and judged over a real
page. `UiGallery.jsx` mirrors the live call sites; the call sites are what
actually gets changed.

**Status:** 52 of 52 decided (G1–G52). ✅ Review complete.

> ⚠️ **No code has been changed yet.** Every decision below is recorded here and
> applied in one pass at the very end, once all 52 have been reviewed.

---

## How the toast works today

| | |
|---|---|
| Position | `fixed`, `top: max(16px, safe-area)`, `left/right: 16px`, `z 9999` |
| Look | Cream card, 2px ink border, `5px 5px 0` hard shadow, 14px radius |
| Layout | `[icon tile 34px] [message] [action?] [×]` |
| Plain timer | 4000ms (`MS_PLAIN`) |
| Action timer | 7000ms (`MS_WITH_ACTION`) |
| Per-toast override | `{ ms }` — falls back to the 4s / 7s defaults |
| Concurrency | One at a time — a new toast replaces the old and re-arms the timer |
| Side effect | `AppShell` hides the header while any toast is up (`AppShell.jsx:68`) |

## Icons today

Tile colour is tied to `type`, so severity still reads at a glance. Only the
glyph varies, via the optional third argument:

```js
toast.error(message, action, { icon: WifiOff, ms: 6000 })
```

| type | icon | tile |
|---|---|---|
| success | `CheckCircle2` | green `#5BD98A` |
| error | `AlertCircle` | red `#E5484D` |
| info | `Info` | yellow `#FFD43D` |

Overrides in use: `Server` (5xx) and `WifiOff` (offline), both from `api.js:73`.

## Icon plan (per decided item)

So far only `Server` / `WifiOff` exist as glyph overrides. As we decide each
toast we also pick its glyph. Tile colour still comes from `type` (red = error,
green = success, yellow = info); only the white/ink glyph changes.

| Item | Message | Icon | Why |
|---|---|---|---|
| G2a | Something went wrong. Please try again. | `AlertCircle` (default) | generic error |
| G2b | This conversation is no longer available. | `MessageSquareOff` | chat is gone |
| G2c | You can't message someone you've blocked. | `Ban` | blocked |
| G2d | *(same text as G2b)* | `MessageSquareOff` | stay hidden |
| G3 generic | Something went wrong. Please try again. | `AlertCircle` (default) | generic error |
| G3 5xx | Our side had a problem… | `Server` | already live |
| G3 offline | You appear to be offline… | `WifiOff` | already live |
| G3 validation | Please enter a valid email address / Name is required | `AlertCircle` (default) | input error |
| G10 | Profile strength: X%. You need N% to interact. | `Info` (default) | gate notice |
| G11 | Finish your profile to interact — you need N%. | `Info` (default) | gate notice |
| G12/13/15/16 | Edits are paused while your account is under review. | `ShieldAlert` (new) | under review |

Plumbing needed: `ArchivalToast.jsx` maps `opts.icon` strings → glyphs, so
`MessageSquareOff`, `Ban` and `ShieldAlert` must be added to that map. G2b/G2c
fire from the central 403 handler in `api.js`, so the server must send a `code`
for `api.js` to know which glyph (and the Unblock action) to attach.
G12/13/15/16 pass `opts.icon` directly from the call site.

---

# Decision log

## G1 — "Your account has been suspended. Please contact support."

**Where:** `utils/api.js` — HTTP 403 carrying `suspended`

### Findings

The toast never displayed. The surrounding code:

```
localStorage.removeItem('matchalize_user')   ← logs the user out
localStorage.setItem('matchalize_suspended')  ← flags the ban
toast.error('Your account has been suspended...')
window.location.href = '/auth'                ← HARD NAVIGATION
```

`window.location.href` tears down React, so the toast is destroyed mid-flight.
It could only ever survive if the user was *already* on `/auth`.

That path is covered without it: `api.js` writes `matchalize_suspended` before
throwing, and `Auth.jsx:606` reads that flag and swaps to
`AccountSuspendedScreen` — a full-screen ban page that already states the
suspension, the date, and a pre-filled appeal email.

The string also ended "Please contact support." with no button to do it, so it
was a dead end as well as dead code.

### Decision

**Delete.** The screen does the job, and it does it better than a 4-second card.
The `localStorage` writes stay — the screen depends on them.

### Changes

- [ ] Delete `toast.error(...)` from the suspended branch of `api.js`
- [ ] Remove the row from `UiGallery.jsx`
- [x] Keep the `localStorage` writes — no change needed, the screen depends on them

---

## G2 — the 403 family ("Action not allowed." + messages.js dev-speak)

**Where:** `utils/api.js:56` (fallback) and `server/routes/messages.js` (server strings)

This entry bundles the `403` copy because it all lands in the same toast. Three
sub-decisions.

### G2a — fallback `"Action not allowed."` → `"Something went wrong. Please try again."`

`const message = errorData.message || 'Action not allowed.'` only uses the
fallback when the server sends a `403` with **no** message. Every `403` in our
server *does* send one, so it never fires on normal flows. It is **not** dead
code: line 30 does `response.json().catch(() => ({}))`, so a non-JSON 403
(proxy / gateway / crash page) falls through to it. Keep it as a safety net.
This is the same "no message" fallback as G3, so both are unified to one string.

### G2b — `"Unauthorized"` / `"Unauthorized or alignment inactive"` → `"This conversation is no longer available."`

Fires on chat open / search / send / react / delete when the server finds no
active alignment for you (`messages.js:53, 89, 150, 252, 294`). One check, three
causes: the chat doesn't exist / you're not in it / it has ended. The old text is
dev-speak, and `"This conversation has ended."` (`messages.js:157`) is
unreachable dead code. One accurate string covers all three.

### G2c / G2d — directional block messages (+ Unblock button)

On send, the server only knows *a* block exists between the two users
(`areBlocked` is symmetric — returns true/false, not which way). Add a small
lookup on the block record and read `blocker` vs `blocked`, then:

- **You blocked them** → `"You can't message someone you've blocked."` with an
  **Unblock** action button. States the rule, no blame, and gives a way out.
  (Original wording `"You blocked this person."` scrapped — read like a scolding.)
- **They blocked you** → **reveal nothing** — reuse `"This conversation is no
  longer available."` Never confirm a block to the person who was blocked
  (retaliation risk).

### Changes

- [ ] `api.js:56` — reword fallback to `"Something went wrong. Please try again."`
- [ ] `messages.js:53, 89, 150` — `"Unauthorized or alignment inactive"` → `"This conversation is no longer available."`
- [ ] `messages.js:252, 294` — `"Unauthorized"` → `"This conversation is no longer available."`
- [ ] `messages.js:154` — split by block direction (see G2c/G2d)
- [ ] `messages.js:154` — you-blocked case returns `code: 'YOU_BLOCKED'` + `blockedUserId` so the client can attach the action
- [ ] `api.js` 403 branch — when `code === 'YOU_BLOCKED'`, attach `{ label: 'Unblock', onClick: () => api.delete('/report/block/:id') }`
- [ ] add directional block lookup (read `blocker`/`blocked`, not just `areBlocked`)
- [ ] remove unreachable `"This conversation has ended."` dead branch at `messages.js:157` (optional cleanup)

---

## G3 — "Something went wrong" (`api.js:73`)

**Where:** `utils/api.js:62-76` — the `!response.ok` branch for everything that
isn't 401 / 403.

Fires when a response is not 401/403, not 5xx, the device is online, and the
server sent no message. Rare safety net — every 4xx in the server sends a
message. Same "no message" bucket as G2a, so unified to the same string.

**Decision:** generic fallback → `"Something went wrong. Please try again."`

**Live vs pending:** the two variants below are **already shipped** — they are
what fires in the app today. Everything else in G3 is **pending** (recorded,
not applied).

### The other two variants on this same toast

- **5xx → Server icon · `"Our side had a problem. Try again in a moment."`** —
  **fires.** Real server errors hit this. Keep as-is.
- **offline → WifiOff icon · `"You appear to be offline. Check your connection."`**
  — **delete.** It can't fire when genuinely offline (`fetch` rejects first, so
  `handleResponse` never runs), and `navigator.onLine` false-positives would let
  it *overwrite* a real server message with a wrong one. Misleading dead weight.

### Changes

- [ ] `api.js:63` — generic fallback → `"Something went wrong. Please try again."`
- [ ] keep the 5xx override (Server icon) unchanged
- [ ] `api.js:69` — delete the `navigator.onLine === false` branch

### Non-toast fallbacks on this handler — no change

These are thrown-error texts, not toasts; a redirect happens in the same breath,
so the user rarely sees them. Keep as safety nets:

| Line | Text | Why keep |
|---|---|---|
| `api.js:26` | `Session expired. Please log in again.` | accurate; redirect is the real UX |
| `api.js:42` | `Account suspended` | ban screen is the real UX |
| `api.js:50` | `Account deleted` | server always sends the detailed message anyway |

*(Separate, out-of-scope cleanup: some screen `catch` blocks print `err.message`
without checking `.toasted`, so one of these can flash for a split second before
the redirect.)*

---

## G4–G8 — Discover location (`Discover.jsx:400-419`)

All fire when the user taps **"refresh location"** in the location notice
(`Discover.jsx:1057` → `refreshLocation`). The on-launch auto-check is silent.

| G | Current | Trigger | Decision |
|---|---|---|---|
| G4 | `Location permission was denied. Enable it in browser settings.` | permission denied | **keep** — clear + actionable |
| G5 | `Location needs https. It won't work without it.` | non-secure origin | **reword** — `https` is jargon, and prod is always https so users never see it |
| G6 | `Couldn't get a location reading. Try again, or check phone GPS settings.` | GPS off / timeout / unsupported | **keep** |
| G7 | `Your location is already current.` | tapped refresh, hadn't moved | **keep** |
| G8 | `Location updated. Showing people near you.` | refreshed, moved, deck rebuilt | **keep** |

Note: **G4–G6 are byte-identical to Settings G27–G29** — one decision covers both.

### Changes

- [ ] `Discover.jsx:401` — G5 → `"Location only works on a secure connection."`
- [ ] apply the same G4/G5/G6 outcome at `Settings.jsx:139-141`
- [ ] G4, G6, G7, G8 — no change

---

## G9 — "Someone wants to align with you." (`Discover.jsx:671`)

**Where:** `Discover.jsx:669-672` — socket `new-align` handler (`onNewAlign`),
registered by Discover only (so it only ran while the deck was mounted).

The server already fires **three** signals when someone aligns
(`server/routes/discover.js`): a `Notification` row (badge), a socket
`new-align` ping (`:1640`), and a **web push** (`:1647`) whose body is
`${currentUser.name} wants to align with you.`

### Findings

- **Spam.** A busy day of aligns = a toast per align, all saying the same thing.
- **Off-deck loss.** The listener lives in Discover, so the toast never fired on
  any other tab — the only sign was the header badge, which people don't watch.
- **Redundant with push.** The phone notification already exists and already
  names the sender. The in-app toast adds nothing the OS notification doesn't,
  while also buzzing (heavy haptic).
- **Laggy badge.** The badge is **polled every 30s** (`Header.jsx:131-135`) and
  live-bumped only for messages (`new-letter`), never for aligns.

### Decision

Drop the in-app toast entirely and let the phone notification + an instant badge
carry it.

1. **Remove the in-app align toast + heavy haptic** (`Discover.jsx:669-672`).
2. **Keep the phone notification and its vibration.** Body already reads
   `<Name> wants to align with you.` — keep `vibrate` in `push.js` / `sw.js`.
3. **Hide the phone notification while the app is in the foreground** — check the
   service-worker window clients for a visible tab and skip `showNotification`
   when one is present (how other apps behave).
4. **Instant bell** — move the align handler from `Discover.jsx` into
   `Header.jsx` (mounted everywhere), beside the existing `new-letter` handler,
   and bump the unread count the moment an align arrives. The bell **display**
   stays deck-only (already true — `Header.jsx:175-176,248`).
5. **Accepted trade-off (option A):** an align arriving while you're off-deck is
   silent until you return to the deck. Aligns are a deck action; the badge is
   waiting when you get back.

### Changes

- [ ] `Discover.jsx:669-672` — delete `onNewAlign` (toast + haptic) and its `socket.on/off('new-align')`
- [ ] `Header.jsx` — listen for `new-align` next to `new-letter`; bump unread count instantly
- [ ] `client/public/sw.js` push handler — if any window client is visible, skip `showNotification`
- [ ] `server/routes/discover.js:1640` — keep `emit('new-align')`; it now feeds the badge, not a toast
- [ ] keep push body + `vibrate` unchanged
- [ ] bell display unchanged (deck-only)

---

## G10–G11 — the deck gate (`Discover.jsx:740-772`)

**Where:** `Discover.jsx:764-771`. Fires when you tap to align / like / send a
letter while profile strength is below the threshold (`readLadder().interact`,
e.g. 75%). Not for Pass. Both variants carry a **Profile** action button, 7s.

| G | Current | Variant |
|---|---|---|
| G10 | `You're at 82%. Profile strength needs 75%.` | score known |
| G11 | `Your profile needs 75% to send. Open Profile to finish it.` | score fetch failed |

### Findings

- **G10** is clipped/robotic, and says "Profile strength" while the app elsewhere
  says "profile score" — two names for one thing.
- **G11** says **"to send"**, but the gate blocks align + like + letter too.
- **G11** says **"Open Profile"** while the button right there already says
  **"Profile"** — redundant.
- The two variants don't match each other ("needs X" vs "needs X to send").

### Decision

Unify on the word **"interact"** — that is literally what the code calls this
threshold (`readLadder().interact`). The **Profile** button carries the "go
there" instruction, so the text stops repeating it. Keep `info` and 7s.

- **G10** → `Profile strength: 82%. You need 75% to interact.`
- **G11** → `Finish your profile to interact — you need 75%.`

### Changes

- [ ] `Discover.jsx:766` — G10 → `Profile strength: ${score}%. You need ${need}% to interact.`
- [ ] `Discover.jsx:769` — G11 → `Finish your profile to interact — you need ${need}%.`
- [ ] keep `info`, the **Profile** action button, and 7s

---

## G12–G18 — Profile page (`client/src/pages/Profile.jsx`)

### G12 / G13 / G15 / G16 — the content-freeze toast (one string, four sites)

One constant re-used at four call sites, fired as `toast.error` (red, 4s):

- const `contentFreezeMessage` = `"This feature is temporarily unavailable while your account is under review."` (`Profile.jsx:660`)
- fired at `Profile.jsx:715` (open edit drawer) · `:730` (tap photo slot) · `:759` (remove photo) · `:1139` (save)

The flag means **3+ community reports** (`report.js:78-81`; 5+ = suspended). The
server has its own, differently-worded string at `users.js:275`
(`"...Contact support@matchalize.com"`, `code: CONTENT_FROZEN`), which the 403
path toasts if a save slips past the client check.

**Status: decided.**

One string everywhere (client + server), with a way out:

- **Client** `Profile.jsx:660` → `Edits are paused while your account is under review.`
- **Client** all four call sites (`:715, :730, :759, :1139`) → add the action
  `{ label: 'Contact support', onClick: () => window.location.href = 'mailto:support@matchalize.com' }`
  (define the action once beside the const). With an action the toast runs 7s.
- **Server** `users.js:275` → same text: `Edits are paused while your account is under review.`
  (keep `code: 'CONTENT_FROZEN'`).

### Changes

- [ ] `Profile.jsx:660` — const → `Edits are paused while your account is under review.`
- [ ] `Profile.jsx:715, 730, 759, 1139` — pass the Contact support action
- [ ] `users.js:275` — server string → same text
- [ ] icon: `ShieldAlert` (new glyph in `ArchivalToast` map) — see icon plan

### G14 — "Wait for the current upload to finish." (`Profile.jsx:733`)

Tapping a photo slot while an upload is already running (one at a time). Short,
accurate, nothing else to do.

**Decision: keep.**

### G17 — "Could not save. Please try again." (`Profile.jsx:1170`)

`api.js` toasts **every** error centrally and throws with a message, so this
call-site toast re-toasts whatever `api.js` already showed (single-toast
concurrency → the second replaces the first). The fallback string is effectively
dead through the API path. Real issue is the **double-toast**, not the words.

**Status: decided.**

Guard the double-toast — `api.js` already toasted when `err.toasted` is set, so
only toast locally for non-API errors:

```js
} catch (err) {
  if (seq !== saveSeq.current) return;
  setUserData(snapshot);
  if (!err?.toasted) toast.error('Could not save. Please try again.');
}
```

Keep `Could not save. Please try again.` as the non-API safety net. **Never use
`err?.message` here:** a non-toasted error is a network failure whose message is
`"Failed to fetch"`; the server's real message is already shown by `api.js`'s
central toast when the error *is* toasted. (This is exactly what `Chat.jsx`
already does.) No guard at `:1258` (G18) — that call site *intentionally*
overrides the server's terse "Upload failed" with friendlier copy, so it must
keep firing.

### Changes

- [ ] `Profile.jsx:1170` — wrap in `if (!err?.toasted)`
- [ ] *(separately, review the other screens' catch blocks that print `err.message` when they come up: Chat, Onboarding, Matches, Roulette)*

### G18 — upload failure (`Profile.jsx:1258`)

Live string: `"Upload failed. Check the file and try again."` — the gallery row
(`"Upload failed. The image may be too large."`) was **stale**. Fires on any
non-cancel upload failure.

**Decision: reword** → `Upload failed. Check your connection, or try a smaller
image.` (covers network drops and the 5MB local / 10MB Cloudinary size cap).

### G19 / G20 — college badge toggle (`Profile.jsx:1813`)

Fires on flipping the "show college on my card" switch — green `success`, 4s,
instant (optimistic update). Live strings: `College badge visible on your card.`
/ `College badge hidden from your card.` — the gallery rows were stale.

**Findings:** log-line copy ("visible/hidden from your card"); "your card" is
inaccurate — the server STRIPS the college from every **deck** payload when off
(`Profile.jsx:1801-1803`); the switch already gives instant visual feedback.

**Decision (B): keep, reword** to state the actual effect:

- ON → `Others can now see your college.`
- OFF → `Your college is now hidden from the feed.` *(per user — "feed", not "deck")*

### Changes

- [ ] `Profile.jsx:1813` — reword both branches

---

## G21–G26 — Chat page (`client/src/pages/Chat.jsx`)

All five failure catches already use the `!err?.toasted` guard
(`Chat.jsx:552, 595, 680, 707, 722`) — the Profile G17 fix is **already in
place** on this screen. Minor note: `Chat.jsx:553` (G21) and `Chat.jsx:596`
(G22) were the stale gallery rows; index corrected to the live strings.

| G | Line | Live string | Decision |
|---|---|---|---|
| G21 | `Chat.jsx:553` | `Couldn't send message. Check your connection.` + Retry | ✓ keep |
| G22 | `Chat.jsx:596` | `Couldn't upload photo. Check your connection.` + Retry | ✓ keep |
| G23 | `Chat.jsx:681` | `Failed to delete. Please try again.` | ✓ keep |
| G24 | `Chat.jsx:708` | `Failed to end this conversation. Please try again.` | ✓ keep |
| G25 | `Chat.jsx:723` | `Failed to block this user. Please try again.` + Retry | ✓ keep |
| G26 | `Chat.jsx:1052` | `Report submitted. Thank you for keeping the community safe.` | ✓ keep |

Why keep: G21/G22 fire only on non-toasted errors, i.e. real network drops, so
"Check your connection" is accurate — everything else was already toasted.
G24 mirrors the confirm dialog's own wording ("End this conversation?").
G25's Retry re-asks the block confirm dialog — minor, accepted.

**Cross-reference for later:** G46 (`"Report submitted."`, ProfileCard) is the
terse sibling of G26 — unify when G46 is reviewed (drop the thank-you there, or
mirror it).

### Changes

- [ ] none — all keep; stale gallery rows updated in `UiGallery.jsx` only

## G30–G44 — Settings page (`client/src/pages/Settings.jsx`)

Reviewed one by one. G27–G29 (location) already covered by G4–G6.

### G30 — "Showing people near you first" (`Settings.jsx:151`)

Green success after "Near me" GPS save. **Decision: reword** (matching the app's
own user-facing term — "feed", per `DiscoverRebuildOverlay.jsx:56` "Updating
your feed") → `Updating your feed for your location.`

### G31 — "Couldn't save your location" (`Settings.jsx:153`)

Catch on the `/users/location` PUT (GPS save). Double-toasts over `api.js`'s
central toast (last wins). Server sends nothing useful here (only `Invalid
location` on a 400 the picker can't produce).

**Decision (B): reword + nudge, unify voice** → `Could not save your location.
Try again.` ("Could not" matches the majority of the Settings errors.)

### G32 — "Showing your campus and beyond" (`Settings.jsx:177`)

Green success after switching to "My campus" (clears GPS, anchors to campus).
**Decision: reword** to parallel G30 → `Updating your feed for your campus.`

### G33 — "Couldn't change your distance setting" (`Settings.jsx:179`)

Catch on `chooseCampus` (the "Use my college location instead" chip **and** the
"Stop using my location" button both call it). Double-toasts over `api.js`.

**Finding:** "distance setting" matched nothing on screen — the chips read "Use
my precise location" / "Use my college location instead" (`Settings.jsx:399-400`)
and were the only user-visible "distance" anywhere. Buttons already say
"location", so the reword makes toast and buttons agree.

**Decision (B): reword + nudge, unify voice** → `Could not update your location
preference. Try again.`

### G34 — "Preference saved." (`Settings.jsx:227`)

Green success after saving the "Show me people" selection (interestedIn). The
page has several preferences (theme, location, notifications), so the bare
"Preference saved." doesn't say which.

**Decision (A): reword** → `Show me preference saved.` (matches the on-screen
heading "Show me people")

### G35 — "Could not save. Try again." (`Settings.jsx:230`)

Catch in `savePref` (the "Show me" save). **Bug:** `err.response?.data?.message`
can never populate — `api.js`'s `fail()` throws `Error(message)` with no
`.response` — so the real server message is always dropped. Double-toasts.

The server *does* send useful text (`validateInterestedIn` → `users.js:470`) and
this save can hit the content-frozen 403 (G12–16 toast), so overriding would
**mask the freeze notice**.

**Decision (A): guard, mirror G17** →
```js
if (!err?.toasted) toast.error('Could not save your preference. Try again.');
```
The server message wins when present (shown by `api.js`'s central toast); the
local fallback covers network failures. (As with G17, do **not** use
`err?.message` — non-toasted errors are network errors whose message is
`"Failed to fetch"`.)

### Changes

- [ ] `Settings.jsx:151` — G30 → `Updating your feed for your location.`
- [ ] `Settings.jsx:153` — G31 → `Could not save your location. Try again.`
- [ ] `Settings.jsx:177` — G32 → `Updating your feed for your campus.`
- [ ] `Settings.jsx:179` — G33 → `Could not update your location preference. Try again.`
- [ ] `Settings.jsx:227` — G34 → `Show me preference saved.`
- [ ] `Settings.jsx:230` — G35 → guard + `'Could not save your preference. Try again.'`

### G36 — "Could not load blocked people." (`Settings.jsx:253`)

Catch on `fetchBlockedUsers` (GET `/report/list`). A GET carries no important
server message, so the local line is fine. Double-toasts (harmless).

**Decision (A): reword + nudge** → `Could not load your blocked list. Try again.`

### Changes

- [ ] `Settings.jsx:253` — G36 → `Could not load your blocked list. Try again.`

### G37 — "Unblocked {name}. They can now appear in your deck." (`Settings.jsx:264`)

Green success after unblocking. Says "deck", but the app's user-facing word is
"feed" (see G30/G32, and `DiscoverRebuildOverlay.jsx:56`).

**Decision (A): reword** → `Unblocked {name}. They can now appear in your feed.`

### Changes

- [ ] `Settings.jsx:264` — G37 → `Unblocked ${name}. They can now appear in your feed.`

### G38 — "Could not unblock. Try again." (`Settings.jsx:266`)

Catch on unblock. Doesn't name the person, though the name is in scope
(`userName`) and G37 does. Double-toasts (harmless).

**Decision (A): reword, named to mirror G37** → `Could not unblock {name}. Try again.`

### Changes

- [ ] `Settings.jsx:266` — G38 → `Could not unblock ${name}. Try again.`

### G39 — "Could not delete account. Try again." (`Settings.jsx:289`)

Catch on account deletion. Delete endpoint carries no important server message,
so keeping the local line is fine. Double-toasts.

**Decision (A): reword** → `Could not delete your account. Try again.`

**Cleanup (same line):** `if (err.response?.data?.deleted) onSignOut();` is dead —
`api.js` never exposes `.response` and already redirects deleted accounts.

### Changes

- [ ] `Settings.jsx:289` — G39 → `Could not delete your account. Try again.`
- [ ] `Settings.jsx:289` — remove the dead `err.response?.data?.deleted` branch

### G40 — "Pick a college and enter its email." (`Settings.jsx:532`)

Client-side validation before "Send code" in the change-college popup. Didn't
match the on-screen labels ("Select your new college" / "College email").

**Decision (A): reword** → `Select a college and enter your college email.`

### Changes

- [ ] `Settings.jsx:532` — G40 → `Select a college and enter your college email.`

### G41 — "Code sent — check your inbox." (`Settings.jsx:536`)

Green success after the OTP email request. Didn't say which address the code
went to.

**Decision (A): reword, name the address** → `Code sent to {email}.`

### Changes

- [ ] `Settings.jsx:536` — G41 → `Code sent to ${cc.email}.`

### G42 — "Could not send code." (`Settings.jsx:538`)

Catch on the send-OTP request. Shows `e?.message`, which on a **network failure**
is `"Failed to fetch"` — a dev-y string shown to the user. On a server error,
`api.js` already toasts the real message and this repeats it.

**Decision: guard, mirror G35** →
```js
} catch (e) {
  if (!e?.toasted) toast.error('Could not send code. Try again.');
  setCc((c) => ({ ...c, busy: false }));
}
```

### Changes

- [ ] `Settings.jsx:538` — G42 → guard + `'Could not send code. Try again.'`

### G43 — "College updated. Your deck resets around it." (`Settings.jsx:560`)

Green success after switching college. Says "deck" (should be "feed", our
convention); "around it" is vague; "resets" sounds like a wipe (it rebuilds).

**Decision (B): reword** → `College updated. Your feed will refresh for your new campus.`

Also fix the matching popup subtitle (`Settings.jsx:510`): "Your deck resets
around the new campus." → "feed".

### Changes

- [ ] `Settings.jsx:560` — G43 → `College updated. Your feed will refresh for your new campus.`
- [ ] `Settings.jsx:510` — subtitle "deck" → "feed"

### G44 — "Could not change college." (`Settings.jsx:563`)

Catch on change-college. Same `e?.message` trap as G42 — network failure shows
`"Failed to fetch"`. No guard, no nudge.

**Decision: guard, mirror G42** →
```js
} catch (e) {
  if (!e?.toasted) toast.error('Could not change college. Try again.');
  setCc((c) => ({ ...c, busy: false }));
}
```

### Changes

- [ ] `Settings.jsx:563` — G44 → guard + `'Could not change college. Try again.'`

---

## G45 — "Someone sent you a message." (`Header.jsx:156`)

**Where:** `Header.jsx:142-160` — socket `new-letter` listener.

### Findings

**Dead code — two ways:**

1. **Nothing emits it.** The server only emits `new-align` (`discover.js:1640`)
   and `new-message` (`messages.js:218`). There is no `new-letter` emit anywhere.
2. **The type is retired.** `new_letter` / `priority_telegram` are documented as
   retired writers in `Notification.js:17-23`; aligns are `new_align`.

`new-letter` was the **old name for the align request** — the same thing G9 now
handles via `new-align`. So the listener (and its dead badge bump) can never fire.

### Decision

**Delete** the whole `new-letter` listener (`Header.jsx:142-160`) and its dead
badge bump. Aligns are carried by the G9 `new-align` listener instead.

Note for G9: its plan says to sit the new `new-align` listener "next to the
existing `new-letter` handler". After this deletion that handler is gone — the
new listener simply replaces it in `Header.jsx`.

### Changes

- [ ] `Header.jsx:142-160` — delete the `new-letter` listener + dead badge bump
- [ ] update G9's change note: `new-align` listener replaces (not joins) `new-letter`

---

## G46 — "Report submitted." (`ProfileCard.jsx:984`)

**Where:** `ProfileCard.jsx:984` — `ReportModal`'s `onReported` success toast.

**Finding:** the gallery/index listed the terse `"Report submitted."`, but the
**live code already reads** `"Report submitted. Thank you for keeping the
community safe."` — **byte-identical to G26** (`Chat.jsx:1052`). The "terse
sibling" cross-reference is already resolved; the row was stale. (Post-report
behaviour is unchanged: both entry points show the same success toast.)

### Decision

**Keep — already unified with G26. No change.**

### Changes

- [ ] none — stale gallery row only

---

## G47 / G48 — report submit (`ReportModal.jsx`)

Both live in `handleSubmit` (`ReportModal.jsx:198-221`), invoked only by the
**Submit Report** button (`:381-390`).

### G47 — "Please select a reason for reporting." (`:201`)

**Finding: unreachable dead code.** The guard `if (!selectedReason)` can never
run, because the only caller — the submit button — is `disabled={submitting ||
!selectedReason}` (`:384`). No reason selected ⇒ the button is disabled ⇒
`handleSubmit` is never entered. The user still gets feedback (the button dims to
`opacity .45`), so nothing is lost.

**Decision: delete** the guard + toast. *(If we ever want an explicit nudge,
it should be inline text near the reason rows, not a toast — but the disabled
button already communicates it.)*

### G48 — "Failed to submit report: {err.message}" (`:216`)

Already guarded (`if (!err?.toasted)`, `:215`) — good. But it prints
`err.message`, and on a **non-toasted** error (a real network drop) that message
is `"Failed to fetch"` → the user sees `"Failed to submit report: Failed to
fetch"`. Same trap flagged for G17/G42/G44.

**Decision: guard keeps, reword** → `Could not submit your report. Check your
connection and try again.`

### Changes

- [ ] `ReportModal.jsx:200-203` — delete the `if (!selectedReason)` guard + toast (dead)
- [ ] `ReportModal.jsx:216` — reword → `'Could not submit your report. Check your connection and try again.'` (drop `err.message`)

---

## G49–G52 — last four

### G49 — onboarding photo upload (`Onboarding.jsx:505`)

Live string is `"Upload failed. Check the file and try again."` (the gallery row
`"Could not upload that photo. Try a smaller one."` was **stale**). Bare `catch`
(no guard) — the exact same situation and string as **G18** (profile photo
upload). `api.upload` caps at 5MB local / 10MB Cloudinary.

**Decision: reword to match G18** → `Upload failed. Check your connection, or try
a smaller image.`

### G50 — publish onboarding profile (`Onboarding.jsx:589`)

Fires when **Publish & start matching** (`:900-902`) fails. Live:
`toast.error(err.response?.data?.message || err.message || 'Something went wrong.')`.

Same bugs as G35/G48: `err.response` never exists (`api.js`'s `fail()` throws a
plain `Error`), so it falls through to `err.message` → `"Failed to fetch"` on a
network drop; and on a server error it **double-toasts** over `api.js`'s central
toast. The `'Something went wrong.'` fallback is dead (`.message` is always set).

**Decision: guard + reword** →
```js
} catch (err) {
  if (!err?.toasted) toast.error('Could not publish your profile. Check your connection and try again.');
  setPublishing(false);
}
```

### G51 — unmatch (`Matches.jsx:130`)

Fires when `DELETE /alignments/:id` fails. Live:
`toast.error('Something went wrong. Please try again.')` in a bare `catch` — no
guard, so it **double-toasts** over `api.js`, and says nothing about what failed.

**Decision: guard + reword** →
```js
} catch (err) {
  if (!err?.toasted) toast.error('Could not unmatch. Try again.');
}
```

### G52 — Roulette start (`Roulette.jsx:53`)

Fires on tapping **Start** while the feature isn't live. Live string is
`"Roulette opens soon."` (row `"The chamber is being prepared…"` was **stale**),
`info`. Fires on every tap.

**Decision: keep `info`; reword** → `Roulette is coming soon.`

### Changes

- [ ] `Onboarding.jsx:505` — G49 → `Upload failed. Check your connection, or try a smaller image.`
- [ ] `Onboarding.jsx:589` — G50 → guard + `'Could not publish your profile. Check your connection and try again.'`
- [ ] `Matches.jsx:130` — G51 → guard + `'Could not unmatch. Try again.'`
- [ ] `Roulette.jsx:53` — G52 → `Roulette is coming soon.`

---

## Feature — live "Letters" tab unread badge (from the G45 discussion)

**Where:** `client/src/components/NavBar.jsx:93-116` (badge), driven by
`AppShell.jsx:111-117` (`matchCount`).

**The problem (user-reported):** chat messages currently produce only a phone
push — nothing in-app updates. There *is* a badge on the **Letters** tab, but it
only catches up when the `['matches']` list is refetched (entering Letters /
refocusing). The live listener for it (`Matches.jsx:104`) is **dead**, because the
server emits `new-message` only to the *alignment room*, and only `Chat.jsx` ever
joins that room (`Chat.jsx:388`). So off an open chat, nothing bumps the badge.

**Goal:** behave like WhatsApp — no toast for chat, a live unread badge on the
Letters tab.

### Confirmed decisions

- **Tab:** the **Letters** tab (`NavBar.jsx:23`). There is no tab named "Chats".
- **Count = total unread messages** (summed across all conversations), WhatsApp
  style — **not** the number of conversations. (WhatsApp's own wording: *"Show
  total unseen messages and calls … until you view them."*) So 2 from Priya + 1
  from Sam = badge **3**.
- **Live from every screen** — the badge updates the instant a message arrives,
  whatever tab you're on (matches WhatsApp).
- **Clears per-chat** — opening a specific chat and reading it drops only that
  conversation's count; the rest stay (like WhatsApp, not clear-on-tab-open).
- **Keep both signals:** the phone push (app closed/backgrounded) **and** the
  tab badge (app open). They cover different moments.

### Implementation notes (to settle at build time)

- **Server emit:** when a message is sent, also ping the **recipient** — their own
  `userId` room (every socket auto-joins it: `chat.js:78`). Today
  `messages.js:218` emits `new-message` only to the **alignment** room, which
  only an open `Chat.jsx` has joined.
- **Global listener:** move the live handling into `AppShell` (always mounted),
  not `Matches` (unmounts off-tab). `Matches.jsx:104-106`'s `new-message`
  listener is effectively dead (never joins the room) — fix or remove it.
- **Count source:** `GET /alignments` currently exposes only `lastMessage` +
  `yourTurn` per conversation — at most **1** per chat. "Total unread messages"
  needs the server to return an **unread count per conversation** (count of
  messages where `senderId != me` and `readAt == null`); `matchCount` then sums
  those instead of `.filter(...).length`.
- **Clearing:** opening a chat already marks read (`chat.js:208-221`) and patches
  the cache (`AppShell.jsx:119-132`). Update that patch to zero that
  conversation's unread count so the badge drops by the right amount.
- **Push:** unchanged.

### Changes

- [ ] `server/routes/messages.js` — emit a per-recipient event to `userId` room on new message
- [ ] `server/routes/alignments.js` (GET `/alignments`) — include per-conversation unread count
- [ ] `AppShell.jsx:111-117` — `matchCount` = sum of unread counts (not `.length`)
- [ ] `AppShell.jsx` — global socket listener to bump the badge live on any screen
- [ ] `AppShell.jsx:119-132` — `handleOpenChat` patch zeroes that chat's unread count
- [ ] `Matches.jsx:104-106` — fix or remove the dead `new-message` listener
- [ ] keep the phone push unchanged

---

## Icon glyph invisible on success/error tiles

`client/src/components/ArchivalToast.jsx` draws the glyph in the SAME colour as
the tile background:

- `error` → `t.red` glyph on `t.red` tile → invisible
- `success` → `t.green` glyph on `t.green` tile → invisible
- only `info` (dark glyph on yellow) ever showed

Every success/error toast in the app currently renders as a blank coloured
square. **Fix deferred** (applied in the final pass):

- white glyph (`t.card`) on the saturated green/red tiles, dark (`t.ink`) on the
  pale yellow tile
- collapse the duplicated `icons` / `typeIcons` / `tileBg` / `tileBgMap` objects
  into one map keyed by the glyph name, plus the type fallback

### Changes

- [ ] `ArchivalToast.jsx` — glyph `t.card` for success/error/Server/WifiOff, `t.ink` for info
- [ ] `ArchivalToast.jsx` — dedupe the four icon/tile maps

---

# Full index

`✓` decided · `~` proposed (awaiting confirm) · `·` pending. `G` numbers are
stable and match the original 52-row baseline, so a deleted row keeps its number.

| G | Source | Message | Status |
|---|---|---|---|
| G1 | `api.js:39` | Your account has been suspended. Please contact support. | ✓ delete |
| G2 | `api.js:57` | Action not allowed. | ✓ reword + server copy + Unblock btn |
| G3 | `api.js:73` | Something went wrong | ✓ reword · delete offline branch |
| G4 | `Discover.jsx:400` | Location permission was denied. Enable it in browser settings. | ✓ keep |
| G5 | `Discover.jsx:401` | Location needs https. It won't work without it. | ✓ reword |
| G6 | `Discover.jsx:402` | Couldn't get a location reading. Try again, or check phone GPS settings. | ✓ keep |
| G7 | `Discover.jsx:406` | Your location is already current. | ✓ keep |
| G8 | `Discover.jsx:419` | Location updated. Showing people near you. | ✓ keep |
| G9 | `Discover.jsx:671` | Someone wants to align with you. | ✓ delete toast · push + instant bell |
| G10 | `Discover.jsx:766` | You're at 82%. Profile strength needs 75%. | ✓ reword |
| G11 | `Discover.jsx:769` | Your profile needs 75% to send. Open Profile to finish it. | ✓ reword |
| G12 | `Profile.jsx:715` | This feature is temporarily unavailable… (openEditDrawer) | ✓ reword + action |
| G13 | `Profile.jsx:730` | This feature is temporarily unavailable… (openPhotoSlot) | ✓ reword + action |
| G14 | `Profile.jsx:733` | Wait for the current upload to finish. | ✓ keep |
| G15 | `Profile.jsx:759` | This feature is temporarily unavailable… (removePhoto) | ✓ reword + action |
| G16 | `Profile.jsx:1139` | This feature is temporarily unavailable… (updateProfile) | ✓ reword + action |
| G17 | `Profile.jsx:1170` | Could not save. Please try again. | ✓ toasted guard |
| G18 | `Profile.jsx:1258` | Upload failed (gallery row stale; live: Upload failed. Check the file and try again.) | ✓ reword |
| G19 | `Profile.jsx:1813` | College badge visible on your card. | ✓ reword |
| G20 | `Profile.jsx:1813` | College badge hidden from your card. | ✓ reword |
| G21 | `Chat.jsx:553` | Couldn't send message. Check your connection. (+Retry) | ✓ keep |
| G22 | `Chat.jsx:596` | Couldn't upload photo. Check your connection. (+Retry) | ✓ keep |
| G23 | `Chat.jsx:681` | Failed to delete. Please try again. | ✓ keep |
| G24 | `Chat.jsx:708` | Failed to end this conversation. Please try again. | ✓ keep |
| G25 | `Chat.jsx:723` | Failed to block this user. Please try again. (+Retry) | ✓ keep |
| G26 | `Chat.jsx:1052` | Report submitted. Thank you for keeping the community safe. | ✓ keep |
| G27 | `Settings.jsx:139` | Location permission was denied. Enable it in browser settings. | ✓ same as G4 |
| G28 | `Settings.jsx:140` | Location needs https. It won't work without it. | ✓ same as G5 (reword) |
| G29 | `Settings.jsx:141` | Couldn't get a location reading. Try again, or check phone GPS settings. | ✓ same as G6 |
| G30 | `Settings.jsx:151` | Showing people near you first | ✓ reword |
| G31 | `Settings.jsx:153` | Couldn't save your location | ✓ reword + nudge |
| G32 | `Settings.jsx:177` | Showing your campus and beyond | ✓ reword |
| G33 | `Settings.jsx:179` | Couldn't change your distance setting | ✓ reword + nudge |
| G34 | `Settings.jsx:227` | Preference saved. | ✓ reword |
| G35 | `Settings.jsx:230` | Could not save. Try again. | ✓ guard + server msg |
| G36 | `Settings.jsx:253` | Could not load blocked people. | ✓ reword + nudge |
| G37 | `Settings.jsx:264` | Unblocked {name}. They can now appear in your deck. | ✓ reword (deck→feed) |
| G38 | `Settings.jsx:266` | Could not unblock. Try again. | ✓ reword (named) |
| G39 | `Settings.jsx:289` | Could not delete account. Try again. | ✓ reword |
| G40 | `Settings.jsx:532` | Pick a college and enter its email. | ✓ reword |
| G41 | `Settings.jsx:536` | Code sent — check your inbox. | ✓ reword (names address) |
| G42 | `Settings.jsx:535` | Could not send code. | ✓ guard + reword |
| G43 | `Settings.jsx:557` | College updated. Your deck resets around it. | ✓ reword (deck→feed) |
| G44 | `Settings.jsx:560` | Could not change college. | ✓ guard + reword |
| G45 | `Header.jsx:156` | Someone sent you a message. | ✓ delete (dead `new-letter`; aligns = G9) |
| G46 | `ProfileCard.jsx:984` | Report submitted. (live: full G26 string) | ✓ keep (already = G26) |
| G47 | `ReportModal.jsx:201` | Please select a reason for reporting. | ✓ delete (dead: button disabled) |
| G48 | `ReportModal.jsx:216` | Failed to submit report: {err} | ✓ reword (drop err.message) |
| G49 | `Onboarding.jsx:505` | live: Upload failed. Check the file and try again. | ✓ reword (match G18) |
| G50 | `Onboarding.jsx:589` | Something went wrong. (publish fallback) | ✓ guard + reword |
| G51 | `Matches.jsx:130` | Something went wrong. Please try again. | ✓ guard + reword (unmatch) |
| G52 | `Roulette.jsx:53` | live: Roulette opens soon. | ✓ reword (coming soon) |