#!/usr/bin/env bash
# SC-211: after the talking clips (run11c.sh's LTX), more takes of the lines Whisper read back short (j1: "batch" heard
# as "badge" in all three), one GPU job at a time.
set -u
cd "$(dirname "$0")"
while pgrep -f "[r]un11c.sh" >/dev/null || pgrep -f "[g]en-ltx11" >/dev/null; do sleep 20; done
echo "== maya1 retakes $(date +%H:%M:%S)"
(cd tts && ../../../SC-209/src/tts/.venv-snac/bin/python vo5.py 7 j1) >> vo11.log 2>&1
echo "== run11d done $(date +%H:%M:%S)"
