# UI / NAVIGATION INSPECTION — huh? (Matchalize)

```
Generated:       2026-10-16
Method:          SOURCE-CODE INSPECTION ONLY
                 I did NOT run the app. I did NOT start a server, connect to a
                 database, seed data, deploy, or contact any external service.
Reason:          booting the server runs syncIndexes() + seedGatedColleges()
                 against whatever MONGODB_URI is set (likely Atlas), and the
                 Playwright QA harness cannot complete login (broken — see §11).
Scope:           client/src/** — visible interface, component placement,
                 navigation, panels, user journeys
Companions:      summary.md (backend/app-wide audit)
                 summary2.md (Roulette implementation design)
Companion note:  §1 findings were corrected where a prior explore report
                 misread a file. Corrections are marked [CORRECTED].
Legend:          [CONFIRMED] read in source · [INFERRED] reasoned · [UNKNOWN] needs runtime
```

---

Here is how the current interface is actually arranged.

---

## 1. SHORT PLAIN-ENGLISH SCREEN MAP

There are **five screens** in the whole app, chosen by a `useState` variable — not by URL.
Think of it like five slides in a carousel. Which slide you see is remembered nowhere.

```
splash ──> auth ──> onboarding ──> home
              ↑                        │
              └──── reverify ─────────┘

home = the main app, which has FOUR TABS inside it
        Deck · Letters · Roulette · Profile
```

**The single most important structural fact:** **there is no router.** `react-router-dom`
is installed in `package.json` but has **zero imports** (`client/package.json:22`). The
authors documented this themselves at `AppShell.jsx:118-120`, `utils/chrome.js:23-25` and
`public/sw.js:152-154`.

**Consequence:** switching tabs **completely unmounts** the old page. Every bit of page
state — deck position, chat draft, scroll position — is destroyed and rebuilt. And **the
browser Back button closes nothing.** There are exactly three `window.history` calls in
the entire client (`AppShell.jsx:208`, `AccountSuspendedScreen.jsx:112-113`), and none of
them push an entry for a tab or an overlay.

### Where each thing lives

| Thing | Where | How you get there |
|---|---|---|
| **Deck** | Tab 1 | Bottom nav / sidebar |
| **Letters (conversations)** | Tab 2 | Bottom nav / sidebar |
| **Roulette** | Tab 3 | Bottom nav / sidebar — **placeholder only** |
| **Profile** | Tab 4 | Bottom nav / sidebar |
| **Letterbox (incoming requests)** | Full-screen overlay, z 1000 | **The bell — which only exists on the Deck tab** |
| **Chat** | Full-screen sheet (mobile) / centred card (desktop) | Tap a Letters row, or Accept in Letterbox |
| **Chat profile sheet** | Bottom sheet inside Chat | Tap the chat avatar/name, or kebab → View Profile |
| **Settings** | Full-screen overlay, z 600 | **The gear — which only exists on the Profile tab** |
| **Admin** | A separate `/admin` path | Typing the URL (`App.jsx:33`) |
| **Toasts** | Fixed top-centre, z 9999 | Automatic, anywhere |

**Two entry points are surprisingly narrow:**
- You **cannot** reach Settings from the Deck, Letters, or Roulette. `Header.jsx:151`
  gates the gear on `title === 'Profile'`.
- You **cannot** reach the Letterbox from Letters, Roulette, or Profile.
  `Header.jsx:150` gates the bell on `title === 'Deck'`.

---

## 2. MOBILE DIAGRAMS

### 2.1 App shell (all four tabs share this)

```
┌─────────────────────────────────┐
│ ⬤ matchalize            🔔 3   │ ← Header — FIXED, z 500
│                                 │   only Deck shows 🔔
├─────────────────────────────────┤
│                                 │
│      page content               │ ← contentStage, z 1
│      (this is the active tab)   │   430px max width
│                                 │
├─────────────────────────────────┤
│  DECK  LETTERS  ROULETTE  PROFILE   ← NavBar — IN FLOW, z 50
│   ⌖     ♥(4)     ⇄        ☺          not position:fixed
└─────────────────────────────────┘
     ▲ 4-column CSS grid, hardcoded (NavBar.jsx:45-53)
```

### 2.2 Deck tab

```
┌─────────────────────────────────┐
│ ⬤ matchalize            🔔 3   │
├─────────────────────────────────┤
│ ┌───┐                           │ ← DeckActions, FIXED left column
│ │ ✕ │ Pass                     │   z 500, top-left
│ │ ↺ │ Undo (5s ring)           │
│ │ ⊕ │ Refresh location         │
│ └───┘                           │
│                                 │
│  ╭───────────────────────────╮  │
│  │                           │  │
│  │        HERO PHOTO         │  │ ← full-bleed, position:absolute inset:0
│  │        (photos[0])        │  │
│  │                           │  │
│  ╭───────────────────────╮   │  │
│  │ ▬▬▬                    │   │  │ ← grabber pill
│  │ Priya, 21           ⋮   │   │  │   ⋮ kebab = "Report profile"
│  │ IIT BOMBAY               │   │  │   (NO block entry point)
│  │ Near you                 │   │  │
│  │ About                    │   │  │
│  │ short bio text…          │   │  │
│  │ Vitals                   │   │  │
│  │ 🗓 Year   ✨ Pronouns    │   │  │
│  │ Seeking                  │   │  │
│  │ [chips] [chips]          │   │  │
│  │ Interests/4               │   │  │
│  │ Exhibits                 │   │  │
│  │ ┌────┐ ┌────┐ ┌────┐     │   │  │ ← long-press or click a tile
│  │ │prompt│ │photo│ │photo│     │   │  │   → PopoutItem modal
│  │ └────┘ └────┘ └────┘     │   │  │
│  ╰───────────────────────╯   │  │
│  ╰───────────────────────────╯  │
│                                 │
├─────────────────────────────────┤
│     ╭───────────────────╮       │
│     │   ▶  ALIGN  ↗     │       │ ← separate full-width bar
│     ╰───────────────────╯       │   (deliberately not in the left column)
├─────────────────────────────────┤
│  DECK  LETTERS  ROULETTE  PROFILE   │
└─────────────────────────────────┘
```

**The sheet drags vertically.** Drag up to reveal bio/prompts, drag down to collapse to the
photo. As the sheet rises, the photo scales `1 → 1.06` and fades `1 → 0.6`
(`ProfileCard.jsx:616-628`). Dragging the sheet near the top auto-hides the header
(`ProfileCard.jsx:889-984` → `AppShell.jsx:229` → `Header.jsx:196` slides to `y:-110`).

### 2.3 Letterbox (incoming requests) — full-screen overlay, z 1000

```
┌─────────────────────────────────┐
│ LETTERBOX              2 pending ✕│ ← ⚠ ONLY reachable from Deck tab
├─────────────────────────────────┤
│ ▣ ALIGN                         │
│ ┌────┐                          │
│ │ 📷 │ Priya sent a letter.     │ │ ← name + avatar, unconditional
│ └────┘ Wants to align with you. │
│                          ACCEPT ✕ │
│                                 │
│ ▣ EARLIER                       │
│ ┌────┐                          │
│ │ 📷 │ Arjun  sent a telegram.  │
│ └────┘ Sent a telegram.   [✕]   │
│                          ACCEPT ✕ │
│                                 │
│                    ⋮             │
│                 ⋮                 │ ← footer
└─────────────────────────────────┘
   Tap a row → bottom sheet (z 1101) with About / Prompts
   and Decline · Align buttons
```

