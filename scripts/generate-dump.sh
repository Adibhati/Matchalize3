#!/usr/bin/env bash
# Regenerates matchalize_full_dump.md — a verbatim dump of all project
# source and configuration files, for handing the codebase to another AI.
set -euo pipefail

cd "$(dirname "$0")/.."
OUT="matchalize_full_dump.md"

emit_file() {
  local path="$1"
  [ -f "$path" ] || return 0
  {
    printf '### %s\n\n' "$path"
    printf '```\n'
    cat "$path"
    printf '\n```\n\n'
  } >> "$OUT"
}

emit_glob() {
  # emit every file matching the given find expression, sorted
  local dir="$1"; shift
  find "$dir" "$@" -type f 2>/dev/null | LC_ALL=C sort | while read -r f; do
    emit_file "./${f#./}"
  done
}

# ---- Header ----------------------------------------------------------------
{
  printf '# Matchalize — Full Codebase Dump\n\n'
  printf '> Verbatim contents of all project source and configuration files.\n'
  printf '> Generated %s. Organized into 4 sections: (1) Root & Project Config, (2) Client Source, (3) Server Source, (4) Docs & Meta.\n\n\n' "$(date)"
} > "$OUT"

# ---- Section 1 — Root & Project Config ------------------------------------
printf '## Section 1 — Root & Project Config\n\n\n' >> "$OUT"
for f in \
  ./package.json \
  ./.gitignore \
  ./.env.example \
  ./server/.gitignore \
  ./server/.npmrc \
  ./client/.gitignore \
  ./client/.oxlintrc.json \
  ./client/vite.config.js \
  ./client/index.html \
  ./client/public/manifest.json \
  ./client/public/sw.js ; do
  emit_file "$f"
done

# ---- Section 2 — Client Source --------------------------------------------
printf '## Section 2 — Client Source\n\n\n' >> "$OUT"
emit_file ./client/package.json
emit_file ./client/README.md
find ./client/src -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) \
  | LC_ALL=C sort | while read -r f; do emit_file "$f"; done

# ---- Section 3 — Server Source --------------------------------------------
printf '## Section 3 — Server Source\n\n\n' >> "$OUT"
emit_file ./server/package.json
find ./server -type f -name '*.js' -not -path '*/node_modules/*' \
  | LC_ALL=C sort | while read -r f; do emit_file "$f"; done

# ---- Section 4 — Docs & Meta ----------------------------------------------
printf '## Section 4 — Docs & Meta\n\n\n' >> "$OUT"
for f in ./AGENTS.md ./PRD.md ./HANDOFF.md ; do
  emit_file "$f"
done

echo "Wrote $OUT ($(wc -l < "$OUT") lines)"
