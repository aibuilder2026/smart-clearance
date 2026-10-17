#!/usr/bin/env bash
# SC-238 pass 11's finish, from the over-the-shoulder shots. finish11b.sh made every clip and talking take by
# VideoToolbox at its own rate; its screens step then took each over-the-shoulder frame as the nearest of 96 a second,
# and the steps went 1, 2, 2, 1, 2. vtfx --times now makes each frame at its own clip time (p-neha is made already).
# The motion check (cadence.py) stops the run before the render if any shot judders; the agents scene's floor footage no
# longer holds a frame and skips the next (agents.js), and the check samples its held shots at 62 s.
#    nohup ./finish11c.sh > build/finish11c.log 2>&1 &
set -eu
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue11.sh|[g]en-ltx.py|[q]wen_image_bf16_mac|[f]inish11.sh|[f]inish11b.sh|[m]edia.py make|[s]creens.py" >/dev/null || [ -f build/hold-gpu ]; do sleep 30; done
step(){ echo "== $1 $(date +%H:%M:%S)"; }
enc(){ ffmpeg -v error -y -framerate 60 -i "$1/f%05d.jpg" -vf tpad=stop_mode=clone:stop=3 -c:v libx264 -preset slow -crf 12 -g 60 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart "$2"; }
step screens;  uv run -q --with numpy --with opencv-python-headless --with pillow python -u screens.py $(python3 -c "
import json; M = json.load(open('build/media.json')); print(' '.join(k for k, m in M.items() if m['kind'] == 'ots' and k != 'p-neha'))")
step cadence;  uv run -q --with numpy --with opencv-python-headless python cadence.py
step agents3d; rm -rf build/cap-agents3d && node capture-page.mjs agents3d/index.html build/cap-agents3d build/cues-agents.json 60 > build/cap-agents3d.log 2>&1
enc build/cap-agents3d film/public/media/agents3d.mp4
step pwa;      rm -rf build/cap-pwa && node capture-page.mjs pwa11/pwa.html build/cap-pwa build/pwa-cues.json 60 > build/cap-pwa.log 2>&1
enc build/cap-pwa film/public/media/pwa.mp4
step cadence-pages; uv run -q --with numpy --with opencv-python-headless python cadence.py agents3d@20 agents3d@62 pwa
step ringscan; uv run -q --with numpy --with pillow python ringscan.py | grep -v ": clean" || true
step render;   (cd film && CONCURRENCY=6 node render.mjs video Film)
step mix;      uv run -q --with numpy --with scipy --with soundfile python mix.py --film build/render/Film.mov 2>&1 | grep -v "Error opening output\|Invalid argument\|does not contain any stream"
step export;   python3 export.py build/render/Film.mov build/mix.wav
step checks;   ./final-checks.sh "$(ls -t ../../../../landing-demo/sales-film/smart-clearance-sales-film-v3-2026-*.mp4 | grep -v -- '-720p\|-phone' | head -1)" build/mix.wav > build/final-checks.txt 2>&1 || true
step done