### 2.4 Letters tab (conversations)

```
┌─────────────────────────────────┐
│ LETTERS                         │ ← ⚠ no bell here, no gear here
├─────────────────────────────────┤
│ 🔍 Search letters...        ✕   │
│ ┌────┐                          │
│ │ 📷 │ Priya, 21            ⋮   │ ← 56px avatar, yellow ring = unread
│ └────┘ 📷 Sent a photograph     │   coral dot = unread
│                       3h  [4]   │   kebab → single item "Unmatch"
│ ┌────┐                          │
│ │ 📷 │ Arjun, 22            ⋮   │
│ └────┘ You: hey           12m   │
├─────────────────────────────────┤
│  DECK  LETTERS(4) ROULETTE  PROFILE │
└─────────────────────────────────┘
```

### 2.5 Chat — full-bleed sheet, z 1000, covers nav AND header

```
┌─────────────────────────────────┐
│ ‹ (📷●) Priya            🔍  ⋮  │ ← tap avatar OR name OR status
│             Typing...           │   → opens profile sheet
├─────────────────────────────────┤  ← 64px header, 2px ink border
│                                 │
│ ────────── Today ──────────     │
│ ┌─────────────────────────────┐ │
│ │ Opening Letter              │ │ ← hoisted ABOVE chronological order
│ │ "hey"                       │ │
│ └─────────────────────────────┘ │
│                                 │
│           ┌────────┐             │
│           │  📷    │      SEEN   │ ← receipts on YOUR messages only
│           └────────┘             │   🕐 14:32
│                                 │
│                    ···          │ ← typing dots
├─────────────────────────────────┤
│ 📎 │ Write a message... │ 🚀   │ ← mic replaces 🚀 when empty
├─────────────────────────────────┤
│  (nav is covered by this sheet)  │
└─────────────────────────────────┘

kebab menu (no backdrop, no Escape):
   View Profile
   Report User    ← red
   Block User     ← red
   Unmatch        ← red
```

### 2.6 Profile sheet from chat — bottom sheet, z 100

```
┌─────────────────────────────────┐
│ ░░░░ dimmed backdrop ░░░░░░░░░░ │
│ ╭─────────────────────────────╮ │
│ │ View Profile            ✕   │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │       HERO PHOTO        │ │ │ ← Archival Subject
│ │ │  Priya, 21              │ │ │
│ │ │  General ✦ 2026         │ │ │ ← "General" = branch NOT SENT
│ │ └─────────────────────────┘ │ │
│ │ Vitals                      │ │
│ │ [gender] [pronouns]         │ │ ← hostel pill is DEAD (field removed)
│ │ Seeking                     │ │
│ │ [intent chips]              │ │ ← defaults to 3 fake chips if empty!
│ │ Recorded Curiosities        │ │
│ │ [interests]                 │ │
│ │ ┌────┐┌────┐┌────┐         │ │
│ │ │prom││pho ││prom│         │ │
│ │ └────┘└────┘└────┘         │ │
│ │ ⚠ bio is NEVER rendered    │ │
│ ╰─────────────────────────────╯ │
└─────────────────────────────────┘
```

### 2.7 Roulette tab — placeholder

```
┌─────────────────────────────────┐
│ ROULETTE                        │ ← title only, no bell, no gear
├─────────────────────────────────┤
│                                 │
│         ╭──────────╮           │
│         │    ⇄     │           │ ← decorative Shuffle icon
│         ╰──────────╯           │   in a 92×92 yellow tile
│                                 │
│      C A M P U S  R O U L E T T E
│   LIVE SERENDIPITY · SAME CAMPUS
│        + ALL CAMPUSES          │
│                                 │
│  ╭───────────────────────────╮  │
│  │  ▶   START A LIVE SESSION │  │ ← THE ONLY INTERACTIVE ELEMENT
│  ╰───────────────────────────╯  │   fires a toast, nothing else
│                                 │
│  Step in face-to-face. A mutual │
│  yes plants a seed of interest  │
│  that flows straight into your  │
│  Matches.                       │ ← ⚠ implies post-call matching
│                                 │    that does not exist
│  ╭───────────────────────────╮  │
│  │🛡 Only verified college   │  │ ← decorative div, not a button
│  │  students … enter         │  │
│  ╰───────────────────────────╯  │
│  ╭───────────────────────────╮  │
│  │⇄ Each session is          │  │ ← ⚠ "anonymous" is FALSE — camera on
│  │  anonymous until you      │  │
│  │  choose to reveal         │  │
│  ╰───────────────────────────╯  │
├─────────────────────────────────┤
│  DECK  LETTERS  ROULETTE  PROFILE │
└─────────────────────────────────┘
```

---

## 3. DESKTOP DIFFERENCES

Breakpoint: **`window.innerWidth >= 768`** (`utils/useIsDesktop.js:4`). A `resize`
listener — no `matchMedia`, no debounce (`useIsDesktop.js:11-20`).

**The desktop and mobile trees are entirely separate `return` statements**
(`AppShell.jsx:242` desktop, `:312` mobile). Only `<Header>`, `<PushPrompt>`,
`<Suspense>`, `<Settings>` and `renderPage()` are shared.

```
┌──────────────┬──────────────────────────────────────────┐
│ ⬤ matchalize │  (header floats over the page)          │
│ CAMPUS LEDGER│            🔔 3                          │
├──────────────┤                                          │
│  ⌖  Deck     │                                          │
│  ♥  Letters 4│      page content                        │
│  ⇄  Roulette │      max-width 1200px, centred           │
│  ☺  Profile  │                                          │
│              │                                          │
│──────────────│                                          │
│  ⭯  Log Out  │ ← ⚠ NOT on mobile — mobile logout is    │
└──────────────┘   inside Settings only                   │
```

| Aspect | Mobile | Desktop |
|---|---|---|
| Root flex direction | `column` (`:373`) | `row` (`:415`) |
| Root `contain: 'layout'` | **yes** — creates a stacking context (`:380`) | **no** (`:414-421`) |
| Nav | `NavBar`, 4-col grid, max-w 480 | `DesktopSidebar`, 260px floating panel |
| Nav position | **in flow** (`relative`, `z 50`) | **in flow** (`relative`, `z 100`) |
| Brand shown | wordmark in header | wordmark + **"Campus Ledger"** subtitle |
| Active tab style | yellow fill + `2px 2px 0` shadow | card fill + border, **no shadow** |
| Badge | square `radius 3`, caps at **99+** | pill `radius 999`, white text |
| Logout | Settings only | Sidebar footer button |
| **Chat** | full-bleed slide-up, **no backdrop**, no dismiss-on-outside | centred card on `rgba(12,12,14,0.62)` scrim, `min(800px,92vw) × min(85vh,860px)`, **scrim click closes** |
| Deck actions | floating left column + bottom Align bar | **one toolbar** below card: ↺ ✕ **ALIGN ↗** + key legend |
| Keyboard shortcuts | none | `←`/`P` pass · `→`/`L` align · `↓`/`B` back |
| Page max-width | none (430px shell) | `1200px` (`:445-446`) |

**The header is `position: fixed` on BOTH** (`Header.jsx:103`) and has **zero responsive
variation** — the same 42px buttons and 30px wordmark render identically on a 375px phone
and a 1440px monitor.

⚠️ **`Header.slotLeft` is always empty** (`Header.jsx:200`). One third of the fixed 3-column
header grid is dead space.

