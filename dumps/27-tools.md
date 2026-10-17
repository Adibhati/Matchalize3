# Chunk 27 — Tools

> Matchalize · `tools` · files 27 of 27 chunks · 4 file(s) · 43 KB · ~12,436 tokens
> Generated 2026-10-17 20:14.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./regenerate_dumps.py`
> - `./scripts/generate-dump.sh`
> - `./scripts/generate-icons.mjs`
> - `./scripts/generate-server-dump.sh`

---
### ./regenerate_dumps.py

```
#!/usr/bin/env python3
"""
Matchalize codebase dumper.

Emits paste-safe chunks under dumps/ instead of one multi-megabyte file.

WHY CHUNKED
-----------
A single ~1 MB paste is silently truncated by chat UIs long before any model's
context window is reached. The reader gets a plausible-looking prefix and
quietly misses the files that matter -- in practice the design-system files,
because alphabetical ordering buries them ~30% into the file. That failure mode
is worse than an obvious error: the model has no way to know it is missing half
the codebase, so it guesses and produces something that clashes with the real
design. Hence two hard rules below.

RULES ENFORCED
--------------
1. No chunk exceeds the byte budget (default 100 KB ~ 30k tokens). Files are
   never split mid-content; an oversize file gets its own chunk and is flagged.
2. Every discovered source file lands in exactly one chunk. Verified by
   re-parsing the written output and diffing each section against disk, then
   re-rendering and comparing bytes.

ORDER IS CURATED, NOT ALPHABETICAL
----------------------------------
The design-system files are emitted FIRST. They are the files that get lost,
and every other file is less useful without them.

OUTPUT
    dumps/00-INDEX.md      always safe to paste -- map, sizes, task recipes
    dumps/01-*.md ...      chunks, each within budget
    dumps/manifest.json    machine-readable inventory + verification result

    matchalize_full_dump.md   whole codebase in one file (NOT paste-safe)
    server_dump.md            server source only, one file (NOT paste-safe)

The two root monoliths are written on every run. They hold the same content as
dumps/ but without the paste budget, and they keep the historical filenames
working for anyone who referenced them. They are for local grep and for tools
without an attachment limit -- pasting them re-creates the truncation problem
described above. Share dumps/.

VERIFICATION
------------
Three independent checks run on every generate, and again under --check:
  1. Coverage: every discovered file appears in exactly one chunk.
  2. Content: each embedded section is diffed against the file on disk.
  3. Byte-exact: each output is re-rendered from its inputs and compared
     to what is on disk, so a stale header or trailing junk cannot pass.
--check also runs the monolith checks, so a stale monolith fails CI.

USAGE
    python3 regenerate_dumps.py                 # chunks + monoliths
    python3 regenerate_dumps.py --budget 60000  # tighter chunks
    python3 regenerate_dumps.py --check         # verify existing output only
    python3 regenerate_dumps.py --archive       # deprecated no-op
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DUMP_DIR = BASE_DIR / "dumps"

DEFAULT_BUDGET = 100 * 1024
# Code tokenizes closer to 3.5 chars/token than prose's ~4.
CHARS_PER_TOKEN = 3.5

# Directories never worth dumping.
SKIP_DIRS = {
    "node_modules", ".git", ".vite", "dist", "build",
    ".nyc_output", ".scratch", "uploads", "__pycache__",
}
# Paths (relative fragments) excluded from the walk.
SKIP_PATH_FRAGMENTS = ("tests/qa/videos", "tests/qa/media", "tests/qa/report")
SKIP_NAMES = {".DS_Store", "package-lock.json", ".env", ".env.local"}

# Text types worth inlining verbatim.
SOURCE_EXTS = {
    ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
    ".css", ".svg", ".json", ".jsonc",
    ".html", ".md", ".yml", ".yaml", ".sh", ".py", ".txt", ".env.example",
}

# Root + build config, emitted verbatim.
CONFIG_FILES = [
    "package.json",
    ".gitignore",
    ".env.example",
    ".github/workflows/ci.yml",
    "client/package.json",
    "client/.gitignore",
    "client/.oxlintrc.json",
    "client/vite.config.js",
    "client/index.html",
    "client/public/manifest.json",
    "client/public/sw.js",
    "client/public/favicon.svg",
    "client/public/icons.svg",
    "server/package.json",
    "server/.gitignore",
    "server/.npmrc",
]

# Docs + the tooling that produces this dump, so the dump is self-describing.
DOC_FILES = [
    "AGENTS.md", "PRD.md", "HANDOFF.md", "errors.md", "solved.md",
    "ambitions/roulette.md",
    "scripts/generate-dump.sh",
    "scripts/generate-server-dump.sh",
    "scripts/generate-icons.mjs",
    "regenerate_dumps.py",
]

# Emitted first: the visual design language. Loss of these is the exact failure
# this whole script exists to prevent.
DESIGN_SYSTEM_FILES = [
    "client/src/utils/theme.js",
    # neu.js IS the canonical token layer (its own header calls itself the
    # "single source of truth"), so it belongs in the chunk a designer is told
    # to read before writing any UI. It was previously unmatched entirely:
    # no GROUP_ORDER entry covered client/src/styles/, and the "never silently
    # drop a file" invariant caught it.
    "client/src/styles/neu.js",
    "client/src/components/ProfileCard.jsx",
    "client/src/components/Header.jsx",
    "client/src/pages/Splash.jsx",
]

# Shared contracts: constants & types mirrored between client/server.
# Server owns logic; client mirrors only fallback constants.
SHARED_FILES = [
    "client/src/utils/ladder.js",         # client reader (mirrors server LADDER, MAX_PHOTOS, MAX_PROMPTS, bandFor, canInteract)
    "server/utils/ladder.js",             # server source of truth: LADDER, computeScore, WEIGHTS, bandFor, canInteract
    "server/utils/age.js",                # age computation: computeAgeFromDob, withFreshAge (server owns)
    "server/utils/geo.js",                # distance bands: DISTANCE_BANDS, bandFor, haversineKm, LOCATION_TTL_DAYS, LOCATION_DRIFT_KM
    "server/utils/collegeDomain.js",      # domain matching: extractDomain, domainMatches, emailMatchesCollege, matchDomain, normaliseDomain
    "server/routes/config.js",            # emits LADDER to client via GET /config
]

# Ordered (name, matcher). First match wins; each file is consumed once.
GROUP_ORDER = [
    ("design-system", None),          # filled from DESIGN_SYSTEM_FILES
    ("shared", None),                 # filled from SHARED_FILES
    ("config", None),                 # filled from CONFIG_FILES
    ("client-app", lambda p: p.startswith("client/src/")
                    and p.count("/") == 2),
    ("client-assets", lambda p: p.startswith("client/src/assets/")),
    # Catch-all so a NEW file dropped in styles/ cannot silently fall through
    # every matcher and trip the "matched no group" abort. Files listed in
    # DESIGN_SYSTEM_FILES are consumed above; this catches the rest.
    ("client-assets", lambda p: p.startswith("client/src/styles/")),
    ("client-utils", lambda p: p.startswith("client/src/utils/")),
    ("client-components", lambda p: p.startswith("client/src/components/")),
    ("client-pages", lambda p: p.startswith("client/src/pages/")),
    ("server-core", lambda p: p.startswith("server/") and not (
        p.startswith("server/routes/") or p.startswith("server/tests/"))),
    ("server-routes", lambda p: p.startswith("server/routes/")),
    ("server-tests", lambda p: p.startswith("server/tests/")),
    ("docs", lambda p: p.endswith(".md")),
    ("tools", lambda p: p.startswith("scripts/") or p.endswith(".py")),
]

GROUP_BLURB = {
    "design-system": "Visual design language: tokens, theme components, fonts, "
                     "borders/shadows. Read this before writing any UI.",
    "shared": "Shared contracts: ladder thresholds, age/distance computation, college domain matching. Server owns logic; client mirrors constants for fallbacks.",
    "config": "Root and build configuration, CI, manifests.",
    "client-app": "Client entry point, root router, global stylesheet.",
    "client-assets": "Bundled images and SVG assets.",
    "client-utils": "Shared client helpers: API layer, haptics, hooks, deck chrome.",
    "client-components": "Shared React components.",
    "client-pages": "Screens / routes.",
    "server-core": "Server entry point, config, middleware, models, socket, utils.",
    "server-routes": "Express route handlers (API surface).",
    "server-tests": "Server test suites.",
    "docs": "Project documentation and handoffs.",
    "tools": "Build and automation scripts, including this generator.",
}

# Human recipes -> which groups you actually need to paste.
RECIPES = [
    ("Rebuild or restyle a screen",
     ["design-system", "client-pages", "client-components"]),
    ("Match the existing visual design",
     ["design-system"]),
    ("Edit the header / navigation",
     ["design-system", "client-components"]),
    ("Photo upload / media handling",
     ["client-utils", "server-routes"]),
    ("Auth, OTP, or account flows",
     ["client-pages", "server-routes", "server-core"]),
    ("Backend / API work",
     ["server-core", "server-routes"]),
    ("Debug a test failure",
     ["server-tests"]),
    ("Understand client-server contracts",
     ["shared", "design-system"]),
]

BINARY_MANIFEST_DIRS = ["client/public/icons"]


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------

def human(n: int) -> str:
    if n >= 1024 * 1024:
        return f"{n / 1024 / 1024:.1f} MB"
    if n >= 1024:
        return f"{n / 1024:.0f} KB"
    return f"{n} B"


def est_tokens(text_or_bytes: int) -> int:
    return int(text_or_bytes / CHARS_PER_TOKEN)


def read(rel: str) -> str:
    return (BASE_DIR / rel).read_text(encoding="utf-8", errors="replace")


def fence_for(text: str) -> str:
    """Fence longer than the longest backtick run at any line start, so files
    containing ``` (markdown, shell) cannot break out of their block."""
    longest = 0
    for line in text.split("\n"):
        m = re.match(r"^`+", line)
        if m:
            longest = max(longest, len(m.group(0)))
    return "`" * max(3, longest + 1)


