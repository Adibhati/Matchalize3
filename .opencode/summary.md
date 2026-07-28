## Objective
- Finish the Matchalize campus dating PWA (React client + Express/Mongoose/Socket.IO server) via screen-by-screen audit: rebuild Discover with custom 3D book-flip physics, add marginalia/superlikes, Ghost Mode, and a Profile editor. No git commits yet.

## Important Details
- Repo `/Users/adibhati/Documents/vybe`; client Vite (port 5173) + server Express/Mongoose/Socket.IO (port 5005).
- Theme: parchment/vintage `#f4f1ea`; brand "Matchalize". Header/NavBar/PopoutItem/ProfileCard/Discover/Onboarding/Splash use elaborate "MUSEUM-GRADE ARCHIVAL" theme with `GRAIN_SVG` paper textures + shared `theme` constants.
- `react-pageflip` dropped; Discover uses Framer Motion + custom touch/physics engine.
- User supplies exact snippets, applied verbatim, then verified via `npm run build` + `oxlint`.
- `framer-motion` v12; `createPortal` from react-dom used in PopoutItem.
- `.env`: SENDGRID, VAPID, CLOUDINARY set; ALLOW_ALL_EMAILS=false (.ac.in only); MongoDB Atlas.
- API helper: `client/src/utils/api.js` (`api.get/post/put/delete/upload`); `GET /config` has no auth requirement.

## Work State
### Completed
- Splash/Auth/Onboarding/Config/Marginalia/Superlikes/Moderation audit: auth limiter, Setting/Analytics models, upload `aws_rek` moderation, Match.marginalia subdoc, User.lastSuperlikeAt, discover 1-superlike/24h limit + marginalia save — all built & tested.
- `PopoutItem.jsx` (new, iterated to archival): 300ms long-press → haptic + portal menu positioned via getBoundingClientRect; compatibility alchemy overlay; 🌸 floating flower on like; `actionSent` guard disables buttons; `onContextMenu` blocks Android menu; touch handlers do NOT call preventDefault (Android scroll preserved).
- `ProfileCard.jsx` (rewritten to archival Character Sheet / Bento): Hero (4/5), Vitals, Compatibility Scan, Seeking, Interests, 2-col CSS Bento grid, `paddingBottom: 100px` to clear nav; all media wrapped in `PopoutItem`.
- `Discover.jsx` (refactored physics engine): `panX` raw motion value → `rotateY` via `useTransform(panX,[0,-260],[0,-115])`; `activeScrollRef`; `triggerHaptic` on flip; ONLY `pass` flips page (like/superlike hit API, no flip); scroll-gate at `scrollTop===0`.
- `Profile.jsx` (new, wired): My Story/Settings tabs; editable hero+bento photos via hidden file input + `api.upload`; inline bio save on blur; Ghost Mode sun/moon switch (`isGhostMode` from `data.isGhost`, `handleGhostModeToggle` PUTs `{isGhost}`, reverts on fail); `DELETE /users/account` on close.
- `index.css`: appended Ghost Mode `.switch`/`.slider`/`.sun`/`.moon` + `rotate`/`tilt` keyframes.
- `AppShell.jsx`: imports `Profile`; `profile` tab renders `<Profile onSignOut={onSignOut} />` (replaced Coming soon stub).
- Ghost Mode backend: `User.js` `isGhost:Boolean default:false`; `users.js` `PUT /profile` destructures + applies `isGhost`; `discover.js` GET filter `isGhost:false` (plus sorts by `lastActive:-1`).
- Header/NavBar: completely redesigned to archival theme (supersedes earlier simple 48→52.8px / 8→6.5px padding edits).
- `Splash.jsx`: now fetches `GET /config` on mount and uses dynamic `splash.videoUrl` / `splash.tagline`, with fallbacks to `/lover.mp4` and "Your Campus. Your Story." (previously hardcoded).
- All changes build (`npm run build` passes); oxlint 0 errors.

### Active
- (none)

### Blocked
- (none)

## Next Move
1. (none urgent) — Discover `panX` engine + PopoutItem portal menus + Splash config wiring are in; verify on-device flip/scroll and long-press menu positioning.
2. OPTIONAL/CAUTION: discover `GET` could add a 14-day `lastActive` cutoff (`lastActive: { $gte: fourteenDaysAgo }`), but this risks emptying the deck in an early-stage app (new users may never update `lastActive`). Currently only `isGhost:false` + `lastActive:-1` sort are applied — left as-is intentionally.

## Relevant Files
- `client/src/components/PopoutItem.jsx`: long-press pop-out menu + flower anim.
- `client/src/components/ProfileCard.jsx`: archival bento Character Sheet.
- `client/src/pages/Discover.jsx`: panX-based flip physics.
- `client/src/pages/Profile.jsx`: profile editor + Ghost Mode toggle.
- `client/src/pages/Splash.jsx`: now consumes dynamic splash config.
- `client/src/components/AppShell.jsx`: routes Profile tab.
- `client/src/index.css`: Ghost Mode switch CSS.
- `client/src/components/Header.jsx`, `client/src/components/NavBar.jsx`: archival redesign.
- `server/models/User.js`: `isGhost` + `lastActive` fields.
- `server/routes/users.js`: `PUT /profile` isGhost.
- `server/routes/discover.js`: `isGhost:false` filter + lastActive sort.
- `server/routes/config.js`, `server/models/Setting.js`, `server/models/Analytics.js`, `server/routes/auth.js`, `server/routes/upload.js`, `server/models/Match.js`: prior audit work.
