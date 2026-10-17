#!/usr/bin/env bash
# SC-238: the second GPU queue, after the first (gpu-queue.sh) has finished: the dark store's keyframe (gen-qwen4.sh),
# then its LTX clip (ltx-jobs2.json). One GPU job at a time.   nohup ./gpu-queue2.sh > gpu-queue2.log 2>&1 &
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue.sh" >/dev/null; do sleep 30; done
echo "== qwen4 $(date +%H:%M:%S)"; ./gen-qwen4.sh
echo "== ltx2 $(date +%H:%M:%S)"; ~/.local/bin/uv run --python 3.12 --script gen-ltx.py ltx-jobs2.json
echo "== queue2 done $(date +%H:%M:%S)"