⚠️ **Crossing 768px remounts the whole tree.** The Deck's `currentIndex` resets. [INFERRED
from React reconciliation across two different return paths.]

---

## 4. UI ELEMENT TABLE

| UI element | Position | Opens what | Current behaviour | Source |
|---|---|---|---|---|
| **Tab: Deck** | NavBar slot 1 / Sidebar | `<Discover>` page | Full remount; restored from 30-min localStorage cache | `NavBar.jsx:23`, `AppShell.jsx:229` |
| **Tab: Letters** | NavBar slot 2 / Sidebar | `<Matches>` page | Conversation list; unread badge = sum of `unreadCount` | `NavBar.jsx:24`, `:242-256` |
| **Tab: Roulette** | NavBar slot 3 / Sidebar | `<Roulette>` page | **Stub.** Button fires a toast only | `NavBar.jsx:25`, `AppShell.jsx:235` |
| **Tab: Profile** | NavBar slot 4 / Sidebar | `<Profile>` page | Own profile editor + settings gear host | `NavBar.jsx:26`, `AppShell.jsx:233` |
| **Wordmark** | Header centre, Deck only | Deck tab | `onNavigate('discover')` | `Header.jsx:174-186` |
| **Bell 🔔** | Header right, **Deck only** | `NotificationDrawer` (Letterbox) | Toggle. Badge from `unread-count`, caps at `9+` | `Header.jsx:150-172` |
| **Gear ⚙** | Header right, **Profile only** | `Settings` overlay | The **only** Settings entry in the app | `Header.jsx:151,212-221` |
| **Header left slot** | Header left | *nothing* | **Always empty** | `Header.jsx:200` |
| **Card kebab ⋮** | Card sheet, top-right | `Report profile` row | **Report only — no block entry** | `ProfileCard.jsx:1108-1168` |
| **Card sheet** | In-place, vertical drag | *nothing* | Reveals bio/prompts. Never triggers an action | `ProfileCard.jsx:889-984` |
| **Prompt/photo tile** | In card Exhibits | `PopoutItem` modal | Long-press 280ms (touch) or click (desktop) | `PopoutItem.jsx:274-352` |
| **Pass ✕** | Mobile top-left / desktop toolbar | — | `POST /discover/pass/:id` | `DeckActions.jsx:145-153` |
| **Align** | Mobile bottom bar / desktop toolbar / PopoutItem | match modal if mutual | `POST /discover/align/:id` | `DeckActions.jsx:214-226` |
| **Undo ↺** | Below Pass / desktop toolbar | previous card | 5s window, SVG progress ring | `DeckActions.jsx:155-179` |
| **Match modal** | z 99999, full-screen | `Open chat` button | Opens chat overlay **over the Deck** | `Discover.jsx:833-918` |
| **Letterbox row** | Drawer body | profile bottom sheet | Tap/Enter opens preview | `NotificationDrawer.jsx:138-144` |
| **Accept** | Drawer row right | chat overlay | `POST /notifications/:id/accept` | `NotificationDrawer.jsx:184` |
| **Dismiss ✕** | Drawer row right | — | `PUT /notifications/:id/dismiss`, 350ms optimistic | `NotificationDrawer.jsx:186-193` |
| **Letters row** | Letters body | chat overlay | Clears unread locally, no server call | `Matches.jsx:268` |
| **Letters kebab ⋮** | Row right | `Unmatch` menu item | Single item; `window.confirm` first | `Matches.jsx:339-391` |
| **Search letters** | Letters top | filters rows | Name only, client-side `includes` | `Matches.jsx:215-235`, `:144` |
| **Chat back ‹** | Chat header left | closes chat | `onPointerDown` only; the `onClick` is dead | `Chat.jsx:729` |
| **Chat avatar/name** | Chat header left | **profile bottom sheet** | `onClick={() => setShowProfile(true)}` | `Chat.jsx:731` |
| **Chat kebab ⋮** | Chat header right | 4-item dropdown | **No backdrop, no Escape, no outside-click** | `Chat.jsx:758-783` |
| **Chat search 🔍** | Chat header right | `SearchOverlay` z 1000 | Not portaled — trapped in Chat's z 50 context | `Chat.jsx:753`, `SearchOverlay.jsx:88` |
| **Message long-press** | Any bubble | `MessageActionMenu` z 9999 | 400ms; Reply/React/Copy/Report/Delete | `MessageBubble.jsx:24-34` |
| **Composer 📎** | Chat bottom left | `Attach Media` sheet | image only (`accept="image/*"`) | `Chat.jsx:939-947` |
| **Composer mic** | Chat bottom right | — | `getUserMedia({audio:true})`. **No duration cap, no cancel, no error toast** | `Chat.jsx:972-984`, `:593-615` |
| **PushPrompt** | Fixed bottom, z 1200 | OS permission | **The only** Notification.requestPermission in the client | `PushPrompt.jsx:87-93` |
| **Toast** | Fixed top, z 9999 | — | One at a time. 4s plain / 7s with action | `ArchivalToast.jsx:117` |
| **ShadowbanBanner** | In-flow, top of Deck/Profile | `LearnMoreSheet` | Only when `score >= 5.0`. **Never shows the score** | `ShadowbanBanner.jsx:21,71` |
| **Error boundary** | Wraps everything | `window.location.reload()` | "Ink Spilled" | `App.jsx:134`, `ErrorBoundary.jsx:113` |

---

## 5. THE EXACT JOURNEYS

### Journey 1 — Deck → incoming request → acceptance → chat → profile

```
┌─ Step 1 ────────────────────────────────────────────────────┐
│ Deck tab. Someone taps ALIGN on your card.                  │
│ Server: Notification.create({type:'new_align'})            │
│         socket 'new-align' fires                            │
│ Client: Header.jsx:125-134 bumps the cached count           │
│         ⚠ count is NEVER decremented on accept/dismiss      │
│         ⚠ refetch only fires when drawerOpen goes false      │
└─────────────────────────────────────────────────────────────┘
┌─ Step 2 ────────────────────────────────────────────────────┐
│ Bell badge shows "3". User taps it.                         │
│ ⚠ Only possible while ON THE DECK. Leaving the tab         │
│   unmounts nothing (Header stays) but hides the bell.       │
│ NotificationDrawer: position fixed inset 0, z 1000          │
│ → completely covers the screen including the sidebar        │
└─────────────────────────────────────────────────────────────┘
┌─ Step 3 ────────────────────────────────────────────────────┐
│ Row shows: avatar (photos[0]), name,                        │
│   "Priya sent a letter."  ← ⚠ verb never changed for align │
│   "Wants to align with you."  ← the snippet                 │
│ User taps ACCEPT                                             │
└─────────────────────────────────────────────────────────────┘
┌─ Step 4 ────────────────────────────────────────────────────┐
│ POST /api/notifications/:id/accept                          │
│   1. block check FIRST → indistinguishable 404              │
│   2. suspended/deleted → 410 USER_UNAVAILABLE               │
│   3. Interaction 'accept_letter' recorded                   │
│   4. Alignment upsert on pairKey (atomic)                   │
│   5. opening_letter Message upserted                        │
│   6. notification.isCleared = true                          │
│   7. socket 'match-notification' + push                     │
│   ⚠ UI only console.errors a 410 — silent no-op             │
└─────────────────────────────────────────────────────────────┘
┌─ Step 5 ────────────────────────────────────────────────────┐
│ Row removed locally, sheet closed, drawer closed.           │
│ setActiveChat(match) → chat overlay slides up               │
│ ⚠ handleOpenChat does NOT call setActiveTab('matches')      │
│   → you are still ON THE DECK behind the chat               │
└─────────────────────────────────────────────────────────────┘
┌─ Step 6 ────────────────────────────────────────────────────┐
│ Chat header shows: avatar + name + status line.             │
│   NO age. NO year. NO college. NO pronouns.                 │
│ User taps avatar or name → ChatProfileView bottom sheet     │
│   Shows: hero photo, name+age, branch||'General',           │
│          Vitals, Seeking, interests, prompt/photo grid       │
│   ⚠ bio is sent by the API but NEVER rendered              │
│   ⚠ pronouns/hostel are NOT sent → pills silently omitted  │
│   ⚠ intent defaults to 3 FABRICATED chips when empty        │
└─────────────────────────────────────────────────────────────┘
┌─ Closing ───────────────────────────────────────────────────┐
│ Chat closes → back to the DECK (not Letters).               │
│ ⚠ All Chat state destroyed: draft, scroll, pagination.      │
│   Messages survive (React Query cache, 2min staleTime).     │
└─────────────────────────────────────────────────────────────┘
```

