Here it is — the complete consolidated issue list, numbered so we can knock them off one by one and reference them by ID. 📋

# MASTER ISSUE LIST — Matchalize Design Reconciliation

## A. Brand & Identity (what users see *before* the app)

1. **App icon is an orange heart** — `scripts/generate-icons.mjs` still hardcodes `BRAND = #f97316` (the old identity). Belongs to neither palette.
2. **Favicon is a purple lightning bolt** — untouched Vite template leftover (`favicon.svg`).
3. **`HANDOFF.md` style block is stale** — still says *"dark theme (#000), orange accent (#f97316), Geist Sans 700"* — describes a third identity that no longer exists.
4. **`manifest.json` + `index.html` theme-color = `#fdfbf7`** — archival-era warm white, matches nothing current.
5. **Broken launch sequence** — orange icon → purple favicon → warm-white flash → dark `#131313` desk → cream app. Four first impressions, zero consistent.
6. **`lover.mp4` copyright risk** — splash background video of unknown provenance sitting in `public/` (DMCA liability + heavy asset). Needs owned/generated motion.
7. **Template leftovers in `client/src/assets/`** — `react.svg`, `vite.svg`.
8. **Template leftovers in `public/icons.svg`** — Bluesky/Discord/GitHub symbols from some template, used by nothing.
9. **Tagline casing split** — `"Your Campus. Your Story."` (config/HANDOFF) vs `"Your campus. Your story."` (Auth). Pick one, everywhere.
10. **`"Enter the Realm"` CTA** — fantasy/archival voice, totally off-candy. (Final audit pending Splash.jsx.)
11. **Unexploited brand hook** — does "Matchalize" mean matcha 🍵? The orange heart must die regardless; matcha-green+cream is a candidate identity. *Decision needed.*

## B. The Two-Language Split (the core problem)

12. **Two full design languages coexist** — candy-box neubrutalism (new) vs "Sunlit Library" archival (old), each with its own palette, borders, shadows, type, and theming model.
13. **`Chat.jsx` is the biggest offender** — entire page archival: torn paper edges, washi tape, index cards, Playfair Display, CSS-var theming. And it's the *deepest* screen in the product.
14. **Ghost comment in Chat.jsx** — claims *"100% Visual Parity with Discovery ProfileCard"*. False; a leftover from the unfinished migration.
15. **`MessageBubble.jsx` archival** — washi tape, Special Elite body text, crimson spine, `--tape-90`.
16. **`CassettePlayer.jsx` archival** — gold borders, crimson play button, cassette metaphors.
17. **`PhotoViewer.jsx` archival** — paper corner mounts, "Archival Specimen" caption, grain overlay.
18. **`MessageActionMenu.jsx` archival** — grain texture, warm blurred shadows, CSS-var tokens.
19. **`ReplyPreview.jsx` archival** — grain, accent spine, old vars.
20. **`SearchOverlay.jsx` archival** — gold archival highlighter, old vars.
21. **`DesktopSidebar.jsx` archival** — Playfair 900 wordmark, grain overlay, 1px hairlines.
22. ~~**`Waitlist.jsx` archival**~~ — **RESOLVED, not audited.** The waitlist was removed outright for the IIT Bombay pilot (route, API, and model), so there is no archival question left to decide.
23. **`index.css` is the archival engine** — the entire `:root` token system + 4 dark themes exists to power the legacy stack. The root decision: replace, gut, or repurpose.
24. **`EmojiPicker.jsx` + remaining chat subcomponents** — need audit; almost certainly archival.

## C. Drift *Inside* Candy-Box (candy vs candy)

