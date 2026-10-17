#!/usr/bin/env bash
# SC-238: the third GPU queue, after the second (gpu-queue2.sh): the distributor's mango-pack keyframe (gen-qwen5.sh), then
# its LTX clip (ltx-jobs3.json). One GPU job at a time.   nohup ./gpu-queue3.sh > gpu-queue3.log 2>&1 &
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue2?.sh" >/dev/null; do sleep 30; done
echo "== qwen5 $(date +%H:%M:%S)"; ./gen-qwen5.sh
echo "== ltx3 $(date +%H:%M:%S)"; ~/.local/bin/uv run --python 3.12 --script gen-ltx.py ltx-jobs3.json
echo "== queue3 done $(date +%H:%M:%S)"
