#!/usr/bin/env bash
# SC-238 GPU queue, pass 11 (the fourth critic): the landfill's wide shot with the distributor of his close shots, and the
# brand's head turned to the lead, off the lens, made by LTX; then the 3D scene's aerial plates by VideoToolbox.
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]en-qwen11.sh" >/dev/null; do sleep 15; done
echo "== ltx $(date +%H:%M:%S)"
~/.local/bin/uv run --python 3.12 --script gen-ltx.py ltx-jobs11.json
echo "== aerial plates $(date +%H:%M:%S)"
uv run -q --with numpy --with pillow python aerial.py
echo "== queue11 done $(date +%H:%M:%S)"