25. **Onboarding is its own dialect** — bg `#F4EFE3` (the old `--bg`!), **2.5px** borders (canon: 2px), a dot-grid floor nobody else has, `yellowDeep #FFC91F` (vs PopoutItem's `#E5B824`), `orange #FF6B4A` (vs coral `#FF7A59`).
26. **Pre-login sandwich** — Auth = dark desk `#131313`, Onboarding = light cream. Splash → Auth → Onboarding currently strobes.
27. **Three wordmark treatments** — Caveat handwritten (Header/Auth), Archivo Black uppercase (NotificationDrawer/Settings), Playfair 900 (Sidebar). One must win.
28. **~12 duplicated token blocks** — every component re-declares its own `T`/`C`/`t`/`F` constant object. No single source of truth; drift is already visible (see #25).
29. **`theme.js`'s role is unresolved** — components mix `theme as design` var() reads with hardcoded hex. (Need the file — it never arrived.)
30. **`Settings.jsx` legal sheet font bug** — `LegalSheet` uses `F.head`, which doesn't exist in `F` → legal sheets render in inherited font.
31. **Global press physics conflict** — `index.css` `button:active { scale(0.98) }` fights the candy slam-translate on any plain `<button>` the candy CSS doesn't own.
32. **Typewriter font leaks globally** — `index.css` sets `font-family: var(--font-typewriter)` on `body/p/span/div`; any candy text that doesn't explicitly set a font inherits typewriter.
33. **Dark mode toggle makes things *worse*** — it flips the archival surfaces dark while candy surfaces ignore it. Toggle = more inconsistency. *Decision needed: (a) design a proper candy dark palette, or (b) retire the toggle, light-only.*
34. **Misleading names** — `ArchivalToast` / `ArchivalFallback` are fully candy but named "archival." Rename to kill the confusion for every future reader (and every future AI 😅).

## D. Splash & Entry Flow

35. **`Splash.jsx` never received** — truncated twice from chunk 01. Full audit blocked. (Your own tooling has the fix: `python3 regenerate_dumps.py --for Splash.jsx`.)
36. **Entry-flow transition design** — Splash → Auth → Onboarding needs one coherent plan (what's dark, what's cream, what carries over).

## E. Voice & Copy

37. **Orphaned archival voice** — the terminology ledger (roulette.md) is canonical, but dead surfaces still speak old: `"This artifact was removed."` (MessageBubble), `"Archival Specimen"` (PhotoViewer), `"Opening chat..."`, etc. Sweep after B is done.
38. **Splash copy pass** — tagline, CTA, panel copy rewritten in candy voice (after #35).

## F. Tooling & Dead Weight

39. **QA harness is stale/red** — `scenes.mjs` drives the *deleted* onboarding ("The Dossier," "Whispers," "Publish Profile & Enter") and old splash swipes. Must be updated alongside each screen we redesign.
40. **Unused/heavy deps to audit** — `react-pageflip` (pageflip was removed in the Safari fix), `gsap`, Material Symbols font (interest icons are lucide tiles now), `react-router-dom` (installed, never imported — app has no router).
41. **Font diet** — index.html loads ~7 families (Dancing Script, Playfair, Special Elite, Inter, Archivo Black, Space Mono + Caveat imported per-component). After migration, trim to the canonical set = real perf win.

---

## Resolution order (proposal)

| Phase | Fixes | What happens |
|---|---|---|
| **0 — Decisions** | #11, #33 | You answer: matcha brand? dark mode or light-only? + send Splash bundle (#35) |
| **1 — The Spec** | #12, #27, #28, #29, #34 | Write the single design-language constitution: one tokens module, component recipes, motion grammar, voice rules |
| **2 — Identity & Splash** | #1–11, #36, #38 | New icon/favicon/manifest, splash rebuild, entry-flow coherence |
| **3 — The Sweep** | #13–24, #25–26, #30–32, #37 | Chat stack first → Sidebar → ~~Waitlist~~ (deleted) → index.css reckoning → Onboarding harmonize → bug fixes |
| **4 — Hygiene** | #39–41 | QA refresh, dep/font trim |

**Your move:** answer #11 (matcha?) and #33 (dark mode: design it or kill it?), and run the bundle command for Splash. Then Phase 1 begins. 🚀