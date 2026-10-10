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