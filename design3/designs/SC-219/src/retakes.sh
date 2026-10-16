#!/usr/bin/env bash
# SC-206: retakes, queued behind the first LTX run (one LTX job at a time). Names: gen-ltx.py's CLIPS keys.
cd "$(dirname "$0")"
while pgrep -f "gen-ltx.py f-priya" >/dev/null; do sleep 60; done
~/.local/bin/uv run --python 3.12 --script gen-ltx.py "$@" >> gen-ltx.log 2>&1
