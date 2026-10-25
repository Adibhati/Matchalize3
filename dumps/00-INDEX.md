# Matchalize — Codebase Map

> Generated 2026-10-18 20:29. **This file is the one to paste first.**

The codebase is ~1 MB of source, which no chat UI will accept in a single
paste -- it gets truncated silently, and the model cannot tell you what it
is missing. So it is split into chunks. Each is self-contained and within
the 100 KB / ~29,257 token paste target.

## How to use this

1. Paste this map.
2. Paste only the chunks your task needs (see recipes below).
3. If the model seems to be guessing about a file's contents, that file is
   probably not in the chunks you sent -- ask for the specific chunk.

## Chunks

| Chunk | Group | KB | ~Tokens | Files | Contents |
|---|---|---|---|---|---|
| `01-design-system.md` | design-system | 46 | ~13,328 | 2 | Visual design language: tokens, theme components, fonts, borders/shadows. Read this before writing any UI. |
| `02-design-system.md` | design-system | 67 | ~19,521 | 3 | Visual design language: tokens, theme components, fonts, borders/shadows. Read this before writing any UI. |
| `03-shared.md` | shared | 29 | ~8,463 | 6 | Shared contracts: ladder thresholds, age/distance computation, college domain matching. Server owns logic; client mirrors constants for fallbacks. |
| `04-config.md` | config | 32 | ~9,274 | 15 | Root and build configuration, CI, manifests. |
| `05-client-app.md` | client-app | 15 | ~4,439 | 3 | Client entry point, root router, global stylesheet. |
| `06-client-assets.md` | client-assets | 13 | ~3,778 | 2 | Bundled images and SVG assets. |
| `07-client-utils.md` | client-utils | 60 | ~17,430 | 16 | Shared client helpers: API layer, haptics, hooks, deck chrome. |
| `08-client-components.md` | client-components | 89 | ~25,953 | 11 | Shared React components. |
| `09-client-components.md` | client-components | 97 | ~28,288 | 11 | Shared React components. |
| `10-client-components.md` | client-components | 33 | ~9,514 | 3 | Shared React components. |
| `11-client-pages.md` | client-pages | 61 | ~17,724 | 1 | Screens / routes. |
| `12-client-pages.md` | client-pages | 76 | ~22,290 | 1 | Screens / routes. |
| `13-client-pages.md` | client-pages | 90 | ~26,461 | 2 | Screens / routes. |
| `14-client-pages.md` | client-pages | 54 | ~15,872 | 2 | Screens / routes. |
| `15-client-pages.md` | client-pages | 58 | ~17,018 | 1 | Screens / routes. |
| `16-client-pages.md` | client-pages | 96 | ~28,014 | 1 | Screens / routes. |
| `17-client-pages.md` | client-pages | 58 | ~17,066 | 2 | Screens / routes. |
| `18-server-core.md` | server-core | 98 | ~28,633 | 20 | Server entry point, config, middleware, models, socket, utils. |
| `19-server-core.md` | server-core | 99 | ~29,083 | 20 | Server entry point, config, middleware, models, socket, utils. |
| `20-server-core.md` | server-core | 99 | ~28,930 | 11 | Server entry point, config, middleware, models, socket, utils. |
| `21-server-core.md` | server-core | 25 | ~7,441 | 5 | Server entry point, config, middleware, models, socket, utils. |
| `22-server-routes.md` | server-routes | 72 | ~21,048 | 4 | Express route handlers (API surface). |
| `23-server-routes.md` | server-routes | 89 | ~26,122 | 1 | Express route handlers (API surface). |
| `24-server-routes.md` | server-routes | 85 | ~24,938 | 5 | Express route handlers (API surface). |
| `25-server-tests.md` | server-tests | 81 | ~23,736 | 15 | Server test suites. |
| `26-docs.md` | docs | 66 | ~19,434 | 2 | Project documentation and handoffs. |
| `27-docs.md` | docs | 39 | ~11,426 | 1 | Project documentation and handoffs. |
| `28-tools.md` | tools | 43 | ~12,589 | 4 | Build and automation scripts, including this generator. |

## Task recipes

Paste the listed chunks. Start with the design-system chunk unless the
task is purely backend.

- **Rebuild or restyle a screen** — `01-design-system.md`, `02-design-system.md`, `11-client-pages.md`, `12-client-pages.md`, `13-client-pages.md`, `14-client-pages.md`, `15-client-pages.md`, `16-client-pages.md`, `17-client-pages.md`, `08-client-components.md`, `09-client-components.md`, `10-client-components.md`
- **Match the existing visual design** — `01-design-system.md`, `02-design-system.md`
- **Edit the header / navigation** — `01-design-system.md`, `02-design-system.md`, `08-client-components.md`, `09-client-components.md`, `10-client-components.md`
- **Photo upload / media handling** — `07-client-utils.md`, `22-server-routes.md`, `23-server-routes.md`, `24-server-routes.md`
- **Auth, OTP, or account flows** — `11-client-pages.md`, `12-client-pages.md`, `13-client-pages.md`, `14-client-pages.md`, `15-client-pages.md`, `16-client-pages.md`, `17-client-pages.md`, `22-server-routes.md`, `23-server-routes.md`, `24-server-routes.md`, `18-server-core.md`, `19-server-core.md`, `20-server-core.md`, `21-server-core.md`
- **Backend / API work** — `18-server-core.md`, `19-server-core.md`, `20-server-core.md`, `21-server-core.md`, `22-server-routes.md`, `23-server-routes.md`, `24-server-routes.md`
- **Debug a test failure** — `25-server-tests.md`
- **Understand client-server contracts** — `03-shared.md`, `01-design-system.md`, `02-design-system.md`

## Verification

- Files covered: 170 (each in exactly one chunk)
- Chunks: 28, largest 99 KB
- Round-trip re-parse: PASSED
- Budget: 100 KB

## Layout

```
client/src/utils/      shared helpers, API layer, design tokens
client/src/components/  shared React components
client/src/pages/      screens
server/routes/         express API surface
server/tests/          server test suites
```
