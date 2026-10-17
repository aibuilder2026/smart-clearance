#!/usr/bin/env bash
# SC-238 pass 12, resumed after the motion check: the talking takes, the bin's aerial and its two quick inserts made
# again (media.py), then the rest of finish12.sh from the check on.
# SC-238 pass 12: the film at 25 fps, as the earlier films were (the maintainer: "60fps is causing noise"), with SC-239's
# godown (its two walking workers painted out) and less background noise in the mix. Every clip, take, window and
# over-the-shoulder shot is made again at 25 fps from its source's own frames (media.py, screens.py, xcam.py); the
# aerials keep their own frames (aerial.py); the 3D scene and the install scene are captured at 25 fps; then the motion
# check, the render, the mix, the export and the checks.
#    nohup ./finish12b.sh > build/finish12b.log 2>&1 &
set -eu
cd "$(dirname "$0")"
step(){ echo "== $1 $(date +%H:%M:%S)"; }
enc(){ ffmpeg -v error -y -framerate 25 -i "$1/f%05d.jpg" -vf tpad=stop_mode=clone:stop=3 -c:v libx264 -preset slow -crf 12 -g 50 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart "$2"; }
step make;     uv run -q --with numpy --with pillow python media.py make
step cadence;  uv run -q --with numpy --with opencv-python-headless python cadence.py
step cadence-pages; uv run -q --with numpy --with opencv-python-headless python cadence.py agents3d@20 agents3d@62 pwa
step ringscan; uv run -q --with numpy --with pillow python ringscan.py | grep -v ": clean" || true
step render;   (cd film && CONCURRENCY=6 node render.mjs video Film)
step mix;      uv run -q --with numpy --with scipy --with soundfile python mix.py --film build/render/Film.mov 2>&1 | grep -v "Error opening output\|Invalid argument\|does not contain any stream"
step export;   python3 export.py build/render/Film.mov build/mix.wav
step checks;   ./final-checks.sh "$(ls -t ../../../../landing-demo/sales-film/smart-clearance-sales-film-v3-2026-*.mp4 | grep -v -- '-720p\|-phone' | head -1)" build/mix.wav > build/final-checks.txt 2>&1 || true
step done