### Journey 2 — App navigation → Roulette → current Start behaviour

```
┌─ Step 1 ────────────────────────────────────────────────────┐
│ User taps the ⇄ ROULETTE tab (NavBar slot 3 / Sidebar)     │
│ triggerHaptic('light'), setActiveTab('roulette')            │
│ AnimatePresence mode="wait" → previous page FULLY UNMOUNTS  │
│ Roulette mounts inside <Suspense> (lazy chunk may download)  │
└─────────────────────────────────────────────────────────────┘
┌─ Step 2 ────────────────────────────────────────────────────┐
│ Renders: yellow tile + ⇄ icon, "CAMPUS ROULETTE",          │
│          strapline, Start button, body copy, 2 rails         │
│ Header shows title "Roulette" only — no bell, no gear       │
│ Header is permanently visible (Roulette passes no           │
│ header-proximity callback, so headerWanted never changes)   │
└─────────────────────────────────────────────────────────────┘
┌─ Step 3 — THE ACTUAL CLICK BEHAVIOUR ──────────────────────┐
│ Roulette.jsx:37-42                                          │
│   triggerHaptic('heavy')                                    │
│   setStarting(true)      → label becomes "Preparing…"        │
│   toast.info('Roulette is coming soon.')                    │
│   setTimeout(() => setStarting(false), 400)                 │
│                                                          │
│ That is the ENTIRE handler.                                │
│   ✗ no getUserMedia      ✗ no API call                     │
│   ✗ no socket emit       ✗ no permission request            │
│   ✗ no camera preview    ✗ no peer tile                    │
│   ✗ no queue             ✗ no navigation                   │
└─────────────────────────────────────────────────────────────┘
┌─ Step 4 ────────────────────────────────────────────────────┐
│ User taps any other tab → Roulette UNMOUNTS.                │
│ Its only state (`starting`) is gone.                        │
└─────────────────────────────────────────────────────────────┘
```

**What is decorative vs functional on this screen:**

| Element | Status |
|---|---|
| Shuffle tile, heading, strapline | **Decorative** |
| Start button | **Functional — but only fires a toast** |
| Body copy | **Decorative, and factually wrong** (implies post-call matching) |
| Rail 1 (verified students) | **Decorative `div`, not a button** |
| Rail 2 ("anonymous until you reveal") | **Decorative, and factually wrong** |
| `.rt-rail` CSS class | **Has no rule of its own** — dead |

---

## 6. ANSWERS A–I

### A. Where do incoming Deck Align requests appear today?

**In the Letterbox — a full-screen overlay opened by the bell, and the bell only renders on
the Deck tab.**

- `Header.jsx:150` — `const showNotificationBell = isDeck`
- `Header.jsx:222` — `{showNotificationBell && bell}`
- `NotificationDrawer.jsx:421-424` — `position: fixed; inset: 0; z-index: 1000`

**Not in the Letters tab.** Verified: `Matches.jsx:56-59` fetches `/alignments`, which
returns `{users: userId, isActive: true}` conversations only (`alignments.js:50`). Pending
requests are never rendered there.

⚠️ **Three confirmed bugs in this surface:**
1. **Pagination silently dropped.** `GET /notifications` defaults to `limit=20` and returns
   `{total, page, totalPages, hasMore}` (`notifications.js:81,96-102`).
   `NotificationDrawer.jsx:47-48` calls it with no params and ignores all of it. **A user
   with >20 pending requests sees only the newest 20, with no way to reach the rest.**
2. **Badge never decrements.** The socket bumps it (`Header.jsx:125-134`); refetch only
   fires on drawer close (`:121-123`).
3. **In-drawer count is the page length, not the total** (`NotificationDrawer.jsx:208`).

### B. Where do existing conversations appear?

**In the Letters tab — `Matches.jsx`, a flat list of accepted Alignments.**

- `AppShell.jsx:231` — `<Matches key="matches" onOpenChat={handleOpenChat} />`
- Source: `GET /api/alignments` → `{matches: [...]}` (`alignments.js:27,191`)

Rows show avatar, name + age, last-message preview, timestamp, unread state, and a kebab
with one item (`Unmatch`). **No college, no year, no hostel, no online dot.**

⚠️ Name the tab carefully: **"Letters" is the conversations list, not the Letterbox.** The
Letterbox holds pending requests. They are different surfaces with different names.

### C. Is there already a shared notification/request system?

**Yes — one collection, one drawer. But it is not shared with conversations.**

| | Requests | Conversations |
|---|---|---|
| Collection | `Notification` | `Alignment` + `Message` |
| Endpoint | `GET /api/notifications` | `GET /api/alignments` |
| UI | `NotificationDrawer` (Letterbox) | `Matches.jsx` (Letters tab) |
| Unread definition | `isCleared: false` (`notifications.js:60`) | `yourTurn \|\| last not read` (`Matches.jsx:254-257`) |
| Badge | Bell, caps `9+` | NavBar, caps `99+` |

**Two different counters with two different caps.** The `Notification` enum has three
types (`Notification.js:23`) but **only `new_align` is ever written** — `new_letter` and
`priority_telegram` are marked *retired as writers* (`Notification.js:17-22`) and survive
only in the test seeder and a migration.

So: the *system* is shared (one drawer, one collection, one unread model), but the
*conversations* are a separate pipeline entirely.

### D. Could a Roulette request reuse its backend without forcing the same visual card?

**Yes — the backend is generic; the visual card is a separate component.**

Reusable as-is:
- `Notification` model, `isCleared` lifecycle, 30-day TTL
- `GET /api/notifications` + `unread-count` + `PUT /:id/dismiss`
- The whole `accept` pipeline (block check → Interaction → Alignment upsert → opening letter)

**The visual card is NOT forced.** `NotificationDrawer.renderRow` (`:110-197`) is one
function; a different row renderer could be added behind a `type` branch without touching
the model.

⚠️ **But three server behaviours are baked into `accept` and assume profile context:**
1. It **always** creates an `Alignment` (`notifications.js:177-193`) — which means a chat
   appears in the recipient's Letters tab.
2. It **always** creates an `opening_letter` Message (`:195-235`), which reads
   `senderProfile.photos[idx]` and `p.question` (`:208-223`).
3. Every row unconditionally renders `sender.name` and `sender.photos[0]`
   (`NotificationDrawer.jsx:117-118`), and the server populates full identity
   (`notifications.js:93`).

