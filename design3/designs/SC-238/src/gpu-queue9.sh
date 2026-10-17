#!/usr/bin/env bash
# SC-238: the ninth GPU queue, after the verification critic: the four new takes on pass 9's keyframes (the distributor
# reading the mango pack's date, the lead's dawn call, the food bank volunteer to the driver, the distributor's portal at
# dusk); then the two Nagpur shots again (their short clip now turns back at its end) and the install scene captured again
# (there from its first frame). Yields to a render (build/hold-gpu).
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue[2-8]?.sh|[f]inish-gpu.sh|[q]wen_image_bf16_mac" >/dev/null || [ -f build/hold-gpu ]; do sleep 30; done
echo "== ltx9 $(date +%H:%M:%S)"; ~/.local/bin/uv run --python 3.12 --script gen-ltx.py ltx-jobs9.json
while [ -f build/hold-gpu ]; do sleep 30; done
echo "== screens $(date +%H:%M:%S)"; uv run -q --with numpy --with opencv-python-headless --with pillow python -u screens.py c-dusk c-issued-bg
echo "== pwa $(date +%H:%M:%S)"; rm -rf build/cap-pwa && node capture-page.mjs pwa11/pwa.html build/cap-pwa build/pwa-cues.json 60 > build/cap-pwa.log 2>&1
ffmpeg -v error -y -framerate 60 -i build/cap-pwa/f%05d.jpg -vf tpad=stop_mode=clone:stop=3 -c:v libx264 -preset slow -crf 12 -g 60 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart film/public/media/pwa.mp4
echo "== queue9 done $(date +%H:%M:%S)"
