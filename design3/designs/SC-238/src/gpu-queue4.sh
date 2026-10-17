#!/usr/bin/env bash
# SC-238: the fourth GPU queue, after the others: the mango pack's keyframe again (gen-qwen6.sh: 16:9, one pair of
# glasses), then four talking-scene retakes (ltx-jobs4.json), lines LTX garbled or misspoke the first time (the
# kirana's, the lead's evening line), or said unclearly. One GPU job at a time.
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue[23]?.sh" >/dev/null; do sleep 30; done
echo "== qwen6 $(date +%H:%M:%S)"; ./gen-qwen6.sh
echo "== ltx4 $(date +%H:%M:%S)"; ~/.local/bin/uv run --python 3.12 --script gen-ltx.py ltx-jobs4.json
echo "== queue4 done $(date +%H:%M:%S)"