So the **plumbing** is reusable; **the semantics** (auto-chat + auto-letter + real name)
would need to become conditional.

### E. Could existing chat be displayed in a slide-in panel, or is it tightly coupled to a full-screen layout?

**Tightly coupled. Chat's own root claims the entire viewport unconditionally.**

```js
// Chat.jsx:1081
page: { position: 'fixed', inset: 0, backgroundColor: t.paper,
        display: 'flex', flexDirection: 'column', zIndex: 50, overflow: 'hidden' }
```

`position: fixed` + `inset: 0` with **no `width`, no `height`, no `maxHeight` clamp of its
own**. It has no intrinsic way to be sized by a parent.

- **Mobile** already works as a slide-up sheet (`AppShell.jsx:399-409`) — but that sheet is
  also `position: fixed; inset: 0`, so the two full-viewport layers merely coincide.
- **Desktop** renders it inside a centred card `min(800px,92vw) × min(85vh,860px)`
  (`AppShell.jsx:449-459`). This works only because framer-motion's `scale: 0.95` transform
  on the card makes it the containing block for `position: fixed` descendants during the
  animation. **[INFERRED]** Once the animation settles and the transform is removed, a
  `position: fixed` child would escape to the full viewport. **This needs a browser check.**

**What a slide-in panel would require:** a style/geometry prop on Chat's root, plus
replacing the internal `messageContainer` flex sizing. Not a wrapper change.

### F. Would opening that panel currently unmount Roulette?

**It depends on how you reach the chat — and this distinction matters a lot.**

| Action | Does Roulette unmount? |
|---|---|
| **Open the chat overlay while on the Roulette tab** | **NO.** `Chat` is a **flat sibling** of the page stage (`AppShell.jsx:347` vs `:333`), not nested inside it. The page underneath stays mounted. |
| **Switch to the Letters tab to reach chat** | **YES.** `AnimatePresence mode="wait"` keyed on `activeTab` (`AppShell.jsx:266`, `:326`) fully unmounts the outgoing page. |
| **Open the Letterbox from Roulette** | **Cannot** — the bell is Deck-only. |
| **Switch tabs at all** | **YES** — for every tab including Roulette. |

**This is the good news for a future video feature:** a chat overlay drawn as a sibling of
the page stage does **not** destroy the page beneath it. **But** the current chat entry
points all live on the Deck or Letters tab, and a tab switch is destructive.

**Confirmed structural fact:** `Chat` and `Settings` are siblings of the page stage, never
nested inside it, and never portaled (`AppShell.jsx:280-306` desktop, `:346-362` mobile).

### G. Does clicking a chat avatar currently reveal the real profile automatically?

**Yes — unconditionally, and with no consent step.**

```js
// Chat.jsx:731
<div style={styles.headerLeft} onClick={() => setShowProfile(true)}>
```

`headerLeft` wraps **the avatar, the name, and the status line** (`:732-750`) and has
`cursor: pointer` (`:1086`). Second entry point: kebab → `View Profile` (`:770`).

Renders `ChatProfileView` (`:150-298`) as a **bottom sheet**, z 100 (`:172`), slide-up from
`y: '100%'` (`:174`). Not a screen change, not a router push. Backdrop tap closes it.

**It shows the real profile:** hero photo, name + age, gender, pronouns, intent,
interests, and up to 3 prompts + 3 more photos. **Not keyboard accessible** — no `role`,
no `tabIndex`, no `onKeyDown`.

⚠️ Three confirmed data problems in that sheet:
- `bio` is **sent but never rendered** (zero `bio` references in `Chat.jsx`)
- `branch` and `hostel` are **never sent** → `branch` renders the literal `'General'`
- `intent` defaults to **three fabricated chips** (`['Long-term','Connection','Growth']`,
  `Chat.jsx:222`) when the user set none

### H. Which components would need inspection before introducing hidden-profile chats?

**There is no shared avatar or user-chip component in this codebase. [CONFIRMED]** Every
surface re-derives name and avatar inline — **22 distinct render sites**. A temporary name
introduced anywhere would not propagate, and conversely a real name re-renders
independently in 22 places.

**Highest-risk sites, in priority order:**

| # | Site | Why it leaks |
|---|---|---|
| 1 | **`server/utils/push.js` call sites** | **4 of 5 embed a real name.** `messages.js:238` uses `sender.name` as the **lock-screen TITLE**; `discover.js:1649`, `notifications.js:260`, `alignments.js:252` all interpolate names. |
| 2 | **`server/socket/chat.js:169`** | `user-typing` emits `socket.user.name` — **the client-sent `userName` is discarded**. Any masking must happen here, not in `Chat.jsx:506`. |
| 3 | **`Chat.jsx:745`** | Chat header name, unconditional |
| 4 | **`ChatProfileView` `Chat.jsx:196`** | Name + age in the sheet headline |
| 5 | **`NotificationDrawer.jsx:117`** | `sender.name \|\| 'Anonymous'` — single source for the whole row |
| 6 | **`NotificationDrawer.jsx:337`** | `{selectedProfile.name}, {age}` in the preview sheet |
| 7 | **`Matches.jsx:304`** | Conversation row name |
| 8 | **`Matches.jsx:144`** | **Search filters on the real name** even if the display were masked |
| 9 | **`server/routes/users.js:408-417`** | `profile-updated` broadcasts `toPublicCard(user)` — with real `name` and `photos` — to **every** connected socket |
| 10 | **`Discover.jsx:883`** | Match modal: `alignedProfile.name` with **no fallback** |
| 11 | `Settings.jsx:608` | Blocked-people row |
| 12 | `ProfileCard.jsx:1103` | Deck card name |

**The one field with a working server-side strip:** `showCollege`.
`publicCard.js:64-69` deletes `college` and `collegeCode` from the card payload when the
card's own `showCollege === false`, and `discover.js:1676-1679` does the same on the align
payload. **There is no equivalent for `name` or `photos`** — both are on the `CARD_FIELDS`
allowlist and always sent.

**Also check:** `alt` attributes carry names to screen readers at `ProfileCard.jsx:1071`,
`Matches.jsx:291`, `Chat.jsx:735,189`, `NotificationDrawer.jsx:153`.

### I. Which elements should another AI NOT assume are interchangeable?

| Don't assume | Because |
|---|---|
| `react-router-dom` is used | Installed at `package.json:22`, **zero imports** |
| "Letters" and "Letterbox" are the same | Letters = conversations; Letterbox = pending requests |
| `NotificationDrawer` is a side drawer | It is `position: fixed; inset: 0; z 1000` — **full-screen**, covers the sidebar |
| The Deck can be swiped | **Zero swipe handlers exist anywhere.** `Splash.jsx:1475` claims *"The preview cards can be swiped horizontally"* — **this string is false** |
| `ProfileCard` contains the Pass/Align buttons | It contains **zero** action buttons. Its only control is the kebab → Report |
| There is a campus/scope filter on the Deck | The CSS lives at `Header.jsx:54-83` but **no JSX renders it**. `discoverStore.js:86-91` confirms it was removed |
| `PopoutItem` has a close button | **No × exists.** Close = scrim tap, 80px drag, or Escape |
| `ChatProfileView` shows a bio | It never renders one |
| The header's left slot has content | **Always empty** (`Header.jsx:200`) |
| `AuthFlow.jsx` is a live auth screen | **Zero importers.** Dead 912-line file |
| The wordmark says "huh?" | Header and sidebar say **"matchalize"** (`Header.jsx:184`, `DesktopSidebar.jsx:59`) |
| The block button opens a modal | There is **no block modal component** — only `window.confirm` |
| Settings is reachable from any tab | Gear is **Profile-only** (`Header.jsx:151`) |
| Back closes overlays | It closes **nothing** except the suspended screen, which **traps** it |

