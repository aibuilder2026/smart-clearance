#!/usr/bin/env bash
# SC-211: the queue's rest, one GPU job at a time: wait for the narrator's first pass (vo5.py), voice the lines added
# since (three takes each), then the talking scenes (LTX).
#   nohup ./run11c.sh > run11c.log 2>&1 &
set -u
cd "$(dirname "$0")"
while pgrep -f "[v]o5.py" >/dev/null; do sleep 15; done
echo "== maya1 extra $(date +%H:%M:%S)"
(cd tts && ../../../SC-209/src/tts/.venv-snac/bin/python vo5.py 3 m6) >> vo11.log 2>&1
echo "== ltx $(date +%H:%M:%S)"
~/.local/bin/uv run --python 3.12 --script gen-ltx11.py ltx-talk.json > gen-ltx11.log 2>&1
echo "== run11 done $(date +%H:%M:%S)"
