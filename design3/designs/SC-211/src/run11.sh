#!/usr/bin/env bash
# SC-211: one GPU job at a time. The keyframes (gen-qwen11.sh, then gen-qwen11b.sh), then the narrator (Maya1, three
# takes a line), then the talking scenes (LTX). Each waits for the one before.
#   nohup ./run11.sh > run11.log 2>&1 &
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]en-qwen11.sh" >/dev/null; do sleep 15; done
echo "== qwen11b $(date +%H:%M:%S)"
./gen-qwen11b.sh >> gen-qwen11.log 2>&1
echo "== maya1 $(date +%H:%M:%S)"
(cd tts && ../../../SC-209/src/tts/.venv-snac/bin/python vo5.py 3 $(cat ../narr-ids.txt)) > vo11.log 2>&1
echo "== ltx $(date +%H:%M:%S)"
~/.local/bin/uv run --python 3.12 --script gen-ltx11.py ltx-talk.json > gen-ltx11.log 2>&1
echo "== run11 done $(date +%H:%M:%S)"