# --------------------------------------------------------------------------
# discovery
# --------------------------------------------------------------------------

def walk(base: Path):
    if not base.is_dir():
        return
    for p in sorted(base.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(BASE_DIR).as_posix()
        if any(part in SKIP_DIRS for part in p.relative_to(base).parts[:-1]):
            continue
        if any(frag in rel for frag in SKIP_PATH_FRAGMENTS):
            continue
        if p.name in SKIP_NAMES:
            continue
        if p.suffix.lower() not in SOURCE_EXTS:
            continue
        yield rel


def discover() -> list[str]:
    found: list[str] = []
    for rel in CONFIG_FILES + DOC_FILES + DESIGN_SYSTEM_FILES:
        if (BASE_DIR / rel).is_file():
            found.append(rel)
    for base in ["client/src", "client/public", "server"]:
        found.extend(walk(BASE_DIR / base))
    # de-dupe, preserve first-seen order
    seen, out = set(), []
    for rel in found:
        if rel not in seen:
            seen.add(rel)
            out.append(rel)
    return sorted(out)


def assign_groups(files: list[str]) -> list[tuple[str, list[str]]]:
    pool = list(files)
    groups: list[tuple[str, list[str]]] = []

    for name, matcher in GROUP_ORDER:
        if name == "design-system":
            members = [f for f in pool if f in DESIGN_SYSTEM_FILES]
        elif name == "shared":
            members = [f for f in pool if f in SHARED_FILES]
        elif name == "config":
            members = [f for f in pool if f in CONFIG_FILES]
        else:
            members = [f for f in pool if matcher(f)]
        if members:
            chosen = set(members)
            pool = [f for f in pool if f not in chosen]
            groups.append((name, sorted(members)))

    if pool:
        # Never silently drop a file -- this is the invariant the whole
        # verification pass exists to protect.
        raise SystemExit(
            "ERROR: files matched no group (generator bug, would lose data):\n  "
            + "\n  ".join(pool)
        )
    return groups


def chunk_group(name: str, files: list[str], budget: int) -> list[list[str]]:
    """Roll files into chunks on file boundaries. Never splits a file."""
    sizes = {f: len(read(f).encode("utf-8")) for f in files}
    chunks: list[list[str]] = []
    current: list[str] = []
    used = 0
    for f in files:
        size = sizes[f]
        # +2000 allows for this file's own heading/fence/wrapper overhead.
        if current and used + size + 2000 > budget:
            chunks.append(current)
            current, used = [], 0
        current.append(f)
        used += size
    if current:
        chunks.append(current)
    return chunks


# --------------------------------------------------------------------------
# rendering
# --------------------------------------------------------------------------

def render_chunk(
    out: Path, title: str, group: str, files: list[str],
    idx: int, total: int, budget: int, stamp: str,
) -> dict:
    body_bytes = sum(len(read(f).encode("utf-8")) for f in files)
    oversize = [f for f in files if len(read(f).encode("utf-8")) > budget]

    out.write_text(render_chunk_text(title, group, files, idx, total, budget, stamp),
                   encoding="utf-8")

    return {
        "chunk": idx,
        "file": out.name,
        "group": group,
        "title": title,
        "files": files,
        "bytes": out.stat().st_size,
        "tokens": est_tokens(out.stat().st_size),
        "oversize": oversize,
    }


def render_chunk_text(title: str, group: str, files: list[str], idx: int,
                      total: int, budget: int, stamp: str) -> str:
    """Pure: same inputs always produce the same bytes. Verification re-runs
    this and compares, so it catches drift the section-level diff cannot see
    (a stale header, trailing junk, reordered files)."""
    parts: list[str] = []
    body_bytes = sum(len(read(f).encode("utf-8")) for f in files)
    oversize = [f for f in files if len(read(f).encode("utf-8")) > budget]

    header = [
        f"# Chunk {idx:02d} — {title}",
        "",
        f"> Matchalize · `{group}` · files {idx} of {total} chunks · "
        f"{len(files)} file(s) · {human(body_bytes)} · ~{est_tokens(body_bytes):,} tokens",
        f"> Generated {stamp}.",
    ]
    if oversize:
        header.append(
            "> WARNING: oversize file in this chunk "
            f"({', '.join(oversize)}). It could not be split; paste it on its own."
        )
    else:
        header.append(
            f"> Paste-safe: within the {human(budget)} / ~{est_tokens(budget):,} token target."
        )
    header.append(">")
    header.append("> Contains:")
    header.extend(f"> - `./{f}`" for f in files)
    header.append("")
    header.append("---")
    header.append("")
    parts.append("\n".join(header))
    for rel in files:
        text = read(rel)
        f = fence_for(text)
        parts.append(f"### ./{rel}\n\n{f}\n{text}\n{f}\n\n")
    return "".join(parts)


def render_monolith_text(title: str, sections, groups, stamp: str,
                         subtitle: str, with_binaries: bool = False) -> tuple[str, list[str]]:
    """Pure, like render_chunk_text. Returns (text, files-in-order)."""
    gmap = dict(groups)
    parts = [
        "\n".join([
            f"# {title}",
            "",
            "> Verbatim contents of all project source and configuration files.",
            f"> Generated {stamp}.",
            f"> {subtitle}",
            f"> {NETWORK_SCOPE}",
            "",
            "> **This file is not paste-safe.** At this size a chat UI truncates the",
            "> paste silently and the reader cannot tell what it lost. To share this",
            "> codebase, paste `dumps/00-INDEX.md` and only the chunks you need.",
            "",
            "",
        ])
    ]
    emitted: list[str] = []
    for name, gnames in sections:
        members = [f for g in gnames for f in gmap.get(g, [])]
        if not members:
            continue
        parts.append(f"## Section — {name}\n\n")
        for rel in members:
            text = read(rel)
            f = fence_for(text)
            parts.append(f"### ./{rel}\n\n{f}\n{text}\n{f}\n\n")
        emitted.extend(members)
    if with_binaries:
        parts.append("\n".join(binary_manifest_lines(stamp)))
    return "".join(parts), emitted


def write_index(out: Path, chunks: list[dict], budget: int, stamp: str,
                verified: bool, total_files: int) -> None:
    by_group: dict[str, list[str]] = {}
    for c in chunks:
        by_group.setdefault(c["group"], []).append(c["file"])

    L = [
        "# Matchalize — Codebase Map",
        "",
        f"> Generated {stamp}. **This file is the one to paste first.**",
        "",
        "The codebase is ~1 MB of source, which no chat UI will accept in a single",
        "paste -- it gets truncated silently, and the model cannot tell you what it",
        "is missing. So it is split into chunks. Each is self-contained and within",
        f"the {human(budget)} / ~{est_tokens(budget):,} token paste target.",
        "",
        "## How to use this",
        "",
        "1. Paste this map.",
        "2. Paste only the chunks your task needs (see recipes below).",
        "3. If the model seems to be guessing about a file's contents, that file is",
        "   probably not in the chunks you sent -- ask for the specific chunk.",
        "",
        "## Chunks",
        "",
        "| Chunk | Group | KB | ~Tokens | Files | Contents |",
        "|---|---|---|---|---|---|",
    ]
    for c in chunks:
        blurb = GROUP_BLURB.get(c["group"], "")
        L.append(
            f"| `{c['file']}` | {c['group']} | {c['bytes'] / 1024:.0f} | "
            f"~{c['tokens']:,} | {len(c['files'])} | {blurb} |"
        )

    L += [
        "",
        "## Task recipes",
        "",
        "Paste the listed chunks. Start with the design-system chunk unless the",
        "task is purely backend.",
        "",
    ]
    for label, groups in RECIPES:
        names: list[str] = []
        for g in groups:
            names.extend(by_group.get(g, []))
        if not names:
            continue
        L.append(f"- **{label}** — {', '.join(f'`{n}`' for n in names)}")

    L += [
        "",
        "## Verification",
        "",
        f"- Files covered: {total_files} (each in exactly one chunk)",
        f"- Chunks: {len(chunks)}, largest {human(max(c['bytes'] for c in chunks))}",
        f"- Round-trip re-parse: {'PASSED' if verified else 'FAILED'}",
        f"- Budget: {human(budget)}",
        "",
        "## Layout",
        "",
        "```",
        "client/src/utils/      shared helpers, API layer, design tokens",
        "client/src/components/  shared React components",
        "client/src/pages/      screens",
        "server/routes/         express API surface",
        "server/tests/          server test suites",
        "```",
        "",
    ]
    out.write_text("\n".join(L), encoding="utf-8")


def binary_manifest_lines(stamp: str) -> list[str]:
    L = [
        "## Section — Binary Assets",
        "",
        "> These files exist in the repo but are not inlined -- a binary in a",
        "> markdown code fence is unreadable garbage that just burns context.",
        "",
    ]
    for d in BINARY_MANIFEST_DIRS:
        base = BASE_DIR / d
        if not base.is_dir():
            continue
        rows = [p for p in sorted(base.rglob("*")) if p.is_file() and p.name != ".DS_Store"]
        if not rows:
            continue
        L += [f"### `{d}/`", "", "| File | Size |", "|---|---|"]
        for p in rows:
            L.append(f"| `{p.relative_to(BASE_DIR).as_posix()}` | {p.stat().st_size:,} bytes |")
        L.append("")
    return L


def write_binary_manifest(out: Path, stamp: str) -> None:
    out.write_text("\n".join(binary_manifest_lines(stamp)), encoding="utf-8")


# --------------------------------------------------------------------------
# single-file monoliths
# --------------------------------------------------------------------------

# Canonical network scope wording. ambitions/roulette.md references this
# sentence, so it must not drift.
NETWORK_SCOPE = (
    "Matchalize is an INTRA + INTER college network for all the colleges of "
    "India: users connect within their own campus (intra) AND across campuses "
    "(inter). Every user signs in via their own college academic email system "
    "(`.ac.in`), making each campus a private, verified community."
)

# group name -> which section it belongs to, in emission order.
# Client groups come before server so the design system leads, matching the
# chunk layout in dumps/.
MONOLITH_SECTIONS = [
    ("Root & Project Config", ["config"]),
    ("Shared Contracts", ["shared"]),
    ("Client Source", ["design-system", "client-app", "client-assets",
                       "client-utils", "client-components", "client-pages"]),
    ("Server Source", ["server-core", "server-routes", "server-tests"]),
    ("Docs & Meta", ["docs", "tools"]),
]

SERVER_SECTIONS = [("Server Source", ["server-core", "server-routes", "server-tests"])]

# Single source of truth for each monolith's identity. main() writes from this,
# verification re-renders from this -- so the two can never disagree.
MONOLITH_META = {
    "all": {
        "file": "matchalize_full_dump.md",
        "title": "Matchalize — Full Codebase Dump",
        "sections": MONOLITH_SECTIONS,
        "scope": "all",
        "with_binaries": True,
        "subtitle": (
            "Identical content to dumps/ -- kept as one file for grep and for "
            "tools without an attachment limit."
        ),
    },
    "server": {
        "file": "server_dump.md",
        "title": "Matchalize — Server Codebase Dump",
        "sections": SERVER_SECTIONS,
        "scope": "server",
        "with_binaries": False,
        "subtitle": (
            "Server source only. Excludes: .env, node_modules/, uploads/, "
            "dist/, build/, and package-lock.json."
        ),
    },
}


# --------------------------------------------------------------------------
# single-target bundles
# --------------------------------------------------------------------------

def resolve_target(needle: str, known: list[str]) -> str | None:
    """Accept a path, a basename, or a bare stem and pick the best match."""
    if needle in known:
        return needle
    cands = [r for r in known
             if Path(r).name == needle or Path(r).stem == needle
             or r.endswith("/" + needle)]
    if len(cands) == 1:
        return cands[0]
    if cands:  # ambiguous -- prefer a page, then the shortest path
        cands.sort(key=lambda r: (0 if "/pages/" in r else 1, len(r)))
        return cands[0]
    return None


def emit_sections(fh, files: list[str]) -> None:
    for rel in files:
        text = read(rel)
        f = fence_for(text)
        fh.write(f"### ./{rel}\n\n{f}\n{text}\n{f}\n\n")


def write_bundle(target: str, files: list[str], budget: int, stamp: str) -> Path:
    out = DUMP_DIR / f"bundle-{Path(target).stem}.md"
    total = sum(len(read(f).encode("utf-8")) for f in files)
    head = [
        f"# Bundle — {Path(target).stem}",
        "",
        f"> Generated {stamp}. **One file, one paste.**",
        f"> {human(total)} · ~{est_tokens(total):,} tokens · "
        f"{len(files)} file(s) · target {human(budget)}.",
        "",
        "You are working on:",
        f"**`./{target}`**",
        "",
        "Also included — the design system, because UI written without it clashes",
        "with the app's actual design language (tokens, fonts, borders, shadows):",
    ]
    head += [f"- `./{f}`" for f in files if f != target]
    head += ["", "---", ""]
    out.write_text("\n".join(head), encoding="utf-8")
    with out.open("a", encoding="utf-8") as fh:
        emit_sections(fh, files)
    return out


def verify_bundle(out: Path, files: list[str]) -> list[str]:
    raw = out.read_text(encoding="utf-8")
    errors = []
    heads = list(re.finditer(r"^### (\./\S+)$", raw, re.M))
    if [h.group(1)[2:] for h in heads] != files:
        return [f"{out.name}: heading/file mismatch"]
    for h in heads:
        rel = h.group(1)[2:]
        fm = re.match(r"\n\n(`{3,})\n", raw[h.end():])
        if not fm:
            errors.append(f"{rel}: no fence")
            continue
        f = fm.group(1)
        start = h.end() + fm.end()
        end = raw.find("\n" + f + "\n", start)
        if end == -1:
            errors.append(f"{rel}: unterminated fence")
        elif raw[start:end] != read(rel):
            errors.append(f"{rel}: content differs from disk")
    return errors


def cmd_locate(needle: str) -> int:
    known = discover()
    target = resolve_target(needle, known)
    if target is None:
        print(f"ERROR: no file matches {needle!r}. Try a path, basename, or stem.",
              file=sys.stderr)
        return 1
    mpath = DUMP_DIR / "manifest.json"
    if not mpath.is_file():
        print("ERROR: dumps/manifest.json missing — run: python3 regenerate_dumps.py",
              file=sys.stderr)
        return 1
    m = json.loads(mpath.read_text(encoding="utf-8"))
    hits = [c for c in m["chunks"] if target in c["files"]]
    print(f"{target}")
    if not hits:
        print("  (not in any chunk — binary or excluded)")
    for c in hits:
        print(f"  -> dumps/{c['file']}  ({human(c['bytes'])}, ~{c['tokens']:,} tokens)")
    ds = [c for c in m["chunks"] if c["group"] == "design-system"]
    if ds and target.startswith("client/src/") and not target.endswith(
            tuple(f for f in DESIGN_SYSTEM_FILES)):
        print("  plus the design system, if this is UI:")
        for c in ds:
            print(f"  -> dumps/{c['file']}  ({human(c['bytes'])}, ~{c['tokens']:,} tokens)")
    return 0


def cmd_for(needle: str, budget: int) -> int:
    known = discover()
    target = resolve_target(needle, known)
    if target is None:
        print(f"ERROR: no file matches {needle!r}. Try a path, basename, or stem.",
              file=sys.stderr)
        return 1
    design = [d for d in DESIGN_SYSTEM_FILES if (BASE_DIR / d).is_file()]
    files = [target] + [d for d in design if d != target]
    # Trim design files if the bundle would blow the budget; never drop the target.
    while files and sum(len(read(f).encode()) for f in files) > budget \
            and len(files) > 1:
        files.pop()
    DUMP_DIR.mkdir(parents=True, exist_ok=True)
    out = write_bundle(target, files, budget, datetime.now().strftime("%Y-%m-%d %H:%M"))
    errors = verify_bundle(out, files)
    size = out.stat().st_size
    if errors:
        print(f"FAILED verification ({len(errors)} problem(s)):", file=sys.stderr)
        for e in errors:
            print(f"  {e}", file=sys.stderr)
        return 1
    if size > budget:
        print(f"NOTE: bundle is {human(size)}, over the {human(budget)} target — "
              f"`{Path(target).name}` is large. Send it alone.")
    print(f"Wrote {out.relative_to(BASE_DIR)}")
    print(f"  {human(size)} · ~{est_tokens(size):,} tokens · {len(files)} file(s)")
    print(f"  Paste this one file. Nothing else needed.")
    return 0



# --------------------------------------------------------------------------
# verification
# --------------------------------------------------------------------------

def verify_sections_file(path: Path, expected: list[str], label: str) -> list[str]:
    """Re-parse a written dump and diff every embedded section against disk."""
    if not path.is_file():
        return [f"{label}: missing after write"]
    raw = path.read_text(encoding="utf-8")
    errors: list[str] = []

    heads = list(re.finditer(r"^### (\./\S+)$", raw, re.M))
    listed = [h.group(1)[2:] for h in heads]
    if listed != expected:
        only_disk = sorted(set(expected) - set(listed))[:5]
        only_dump = sorted(set(listed) - set(expected))[:5]
        errors.append(
            f"{label}: file list mismatch "
            f"(expected {len(expected)}, found {len(listed)})"
            + (f"; missing {only_disk}" if only_disk else "")
            + (f"; unexpected {only_dump}" if only_dump else "")
        )
        return errors

    for h in heads:
        rel = h.group(1)[2:]
        fm = re.match(r"\n\n(`{3,})\n", raw[h.end():])
        if not fm:
            errors.append(f"{rel}: no opening fence")
            continue
        f = fm.group(1)
        # fm.end() is relative to the slice, so offset it by h.end().
        body_start = h.end() + fm.end()
        end = raw.find("\n" + f + "\n", body_start)
        if end == -1:
            errors.append(f"{rel}: unterminated fence")
            continue
        # Writer emits `text` verbatim and `end` sits on the newline the writer
        # added before the closing fence, so this must match read() exactly,
        # including any trailing newline.
        if raw[body_start:end] != read(rel):
            errors.append(f"{rel}: content differs from disk")
    return errors


def verify(chunks: list[dict], stamp: str) -> list[str]:
    """Verify the chunked dumps/ layout: every file exactly once, in budget,
    and each chunk byte-identical to a fresh render of its own inputs."""
    errors: list[str] = []
    seen: dict[str, str] = {}
    total = chunks[-1]["chunk"] if chunks else 0

    for c in chunks:
        p = DUMP_DIR / c["file"]
        errors += verify_sections_file(p, c["files"], c["file"])
        if p.is_file():
            want = render_chunk_text(c["title"], c["group"], c["files"],
                                     c["chunk"], total, c["budget"], stamp)
            if p.read_text(encoding="utf-8") != want:
                errors.append(f"{c['file']}: does not match a fresh render "
                              "(stale header, trailing content, or reordering)")
        for rel in c["files"]:
            if rel in seen:
                errors.append(f"{rel}: duplicated in {seen[rel]} and {c['file']}")
                continue
            seen[rel] = c["file"]

    expected = set(discover())
    missing = expected - set(seen)
    extra = set(seen) - expected
    if missing:
        errors.append(f"{len(missing)} file(s) never emitted: {sorted(missing)[:5]}")
    if extra:
        errors.append(f"unexpected file(s) emitted: {sorted(extra)[:5]}")

    for c in chunks:
        if c["bytes"] > c["budget"] and not c["oversize"]:
            errors.append(f"{c['file']}: {human(c['bytes'])} exceeds budget")
    return errors


def verify_monoliths(monoliths: list[dict], groups, stamp: str) -> list[str]:
    """Verify the single-file dumps: correct file set, correct content, and
    byte-identical to a fresh render."""
    errors: list[str] = []
    for m in monoliths:
        dest = BASE_DIR / m["file"]
        errors += verify_sections_file(dest, m["files"], f"monolith {m['file']}")
        if not dest.is_file():
            continue
        sections = MONOLITH_SECTIONS if m["scope"] == "all" else SERVER_SECTIONS
        want, emitted = render_monolith_text(
            MONOLITH_META[m["scope"]]["title"], sections, groups, stamp,
            MONOLITH_META[m["scope"]]["subtitle"],
            with_binaries=(m["scope"] == "all"))
        if dest.read_text(encoding="utf-8") != want:
            errors.append(f"monolith {m['file']}: does not match a fresh render "
                          "(stale header, trailing content, or reordering)")

        # The full dump must cover the entire codebase; the server dump must
        # cover exactly the server and nothing else.
        embedded = set(m["files"])
        if m.get("scope") == "all":
            expected = set(discover())
            if embedded != expected:
                only_disk = sorted(expected - embedded)[:5]
                only_dump = sorted(embedded - expected)[:5]
                errors.append(
                    f"monolith {m['file']}: not a full dump "
                    f"(missing {only_disk}, unexpected {only_dump})"
                )
        elif m.get("scope") == "server":
            stray = sorted(f for f in embedded if not f.startswith("server/"))
            if stray:
                errors.append(f"monolith {m['file']}: non-server files leaked in: {stray[:5]}")
    return errors


def check_existing() -> int:
    mpath = DUMP_DIR / "manifest.json"
    if not mpath.is_file():
        print("ERROR: dumps/manifest.json not found -- run: python3 regenerate_dumps.py",
              file=sys.stderr)
        return 1
    m = json.loads(mpath.read_text(encoding="utf-8"))
    budget = m["budget"]
    chunks = [dict(c, budget=budget) for c in m["chunks"]]
    errors = verify(chunks, m["generated"])
    # Monolith order derives from the current group assignment, so rebuild it
    # rather than trusting the recorded file list.
    groups = assign_groups(discover())
    errors += verify_monoliths(m.get("monoliths", []), groups, m["generated"])
    if errors:
        print(f"FAIL -- {len(errors)} problem(s):", file=sys.stderr)
        for e in errors:
            print(f"  {e}", file=sys.stderr)
        return 1
    monoliths = m.get("monoliths", [])
    print(f"OK -- {len(chunks)} chunks, {sum(len(c['files']) for c in chunks)} files, "
          f"largest {human(max(c['bytes'] for c in chunks))}, all round-trip clean.")
    for mo in monoliths:
        print(f"    {mo['file']:<28} {len(mo['files']):>3} file(s) {human(mo['bytes']):>8}")
    return 0


# --------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--budget", type=int, default=DEFAULT_BUDGET,
                    help=f"max bytes per chunk (default {DEFAULT_BUDGET})")
    ap.add_argument("--archive", action="store_true",
                    help="(deprecated, no-op) monoliths are now always written")
    ap.add_argument("--check", action="store_true",
                    help="verify the existing dumps/ without regenerating")
    ap.add_argument("--locate", metavar="FILE",
                    help="print which chunk(s) contain FILE")
    ap.add_argument("--for", dest="target", metavar="FILE",
                    help="write a single minimal bundle for FILE (target + design system)")
    args = ap.parse_args()

    if args.archive:
        print("note: --archive is a no-op; the single-file monoliths "
              "(matchalize_full_dump.md, server_dump.md) are always written.",
              file=sys.stderr)

    if args.check:
        return check_existing()
    if args.locate:
        return cmd_locate(args.locate)
    if args.target:
        return cmd_for(args.target, args.budget)

    stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    files = discover()
    groups = assign_groups(files)

    # Plan every chunk first so numbering is contiguous.
    plan: list[tuple[str, str, list[str]]] = []
    for gname, gfiles in groups:
        for part in chunk_group(gname, gfiles, args.budget):
            plan.append((gname, gname.replace("-", " ").title(), part))

    # Old output is removed wholesale so deleted source files cannot linger.
    if DUMP_DIR.exists():
        for old in DUMP_DIR.iterdir():
            if old.is_file():
                old.unlink()
    DUMP_DIR.mkdir(parents=True, exist_ok=True)

    # Index + manifest get number 00, so the first real chunk is 01.
    chunks: list[dict] = []
    for i, (gname, title, cfiles) in enumerate(plan, start=1):
        fname = f"{i:02d}-{gname}.md"
        meta = render_chunk(DUMP_DIR / fname, title, gname, cfiles,
                            i, len(plan), args.budget, stamp)
        meta["budget"] = args.budget
        chunks.append(meta)

    errors = verify(chunks, stamp)
    write_index(DUMP_DIR / "00-INDEX.md", chunks, args.budget, stamp,
                not errors, len(files))
    write_binary_manifest(DUMP_DIR / f"{len(plan) + 1:02d}-binaries.md", stamp)

    # Single-file monoliths are written on EVERY run. Same content as dumps/,
    # just unsectioned by paste budget — kept for local grep, for tooling with
    # no attachment limit, and because the old filenames are referenced.
    monoliths = []
    for scope in ("all", "server"):
        meta = MONOLITH_META[scope]
        text, emitted = render_monolith_text(
            meta["title"], meta["sections"], groups, stamp, meta["subtitle"],
            with_binaries=meta["with_binaries"])
        dest = BASE_DIR / meta["file"]
        dest.write_text(text, encoding="utf-8")
        monoliths.append({
            "file": meta["file"],
            "scope": scope,
            "files": emitted,
            "bytes": dest.stat().st_size,
            "tokens": est_tokens(dest.stat().st_size),
        })

    # Verify monoliths BEFORE recording the manifest, so the manifest's
    # `verified` flag reflects all three surfaces rather than just the chunks.
    merrors = verify_monoliths(monoliths, groups, stamp)

    manifest = {
        "generated": stamp,
        "budget": args.budget,
        "chars_per_token": CHARS_PER_TOKEN,
        "file_count": len(files),
        "chunk_count": len(chunks),
        "total_bytes": sum(c["bytes"] for c in chunks),
        "max_chunk_bytes": max(c["bytes"] for c in chunks),
        "verified": not errors and not merrors,
        "errors": errors + merrors,
        "chunks": chunks,
        "monoliths": [
            {k: m[k] for k in ("file", "scope", "files", "bytes", "tokens")}
            for m in monoliths
        ],
    }
    (DUMP_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {len(chunks)} chunks + index + manifest to dumps/")
    print(f"  {len(files)} files, {human(manifest['total_bytes'])} total, "
          f"largest chunk {human(manifest['max_chunk_bytes'])} "
          f"(budget {human(args.budget)})")
    for c in chunks:
        flag = "  <- OVERSIZE" if c["oversize"] else ""
        print(f"    {c['file']:<34} {len(c['files']):>2} file(s) "
              f"{human(c['bytes']):>8}{flag}")
    print(f"Wrote {len(monoliths)} single-file monoliths (not paste-safe):")
    for m in monoliths:
        print(f"    {m['file']:<34} {len(m['files']):>3} file(s) {human(m['bytes']):>8}")
    if errors or merrors:
        n = len(errors) + len(merrors)
        print(f"\nFAILED verification ({n} problem(s)):", file=sys.stderr)
        for e in errors + merrors:
            print(f"  {e}", file=sys.stderr)
        return 1
    print("\nVerification passed: every file round-trips byte-identically "
          "across all three surfaces.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

### ./scripts/generate-dump.sh

```
#!/usr/bin/env bash
# Regenerates the Matchalize codebase dump.
#
# The pasteable output is CHUNKED into dumps/. A single ~1 MB paste gets
# silently truncated by chat UIs, and the reader has no way to tell what's
# missing -- so it loses the design-system files and then invents a UI that
# clashes with the real one.
#
# Two single-file monoliths are also written, for local grep and for tools
# without an attachment limit. Same content as dumps/, not paste-safe:
#   matchalize_full_dump.md   whole codebase
#   server_dump.md            server source only
#
# All logic lives in regenerate_dumps.py at the repo root; this wrapper exists
# so the old command still works.
#
#   dumps/00-INDEX.md   paste this first: map, sizes, task recipes
#   dumps/NN-*.md       chunks, each within the 100 KB paste target
#   dumps/manifest.json machine-readable inventory
#
# Usage:
#   bash scripts/generate-dump.sh                # default 100 KB chunks
#   bash scripts/generate-dump.sh --budget 60000 # tighter chunks
#   bash scripts/generate-dump.sh --check        # verify without regenerating
set -euo pipefail

cd "$(dirname "$0")/.."
exec python3 regenerate_dumps.py "$@"
```

### ./scripts/generate-icons.mjs

```
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BRAND = [249, 115, 22]; // #f97316
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const inHeart = (x, y) => {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
};

const buildPng = (size, mode) => {
  const raw = Buffer.alloc(size * (size * 4 + 1)); // 1 filter byte per row
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * 2.4 - 1.2;
      const ny = (y / size) * 2.4 - 1.2;
      const inside = inHeart(nx, ny * 0.9);
      const corner = Math.hypot(x - (size - 1) / 2, y - (size - 1) / 2) > (size / 2) * 0.92;
      const px = mode === 'icon' ? (inside ? WHITE : BRAND) : (inside ? BRAND : BLACK);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      if (corner && mode !== 'badge') {
        raw[o] = raw[o + 1] = raw[o + 2] = 0;
        raw[o + 3] = 0;
      } else {
        raw[o] = px[0];
        raw[o + 1] = px[1];
        raw[o + 2] = px[2];
        raw[o + 3] = 255;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

const iconsDir = join(process.cwd(), 'client', 'public', 'icons');
mkdirSync(iconsDir, { recursive: true });

const specs = [
  { name: 'icon-192.png', size: 192, mode: 'icon' },
  { name: 'icon-512.png', size: 512, mode: 'icon' },
  { name: 'badge-72.png', size: 72, mode: 'badge' },
];

for (const { name, size, mode } of specs) {
  writeFileSync(join(iconsDir, name), buildPng(size, mode));
  console.log(`✓ Generated ${name} (${size}x${size})`);
}
```

### ./scripts/generate-server-dump.sh

```
#!/usr/bin/env bash
# Regenerates the server portion of the Matchalize dump.
#
# server_dump.md is written on every run and holds all server source in one
# file. It is ~340 KB, which is past the point where a chat UI truncates a
# paste, so it is for local grep only -- for sharing, use the `NN-server-*.md`
# chunks listed below.
#
# This wrapper regenerates everything (chunks and monoliths are produced
# together by one script) and then lists which chunks hold server code.
set -euo pipefail

cd "$(dirname "$0")/.."

python3 regenerate_dumps.py "$@"

printf '\nServer chunks — paste these for backend work:\n'
for f in dumps/*-server-*.md; do
  printf '  %-32s %s\n' "$f" "$(du -h "$f" | cut -f1 | tr -d ' ')"
done
```

