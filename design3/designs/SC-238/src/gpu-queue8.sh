#!/usr/bin/env bash
# SC-238: the eighth GPU queue: the distributor's landfill line again (ltx-jobs8.json); the first take turned him to the
# lens, and nobody in this film speaks to the camera. Yields to a render (build/hold-gpu).
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue[2-7]?.sh|[f]inish-gpu.sh" >/dev/null || [ -f build/hold-gpu ]; do sleep 30; done
echo "== ltx8 $(date +%H:%M:%S)"; ~/.local/bin/uv run --python 3.12 --script gen-ltx.py ltx-jobs8.json
echo "== queue8 done $(date +%H:%M:%S)"