---

## 7. CONFIRMED DEFECTS AND DEAD CODE

| # | Finding | Evidence |
|---|---|---|
| 1 | **No swipe gesture exists**; Splash copy falsely claims one | `Discover.jsx`, `ProfileCard.jsx` — zero handlers; `Splash.jsx:1475` |
| 2 | **Browser Back closes nothing** in the entire app | 3 history calls total; `AccountSuspendedScreen.jsx:112-114` traps instead |
| 3 | **Tab switch unmounts everything**; `activeTab` never persisted → every reload boots to Deck | `AppShell.jsx:76`, `:266`, `:326` |
| 4 | `renderPage()` `default:` silently renders **Profile** for an unknown tab key | `AppShell.jsx:236-237` |
| 5 | Notification pagination silently dropped — **>20 requests unreachable** | `NotificationDrawer.jsx:47-48` vs `notifications.js:81` |
| 6 | Bell badge never decrements on accept/dismiss | `Header.jsx:121-134` |
| 7 | NotificationDrawer (1000) **ties** with chat overlay (1000) | `NotificationDrawer.jsx:422` vs `AppShell.jsx:402,463` |
| 8 | `LearnMoreSheet` (z 200) **trapped** in Profile's `zIndex: 45` context → renders below Header (500) | `Profile.jsx:1586-1588` |
| 9 | `ChatProfileView` defaults `intent` to **3 fabricated chips** | `Chat.jsx:222` |
| 10 | `ChatProfileView` **never renders `bio`** despite the API sending it | zero refs in `Chat.jsx` |
| 11 | **`styles.input` does not exist** in Chat → composer renders with UA defaults (13.33px font, default width) | `Chat.jsx:1080-1132` |
| 12 | **Likely iOS zoom-on-focus** in the composer (font <16px, no `maximum-scale` protection) | `Chat.jsx:1080-1132`, `index.html:6` |
| 13 | **No keyboard handling in Chat** — no `visualViewport`, no resize listener | Chat.jsx has zero; only `AuthFlow.jsx:326` does (dead file) |
| 14 | Scroll-to-bottom FAB at hardcoded `bottom: 140px` — can overlap a tall composer | `Chat.jsx:1110` |
| 15 | Desktop chat card uses `85vh`, **not `dvh`** | `AppShell.jsx:452` |
| 16 | `Admin.jsx` uses `100vh` throughout, bypassing the dvh discipline | `Admin.jsx:1057-1079` |
| 17 | `Header` badge caps at **`9+`**, NavBar at **`99+`** | `Header.jsx:167` vs `NavBar.jsx:254` |
| 18 | `App.jsx:51` uses legacy `var(--surface-alt)`; AppShell uses `neu.desk` | `App.jsx:51` vs `AppShell.jsx:377` |
| 19 | `TAB_CHROME.discover = #131313` but Discover renders `#FFF9F4` — **status bar told dark for a light screen** | `AppShell.jsx:68` vs `Discover.jsx:44` |
| 20 | `NavBar.jsx:8-20` overrides the **entire** `neu` palette with different hexes AND different fonts | vs `styles/neu.js:17-36` |
| 21 | CSS breakpoints (360/390/600/680/700/760/761) **disjoint** from the single JS breakpoint of 768 | §6.7 |
| 22 | `Header.jsx:236` calls `onNavigate('chat', …)` — `'chat'` is not a tab key. Dead branch today, latent bug | vs `AppShell.jsx:51,227` |
| 23 | `ne...z` token scale used in **exactly one** place; everything else hardcodes | `ReportModal.jsx:265` only |
| 24 | `neu.placeholder.*` SVG tokens defined and **never used** | `styles/neu.js:72-77` |
| 25 | `Discover.jsx:479-486` unreachable pass-POST branch; `PopoutItem` `sealKind`/`type` vestigial | — |
| 26 | Chat accept from a suspended-after-load sender is a **silent no-op** (410 only console.errors) | `NotificationDrawer.jsx:70-72` |
| 27 | `CassettePlayer` styled entirely from **undefined CSS variables**; reel keyframes missing | `CassettePlayer.jsx:40-105` |
| 28 | Blocking from chat doesn't invalidate `['matches']` cache → row lingers up to 30s | `Chat.jsx:700-716` |
| 29 | `match.isActive` never sent by `/alignments` → the "conversation has ended" state is unreachable via Letters | `alignments.js:154-177` vs `Chat.jsx:935` |
| 30 | No "no search results" state in Letters — search yields blank background | `Matches.jsx:169` returns early only on `matches.length === 0` |

---

## 8. IDENTITY TRACING — WHERE THE UI GETS REAL INFORMATION

| Data | Source | Endpoints |
|---|---|---|
| Own name | `useAuth().user`, backed by `AuthContext` | `GET /auth/me` returns the **entire** user document (`auth.js:557-558`) |
| Own photo | same | same |
| Conversation name | `match.user.name` | `GET /api/alignments` `$lookup` projects `name, photos, year, dob, age, lastActive, gender, bio, prompts, intent, interests, suspended, isDeleted` (`alignments.js:121`) |
| Request sender name/avatar | `n.senderId.name`, `.photos[0]` | `GET /api/notifications` populate: `name photos year gender pronouns interests age bio prompts suspended isDeleted` (`notifications.js:93`) |
| Matched-user name | `alignedProfile.name` | align response `targetProfile` (`discover.js:1664-1684`) |
| **`_id`** | **Never displayed to any user.** Used only as React key, comparison, or URL segment | — |

**No initials-from-name or initials-from-`_id`** on any non-admin surface. Every avatar
fallback is a remote placeholder URL — `placehold.co` in most places, and
`NotificationDrawer.jsx:11` uses a literal **`?`** glyph.

**Note the three different partner-object shapes.** The same `<Chat>` component receives
three different payloads, with three different levels of completeness:

| Entry path | Object shape | `age` | `pronouns` | `branch` |
|---|---|---|---|---|
| Letters row | alignments `$lookup` | fresh (from `dob`) | ❌ not sent | ❌ not sent |
| Accept in Letterbox | notification populate | **stale** (`age` stored once) | ✅ sent | ❌ not sent |
| Match modal | `targetProfile` | ❌ **not sent at all** | ✅ sent | ❌ not sent |

So `age` renders as `—` for a just-matched chat, and as a possibly-stale number for a
Letterbox-accepted chat. `withFreshAge()` only runs on the alignments path
(`alignments.js:180-183`).

---

## 9. RESPONSIVE, STACKING, AND OVERLAY BEHAVIOUR

### 9.1 z-index, lowest to highest

