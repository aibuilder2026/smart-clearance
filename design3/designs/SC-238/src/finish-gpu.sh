#!/usr/bin/env bash
# SC-238: once every GPU queue is done, the GPU steps that need no review: the aerial footage at 60 fps for the 3D
# scene (aerial.py: super-resolved, then interpolated), then the 3D agents scene captured frame-exact at 60 fps on this
# narration's cues, encoded as the film's media, with its sounds' events kept for the mix.
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue[234]?.sh" >/dev/null; do sleep 30; done
echo "== aerial $(date +%H:%M:%S)"; uv run -q --with numpy --with pillow python aerial.py
echo "== capture agents3d $(date +%H:%M:%S)"
rm -rf build/cap-agents3d && node capture-page.mjs agents3d/index.html build/cap-agents3d build/cues-agents.json 60
ffmpeg -v error -y -framerate 60 -i build/cap-agents3d/f%05d.jpg -c:v libx264 -preset slow -crf 12 -g 60 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart film/public/media/agents3d.mp4
echo "== finish-gpu done $(date +%H:%M:%S)"
