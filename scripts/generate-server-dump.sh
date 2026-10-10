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