```
   0  CSS switches / Auth
   1  contentStage (mobile), sidebar grain, paper grain
   2  badges, chip layers
   6–8 Profile tray bars
  10  ArchivalFallback, EmojiPicker, washi tape
  30  "Updating…" strip
  34  LocationNotice
  40  "Showing newer profiles"
  45  Profile's ShadowbanBanner wrapper      ← traps LearnMoreSheet
  50  NavBar (mobile, in flow)
  50  Chat's own page root
 100  DesktopSidebar, edit-drawer backdrop, Matches menu
 101  Profile edit-drawer sheet
 110  Settings sub-sheet backdrop
 120  Chat attach-sheet backdrop
 200  LearnMoreSheet                          ← effectively buried on Profile
 500  Header (fixed) + DeckActions
 600  Settings overlay
 620  Settings LegalSheet
1000  Chat overlay / NotificationDrawer      ← TIE
1000  SearchOverlay                          ← trapped inside Chat's z50
1100  ReportModal (portaled), drawer backdrop
1101  drawer profile sheet
1200  PushPrompt
9996  EmojiPicker backdrop
9998  PopoutItem scrim, MessageActionMenu backdrop
9999  Toasts (ArchivalToast), MessageActionMenu
10000 PhotoViewer, PopoutItem seal
99998 Discover match-modal scrim
99999 DiscoverRebuildOverlay                 ← highest layer in the app
```

**Token scale exists but is used once:** `neu.z = {header:500, nav:10, drawer:1000,
modal:1100, toast:9999, overlay:10000}` (`styles/neu.js:62-69`). Only
`ReportModal.jsx:265` references it.

**Five portal sites, all to `document.body`:** `PhotoViewer`, `MessageActionMenu`,
`ReportModal`, `EmojiPicker`, `PopoutItem` (×2). Everything else renders in place.

### 9.2 Stacking contexts — the authored numbers are not always the rendered order

1. **Mobile `shellRoot` has `contain: 'layout'`** (`AppShell.jsx:380`) → creates one
   stacking context; the numbers apply directly.
2. **Desktop `shellRoot` has no `z-index` and no `contain`** (`:414-421`), and `contentArea`
   also has none → no trapping; `chatBackdrop` (1000) still beats Header (500).
3. **`LearnMoreSheet` (z 200) is trapped** on the Profile tab inside
   `<div style={{position:'relative', zIndex:45}}>` (`Profile.jsx:1586-1588`). Its header
   row **can be overlapped by the floating Header**. On Discover it is *not* trapped
   (`Discover.jsx:687` has no z-index).
4. **`PopoutItem` and `ReportModal` escape** via portal. `ReportModal.jsx:252-254` states the
   reason verbatim: *"mandatory: mounted from ProfileCard (inside contentStage, zIndex 1), a
   fixed overlay would otherwise be trapped UNDER the floating deck chrome."*
5. **NotificationDrawer inherits Header's context** — rendered inside `Header`'s fragment
   (`Header.jsx:227-241`). Ties with the chat overlay at 1000; ties resolve by DOM order.

### 9.3 The document never scrolls

**Architectural rule, stated in the code:** `index.css:57-65` makes `body` itself
`position: fixed; inset: 0; overflow: hidden`. The comment at `index.css:17-51` reads
*"THE PAGE MUST NOT SCROLL. THE APP MUST."* Every screen owns its inner
`overflow-y: auto` container.

**Consequence for fixed positioning:** `body` is already the fixed element, so every
`position: fixed` overlay resolves against the body box, not the visual viewport. On iOS
this interacts badly with the keyboard — see 9.6.

### 9.4 Safe-area handling

`viewport-fit=cover` **is** set (`index.html:6`), which is what makes all
`env(safe-area-inset-*)` values non-zero. **30 sites** use them.

Canonical top inset: `DECK_TOP = 'max(12px, env(safe-area-inset-top, 0px))'`
(`deckChrome.js:11`) — consumed by Header, DeckActions, Roulette and Profile.

**Gaps:** `AppShell.jsx`, `DesktopSidebar.jsx`, `LearnMoreSheet.jsx`, `PopoutItem.jsx` and
Chat's root contain **no** safe-area insets. The sidebar uses a plain 16px `margin`
instead (`:30`).

### 9.5 Existing swipe / drag listeners — the complete list

| # | Gesture | Location | Triggers |
|---|---|---|---|
| 1 | **Vertical sheet drag** | `ProfileCard.jsx:889-984` | Moves the info panel. **Never an action.** |
| 2 | Wheel / trackpad | `ProfileCard.jsx:1017-1032` | Glides the sheet |
| 3 | ↑/↓ arrow keys | `ProfileCard.jsx:1034-1049` | Glides the sheet, 90px steps |
| 4 | **Long-press 280ms** | `PopoutItem.jsx:274-287` | Opens the zoom modal |
| 5 | Click tile (desktop) | `PopoutItem.jsx:343-347` | Same |
| 6 | Right-click tile | `PopoutItem.jsx:349-352` | Same |
| 7 | **Drag modal >80px** | `PopoutItem.jsx:434-436,514-517` | Closes the modal |
| 8 | **Long-press message 400ms** | `MessageBubble.jsx:24-34` | Opens the action menu |
| 9 | Double-tap image | `PhotoViewer.jsx:29-43` | Toggles 2.2× zoom |

**No left/right swipe anywhere.** No `touchstart`/`touchmove`/`touchend` on the Deck. The
only `drag` prop in the app is on `PopoutItem`.

### 9.6 Keyboard behaviour in chat — the weakest area

**There is none.**

- **No `visualViewport` listener.** Repo-wide, `window.visualViewport` appears only in
  `AuthFlow.jsx:326` — a dead file.
- No `resize`/`focus`/`blur` listener for the keyboard. No `keyboard-inset` CSS var.
- Chat's root is `position: fixed; inset: 0` and `overflow: hidden`. On iOS that **does not
  shrink for the software keyboard**.
- The composer is an `<input>`, and `styles.input` **does not exist** in the styles object
  (`Chat.jsx:1080-1132`) → React emits no `style` attribute → **UA default 13.33px font,
  default intrinsic width**.
- `<meta viewport>` sets `user-scalable=no, maximum-scale=1.0` (`index.html:6`), but on
  iOS a focus zoom below 16px is generally not suppressed by that. **[INFERRED — needs
  device testing] this is a high-probability iOS zoom-on-composer-focus defect.**

**Only keyboard handling in Chat is Enter-to-send** (`Chat.jsx:957`). There is no
`preventDefault` and no `shiftKey` check — but since it's an `<input>`, not a textarea,
Shift+Enter cannot produce a newline. Single-line, no auto-grow.

### 9.7 Does opening a panel unmount the underlying screen?

| Overlay | Unmounts the page beneath? |
|---|---|
| **Chat** | **NO** — sibling of the page stage (`AppShell.jsx:347` vs `:333`) |
| **Settings** | **NO** — sibling (`:362`) |
| **Letterbox** | **NO** — rendered inside `Header`, which is always mounted |
| **Tab switch** | **YES** — `AnimatePresence mode="wait"` (`AppShell.jsx:266`, `:326`) |

### 9.8 Does tab switching unmount Roulette?

**Yes.** `Roulette` is one `case` of the same `renderPage()` switch (`:235`), inside the same
`AnimatePresence mode="wait" key={activeTab}` (`:266`/`:326`). Its only state is
`const [starting, setStarting] = useState(false)` (`Roulette.jsx:35`).

### 9.9 Where would future video tracks/connections have to live?

**[INFERRED — design observation, not a proposal]**

Because a tab switch destroys the page subtree, and because a socket lives in
`AppShell`/`utils/socket.js` rather than in any page, a live call could not survive either
of these:

| Event | Effect on a page-local call |
|---|---|
| Tab switch | Component unmounted; local `RTCPeerConnection` dropped |
| Resize across 768px | Whole tree swapped (`AppShell.jsx:242` vs `:312`); page remounted |
| Opening chat **from the same tab** | **Survives** — chat is a sibling, page stays mounted |
| Server restart / deploy | Socket dies; `io.close()` runs first on shutdown (`index.js:534`) |

