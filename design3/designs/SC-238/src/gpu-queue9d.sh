#!/usr/bin/env bash
# SC-238: after the 3D capture, the over-the-shoulder shots whose relabelled cartons glowed, made again with the glow taken
# out (screens.py's dehalo): the verify shot, the buyer's lot, the food bank's pickup, the staff sale. Yields to a render.
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue9[bc]?.sh|[g]en-ltx.py|[q]wen_image_bf16_mac" >/dev/null || [ -f build/hold-gpu ]; do sleep 30; done
echo "== screens (dehalo) $(date +%H:%M:%S)"; uv run -q --with numpy --with opencv-python-headless --with pillow python -u screens.py b-verify j-lot g-pickup f-staff
echo "== queue9d done $(date +%H:%M:%S)"
