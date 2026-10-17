#!/usr/bin/env bash
# SC-238: the sixth GPU queue, last: the evening call's two lines again (ltx-jobs6.json). Whisper heard "come" for
# "came" in both takes of the distributor's line, and "waste" for "wasted" in the lead's, so each line is rewritten to
# end on a word that cannot be misheard: "arrived on time", "went to waste".
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue[2345]?.sh|[f]inish-gpu.sh" >/dev/null; do sleep 30; done
echo "== ltx6 $(date +%H:%M:%S)"; ~/.local/bin/uv run --python 3.12 --script gen-ltx.py ltx-jobs6.json
echo "== queue6 done $(date +%H:%M:%S)"
