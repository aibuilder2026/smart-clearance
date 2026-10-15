#!/usr/bin/env bash
# SC-211: after the talking clips (run11c.sh), one GPU job at a time: more takes of the narration line Whisper read back
# short (j1), then the LTX retakes of any talking clip whose speech came back garbled (ltx-retake.json).
set -u
cd "$(dirname "$0")"
while pgrep -f "[r]un11c.sh" >/dev/null || pgrep -f "[g]en-ltx11" >/dev/null; do sleep 20; done
echo "== maya1 retakes $(date +%H:%M:%S)"
(cd tts && ../../../SC-209/src/tts/.venv-snac/bin/python vo5.py 7 j1) >> vo11.log 2>&1
echo "== ltx retakes $(date +%H:%M:%S)"
~/.local/bin/uv run --python 3.12 --script gen-ltx11.py ltx-retake.json > gen-ltx11-retake.log 2>&1
echo "== run11e done $(date +%H:%M:%S)"
