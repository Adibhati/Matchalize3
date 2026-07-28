# Matchalize — AGENTS.md

## Commands

| Command | What it does |
|---------|-------------|
| `npm run install:all` | Install deps for both `client/` and `server/` |
| `npm run dev:client` | Vite dev server (`host: 0.0.0.0`, accessible on LAN) |
| `npm run dev:server` | Express via nodemon (port 5005) |
| `npm run build` | Vite build (client only) |
| `npm run start` | Build client then serve from Express (production-like) |
| `npm run lint` (in `client/`) | Oxlint |

Client `.env` uses `VITE_*` prefix. Server `.env` loaded automatically in `server/index.js` via `dotenv.config()`.

## Architecture

- **Monorepo** — `client/` (React 19.2 + Vite 8.1) and `server/` (Express 4.19 + Mongoose 8.4 + Socket.IO 4.7). Each has its own `package.json`.
- **Auth:** httpOnly cookie (`matchalize_jwt`), 7-day JWT, sliding expiration at 6 days, `ProtectedRoute` in App.jsx.
- **State:** No state library — `AuthContext` + `AppConfigContext` only. React Query for server state.
- **Sockets:** Created per-page (Discover, Matches, Chat) via shared `utils/socket.js`. Not a global context.
- **Styles:** Inline styles only — no CSS modules, Tailwind, or styled-components.
- **`server/type: "module"`** — all files use ESM (`import`/`export`).
- **No TypeScript** — plain `.js`/`.jsx`.
- **Vite proxies `/api/*` and `/uploads`** to `http://localhost:5005` in dev.
- **`server/index.js`** validates `JWT_SECRET` and `MONGODB_URI` on startup; exits if missing.

## Dev mode

`ALLOW_ALL_EMAILS=true` bypasses `.ac.in` restriction. When `SENDGRID_API_KEY` is unset, OTP codes log to console only (no email sent). Both conditions print warnings at startup.

## Actual vs previously documented state

The original PRD/HANDOFF described features that didn't exist yet. **All features listed in the updated PRD now exist in the codebase:**
- Splash, Auth, Onboarding, Discover, Matches, Chat, Profile — all implemented
- 7 chat subcomponents exist in `components/chat/`
- Server has 9 route files, 10 models, 4 middleware, Socket.IO handler
- `server/seedDummies.js` exists (not `seed.js`)

## Style

Mobile-first PWA, 430px max width, dark theme (`#000`), orange accent (`#f97316`), Geist Sans 700 (headings) + Inter 400-600 (body), Material Symbols Outlined + Lucide React icons.

## Key fixes applied

- Safari/WebKit flipbook crash (3-part fix)
- CORS hardened (Set-based whitelist)
- Suspended + deleted user checks in auth middleware
- Fast deck engine (indexed randomSeed instead of $sample)
- Accept actionTypes separated from sending (accept_letter/accept_seal)
- Account soft delete with 30-day safety retention
- Block creates bidirectional permanent archive Interactions
- Typing indicator cleanup on socket disconnect
- Read receipts (deliveryStatus 'read')
- Duplicate message key handling
- Profile photo URL validation
- 55+ total fixes — see HANDOFF.md for full list

## Known gaps

- No message editing (deletion only)
- No `delivered` delivery status (goes sent -> read directly)
- No admin dashboard
- No tests or CI/CD
- No rate limiting on message delete or block/unblock
