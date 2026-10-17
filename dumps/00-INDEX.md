# Matchalize — Codebase Map

> Generated 2026-10-17 20:34. **This file is the one to paste first.**

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
| `04-config.md` | config | 31 | ~9,131 | 15 | Root and build configuration, CI, manifests. |
| `05-client-app.md` | client-app | 15 | ~4,439 | 3 | Client entry point, root router, global stylesheet. |
| `06-client-assets.md` | client-assets | 13 | ~3,778 | 2 | Bundled images and SVG assets. |
| `07-client-utils.md` | client-utils | 41 | ~11,955 | 15 | Shared client helpers: API layer, haptics, hooks, deck chrome. |
| `08-client-components.md` | client-components | 92 | ~26,955 | 12 | Shared React components. |
| `09-client-components.md` | client-components | 99 | ~29,092 | 12 | Shared React components. |
| `10-client-components.md` | client-components | 28 | ~8,077 | 2 | Shared React components. |
| `11-client-pages.md` | client-pages | 60 | ~17,603 | 1 | Screens / routes. |
| `12-client-pages.md` | client-pages | 70 | ~20,531 | 1 | Screens / routes. |
| `13-client-pages.md` | client-pages | 93 | ~27,316 | 2 | Screens / routes. |
| `14-client-pages.md` | client-pages | 54 | ~15,797 | 2 | Screens / routes. |
| `15-client-pages.md` | client-pages | 58 | ~17,018 | 1 | Screens / routes. |
| `16-client-pages.md` | client-pages | 96 | ~28,036 | 1 | Screens / routes. |
| `17-client-pages.md` | client-pages | 45 | ~13,230 | 2 | Screens / routes. |
| `18-server-core.md` | server-core | 93 | ~27,201 | 23 | Server entry point, config, middleware, models, socket, utils. |
| `19-server-core.md` | server-core | 90 | ~26,272 | 14 | Server entry point, config, middleware, models, socket, utils. |
| `20-server-core.md` | server-core | 65 | ~18,979 | 11 | Server entry point, config, middleware, models, socket, utils. |
| `21-server-routes.md` | server-routes | 70 | ~20,546 | 4 | Express route handlers (API surface). |
| `22-server-routes.md` | server-routes | 86 | ~25,017 | 1 | Express route handlers (API surface). |
| `23-server-routes.md` | server-routes | 84 | ~24,542 | 5 | Express route handlers (API surface). |
| `24-server-tests.md` | server-tests | 62 | ~18,256 | 9 | Server test suites. |
| `25-docs.md` | docs | 66 | ~19,434 | 2 | Project documentation and handoffs. |
| `26-docs.md` | docs | 40 | ~11,817 | 2 | Project documentation and handoffs. |
| `27-tools.md` | tools | 43 | ~12,585 | 4 | Build and automation scripts, including this generator. |

## Task recipes

Paste the listed chunks. Start with the design-system chunk unless the
task is purely backend.

- **Rebuild or restyle a screen** — `01-design-system.md`, `02-design-system.md`, `11-client-pages.md`, `12-client-pages.md`, `13-client-pages.md`, `14-client-pages.md`, `15-client-pages.md`, `16-client-pages.md`, `17-client-pages.md`, `08-client-components.md`, `09-client-components.md`, `10-client-components.md`
- **Match the existing visual design** — `01-design-system.md`, `02-design-system.md`
- **Edit the header / navigation** — `01-design-system.md`, `02-design-system.md`, `08-client-components.md`, `09-client-components.md`, `10-client-components.md`
- **Photo upload / media handling** — `07-client-utils.md`, `21-server-routes.md`, `22-server-routes.md`, `23-server-routes.md`
- **Auth, OTP, or account flows** — `11-client-pages.md`, `12-client-pages.md`, `13-client-pages.md`, `14-client-pages.md`, `15-client-pages.md`, `16-client-pages.md`, `17-client-pages.md`, `21-server-routes.md`, `22-server-routes.md`, `23-server-routes.md`, `18-server-core.md`, `19-server-core.md`, `20-server-core.md`
- **Backend / API work** — `18-server-core.md`, `19-server-core.md`, `20-server-core.md`, `21-server-routes.md`, `22-server-routes.md`, `23-server-routes.md`
- **Debug a test failure** — `24-server-tests.md`
- **Understand client-server contracts** — `03-shared.md`, `01-design-system.md`, `02-design-system.md`

## Verification

- Files covered: 157 (each in exactly one chunk)
- Chunks: 27, largest 99 KB
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