A call state holder would therefore need to live **above** the page switch — alongside
`activeChat` and `settingsOpen` in `AppShell` — or in a provider wrapping `renderPage()`,
not inside the page component. **This is an observation about the current architecture, not
a design recommendation.**

---

## 10. UNKNOWNS REQUIRING SCREENSHOTS OR RUNTIME TESTING

**Source-code inspection only.** I did not run the app. The following cannot be settled by
reading code:

### Screenshots I need (test data only, please)

| # | Screenshot | Why |
|---|---|---|
| 1 | Deck, collapsed | Confirm sheet resting position |
| 2 | Deck, sheet dragged up | Confirm photo scale/fade and header auto-hide |
| 3 | **Letterbox with 2+ pending requests** | Confirms the row layout and whether `9+`/`N pending` read correctly |
| 4 | Letters tab **with search text that matches nothing** | Confirms the missing empty state (§7 #30) |
| 5 | Chat, normal conversation | Confirms header spacing and composer rendering |
| 6 | **Chat composer focused on mobile** | ⚠ Confirms or refutes the iOS zoom defect (§9.6) |
| 7 | Chat → profile sheet open | Confirms the sheet height and the `'General'` branch text |
| 8 | Roulette tab | Baseline for the placeholder |
| 9 | Desktop equivalents of 1, 3, 5 | Confirms the centred chat card does not escape its bounds |
| 10 | Any view showing the mobile keyboard over Chat | Confirms whether the composer is obscured |

### Behaviour only a device/browser can settle

| Question | Why code can't answer it |
|---|---|
| **Does the desktop chat card contain Chat, or does Chat escape to fullscreen?** | Depends on whether framer-motion removes its transform after animating (§E, §7 #15) |
| **Does iOS zoom on composer focus?** | Needs a real iOS device (§9.6) |
| **Does the keyboard obscure the composer on iOS?** | `position: fixed` + no `visualViewport` handling (§9.6) |
| **Is the safe-area inset correct on a notched device?** | `viewport-fit=cover` is set; visual result needs a device |
| **Does the LearnMoreSheet overlap the header on Profile?** | Depends on runtime stacking (§9.2 #3) |
| **Does the header look correct at ≥768px?** | `Header.jsx` has zero responsive variation — needs eyes |
| **Does the palette mismatch (Deck is cream, status bar told dark) read as a bug?** | §7 #19 |
| **Is `DiscoverRebuildOverlay` (99999) blocking a toast?** | Needs a triggered deck rebuild |

### Blockers to running it yourself

1. **The QA harness cannot log in.** `readLatestOtp` reads `doc.otp` (`tests/qa/browser.mjs:31-33`)
   but the OTP model only stores `otpHash` (`models/OTP.js:14-17`). The field does not exist.
2. **Booting runs writes** — `syncIndexes()` (`db.js:41-56`) and `seedGatedColleges()`
   (`index.js:167-171`) against whatever `MONGODB_URI` points at, likely Atlas.
3. **The dump-freshness CI gate is already red** on `main` from uncommitted edits to
   `ProfileCard.jsx`, `Auth.jsx`, `Discover.jsx` — unrelated to this audit, but it means CI
   is not green.

---

## 11. HANDOFF — FOR ANOTHER AI DISCUSSING DESIGN

### Orientation (30 seconds)

No router. Five screens via `useState` (`App.jsx:18-30`), four tabs inside "home" via
`useState` (`AppShell.jsx:76`). Tab switching unmounts the page. Browser Back does nothing.
Read `AppShell.jsx:226-239` first — that switch explains almost everything about how this app
behaves.

### Things that will trip you up

1. **`react-router-dom` is installed and unused.** Don't plan around routes.
2. **Back button closes nothing.** If a design needs Back, it must be built from scratch.
3. **Tab switch is destructive.** Any persistent state must live above `renderPage()`.
4. **"Letters" ≠ "Letterbox."** Letters = conversations. Letterbox = pending requests.
5. **`NotificationDrawer` is not a drawer** — it's `fixed inset:0 z1000`, full-screen.
6. **There is no swipe gesture.** Deck actions are buttons (mobile/desktop) and keyboard
   shortcuts (desktop only). Splash copy at `Splash.jsx:1475` is false.
7. **`ProfileCard` has no action buttons.** Pass/Align live in `DeckActions.jsx` (mobile) or
   the desktop toolbar in `Discover.jsx:777-831`.
8. **The brand in the UI is "matchalize", not "huh?"** — `Header.jsx:184`, `DesktopSidebar.jsx:59`.
9. **Settings is Profile-tab only.** Bell is Deck-tab only.
10. **`Chat`'s root is `position: fixed; inset: 0`** (`Chat.jsx:1081`) with no size clamp —
    it cannot be embedded without a geometry change.
11. **Chat unmounts on close.** Draft, scroll, and pagination are lost. Messages survive in
    the React Query cache.
12. **No shared avatar/name component exists.** 22 inline render sites — see §6.H.

### For any hidden-profile / pseudonymous feature

The four places that leak identity regardless of UI work:

| Leak | Where |
|---|---|
| **Push notification titles** | `messages.js:238` uses `sender.name` as the lock-screen title |
| **Typing indicator** | `socket/chat.js:169` re-derives name from `socket.user`, discarding the client's value |
| **`profile-updated` broadcast** | `users.js:408-417` sends `toPublicCard(user)` — real name + photos — to **every** socket |
| **Server payload fields** | `name` and `photos` have **no** equivalent to `showCollege`'s strip (`publicCard.js:64-69`) |

Also remember: `alt` attributes carry names, the Letters **search filters on the real
name** (`Matches.jsx:144`), and `ChatProfileView` fabricates three intent chips when the
field is empty (`Chat.jsx:222`).

### State locations worth knowing

| State | Where | Survives tab switch? |
|---|---|---|
| `activeTab` | `AppShell.jsx:76` | n/a — it *is* the tab |
| `activeChat` | `AppShell.jsx:77` | **YES** — chat overlay persists across tabs |
| `settingsOpen` | `AppShell.jsx:101` | **YES** |
| Drawer open + bell count | `Header.jsx:111,114` | **YES** — Header is always mounted |
| Deck position | `Discover.jsx` local + `discoverStore.js` localStorage, 30-min TTL | Remount, but restored |
| Chat draft / scroll | `Chat.jsx:308-348` local | **NO** |
| Messages | React Query `['messages', alignmentId]`, 2-min staleTime | **YES** (cache) |
| Conversation list | React Query `['matches']`, 30s staleTime | **YES** (cache) |

### Files to read before proposing anything

| Purpose | File |
|---|---|
| Understand navigation | `client/src/components/AppShell.jsx` (472 lines) |
| Understand overlays & z-order | `AppShell.jsx:243-364` + `client/src/index.css:17-65` |
| Understand the Deck | `client/src/pages/Discover.jsx` (1444 lines) |
| Understand chat | `client/src/pages/Chat.jsx` (~1130 lines) |
| Understand requests | `client/src/components/NotificationDrawer.jsx` |
| Identity render sites | The 22-row table in §6.H |
| Confirm nothing here exists | `client/src/pages/Roulette.jsx` (125 lines) |

### Do not assume

Any of the 13 items in §6.I. That table exists specifically to prevent the most likely
wrong assumptions.

---

**Inspection complete. No code changed. No files other than this one created. No app
started, no data touched, no external service contacted.**
