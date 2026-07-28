#!/usr/bin/env bash
# Regenerates server_dump.md — a verbatim dump of all server source files,
# for handing the backend codebase to another AI.
# Excludes: .env, node_modules/, uploads/, dist/, build/, package-lock.json.
set -euo pipefail

cd "$(dirname "$0")/.."
OUT="server_dump.md"

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

# ---- Header ----------------------------------------------------------------
{
  printf '# Matchalize — Server Codebase Dump\n\n'
  printf '> Verbatim contents of all server source and configuration files.\n'
  printf '> Generated %s.\n' "$(date)"
  printf '> Excludes: .env, node_modules/, uploads/, dist/, build/, and package-lock.json.\n\n\n'
} > "$OUT"

# ---- Server Source ---------------------------------------------------------
printf '## Server Source\n\n\n' >> "$OUT"
emit_file ./server/package.json
find ./server -type f -name '*.js' -not -path '*/node_modules/*' \
  | LC_ALL=C sort | while read -r f; do
    emit_file "./${f#./}"
  done

echo "Wrote $OUT ($(wc -l < "$OUT") lines)"
