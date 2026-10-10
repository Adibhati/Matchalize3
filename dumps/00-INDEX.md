# Matchalize — Codebase Map

> Generated 2026-10-09 14:03. **This file is the one to paste first.**

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
| `01-design-system.md` | design-system | 72 | ~21,174 | 4 | Visual design language: tokens, theme components, fonts, borders/shadows. Read this before writing any UI. |
| `02-shared.md` | shared | 29 | ~8,352 | 6 | Shared contracts: ladder thresholds, age/distance computation, college domain matching. Server owns logic; client mirrors constants for fallbacks. |
| `03-config.md` | config | 30 | ~8,920 | 15 | Root and build configuration, CI, manifests. |
| `04-client-app.md` | client-app | 19 | ~5,587 | 3 | Client entry point, root router, global stylesheet. |
| `05-client-assets.md` | client-assets | 13 | ~3,778 | 2 | Bundled images and SVG assets. |
| `06-client-utils.md` | client-utils | 38 | ~11,177 | 14 | Shared client helpers: API layer, haptics, hooks, deck chrome. |
| `07-client-components.md` | client-components | 91 | ~26,502 | 12 | Shared React components. |
| `08-client-components.md` | client-components | 98 | ~28,610 | 9 | Shared React components. |
| `09-client-components.md` | client-components | 57 | ~16,667 | 6 | Shared React components. |
| `10-client-pages.md` | client-pages | 59 | ~17,394 | 1 | Screens / routes. |
| `11-client-pages.md` | client-pages | 53 | ~15,637 | 1 | Screens / routes. |
| `12-client-pages.md` | client-pages | 61 | ~17,729 | 1 | Screens / routes. |
| `13-client-pages.md` | client-pages | 76 | ~22,206 | 2 | Screens / routes. |
| `14-client-pages.md` | client-pages | 41 | ~12,117 | 1 | Screens / routes. |
| `15-client-pages.md` | client-pages | 94 | ~27,410 | 1 | Screens / routes. |
| `16-client-pages.md` | client-pages | 75 | ~22,030 | 3 | Screens / routes. |
| `17-server-core.md` | server-core | 98 | ~28,647 | 25 | Server entry point, config, middleware, models, socket, utils. |
| `18-server-core.md` | server-core | 95 | ~27,914 | 14 | Server entry point, config, middleware, models, socket, utils. |
| `19-server-core.md` | server-core | 18 | ~5,267 | 5 | Server entry point, config, middleware, models, socket, utils. |
| `20-server-routes.md` | server-routes | 67 | ~19,714 | 4 | Express route handlers (API surface). |
| `21-server-routes.md` | server-routes | 86 | ~25,017 | 1 | Express route handlers (API surface). |
| `22-server-routes.md` | server-routes | 94 | ~27,533 | 6 | Express route handlers (API surface). |
| `23-server-tests.md` | server-tests | 63 | ~18,564 | 9 | Server test suites. |
| `24-docs.md` | docs | 63 | ~18,429 | 4 | Project documentation and handoffs. |
| `25-tools.md` | tools | 42 | ~12,394 | 4 | Build and automation scripts, including this generator. |

## Task recipes

Paste the listed chunks. Start with the design-system chunk unless the
task is purely backend.

- **Rebuild or restyle a screen** — `01-design-system.md`, `10-client-pages.md`, `11-client-pages.md`, `12-client-pages.md`, `13-client-pages.md`, `14-client-pages.md`, `15-client-pages.md`, `16-client-pages.md`, `07-client-components.md`, `08-client-components.md`, `09-client-components.md`
- **Match the existing visual design** — `01-design-system.md`
- **Edit the header / navigation** — `01-design-system.md`, `07-client-components.md`, `08-client-components.md`, `09-client-components.md`
- **Photo upload / media handling** — `06-client-utils.md`, `20-server-routes.md`, `21-server-routes.md`, `22-server-routes.md`
- **Auth, OTP, or account flows** — `10-client-pages.md`, `11-client-pages.md`, `12-client-pages.md`, `13-client-pages.md`, `14-client-pages.md`, `15-client-pages.md`, `16-client-pages.md`, `20-server-routes.md`, `21-server-routes.md`, `22-server-routes.md`, `17-server-core.md`, `18-server-core.md`, `19-server-core.md`
- **Backend / API work** — `17-server-core.md`, `18-server-core.md`, `19-server-core.md`, `20-server-routes.md`, `21-server-routes.md`, `22-server-routes.md`
- **Debug a test failure** — `23-server-tests.md`
- **Understand client-server contracts** — `02-shared.md`, `01-design-system.md`

## Verification

- Files covered: 153 (each in exactly one chunk)
- Chunks: 25, largest 98 KB
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
