#!/usr/bin/env bash
# SC-238: the fifth GPU queue, last: the mango pack's keyframes outpainted to 16:9 (gen-qwen7.sh), then, once one is
# picked (build/go-ltx5 written after a look, or after 25 minutes with the first), the distributor reading the pack's
# date (ltx-jobs5.json); after the retakes and the 3D scene's footage and capture (finish-gpu.sh).
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue[234]?.sh|[f]inish-gpu.sh" >/dev/null; do sleep 30; done
echo "== qwen7 $(date +%H:%M:%S)"; ./gen-qwen7.sh
for i in $(seq 1 50); do [ -f build/go-ltx5 ] && break; sleep 30; done
echo "== ltx5 $(date +%H:%M:%S)"; ~/.local/bin/uv run --python 3.12 --script gen-ltx.py ltx-jobs5.json
echo "== queue5 done $(date +%H:%M:%S)"
