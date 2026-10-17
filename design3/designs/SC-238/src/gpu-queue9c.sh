#!/usr/bin/env bash
# SC-238: after the ninth queues, the agents' 3D scene captured again (the gate an arch the camera pushes straight through,
# its curtain and glows gone before the lens reaches them; the coin's rupee upright; the Watcher's chip clear of the orb).
# Yields to a render (build/hold-gpu).
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue9b?.sh|[g]en-ltx.py|[q]wen_image_bf16_mac" >/dev/null || [ -f build/hold-gpu ]; do sleep 30; done
echo "== capture agents3d $(date +%H:%M:%S)"
rm -rf build/cap-agents3d && node capture-page.mjs agents3d/index.html build/cap-agents3d build/cues-agents.json 60 > build/cap-agents3d.log 2>&1
ffmpeg -v error -y -framerate 60 -i build/cap-agents3d/f%05d.jpg -vf tpad=stop_mode=clone:stop=3 -c:v libx264 -preset slow -crf 12 -g 60 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart film/public/media/agents3d.mp4
echo "== queue9c done $(date +%H:%M:%S)"
