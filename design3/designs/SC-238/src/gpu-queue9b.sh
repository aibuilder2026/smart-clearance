#!/usr/bin/env bash
# SC-238: after the ninth queue, the batch's insert: its keyframe (Qwen, pass 9c), then its clip (LTX). Yields to a render.
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue9.sh|[g]en-ltx.py" >/dev/null || [ -f build/hold-gpu ]; do sleep 30; done
echo "== qwen9c $(date +%H:%M:%S)"; ./gen-qwen9c.sh
echo "== ltx9c $(date +%H:%M:%S)"; ~/.local/bin/uv run --python 3.12 --script gen-ltx.py ltx-jobs9c.json
echo "== queue9b done $(date +%H:%M:%S)"
