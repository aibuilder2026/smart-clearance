#!/usr/bin/env bash
# SC-238: the seventh GPU queue, after the first full-film critic: the lead's and the Nagpur distributor's keyframes
# (gen-qwen8.sh), then their clips, the distributor raising his tablet at the landfill, and the buyer's line again
# (ltx-jobs7.json). Yields to a render (build/hold-gpu).
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue[2-6]?.sh|[f]inish-gpu.sh" >/dev/null || [ -f build/hold-gpu ]; do sleep 30; done
echo "== qwen8 $(date +%H:%M:%S)"; ./gen-qwen8.sh
echo "== ltx7 $(date +%H:%M:%S)"; ~/.local/bin/uv run --python 3.12 --script gen-ltx.py ltx-jobs7.json
echo "== queue7 done $(date +%H:%M:%S)"
