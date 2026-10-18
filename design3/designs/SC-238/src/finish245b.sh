#!/usr/bin/env bash
# SC-245: the landing film v3's fixes. The Turn's sunrise taken again with no workers (LTX on a Qwen edit), the bin's
# heap through its last frames, the distributor's take on its thumb-free stretch with his Today live; the agents in 3D
# with their roll-call and a sharper lens; the install and audit pages' words clear of YouTube's header; then the
# motion check, the render, the mix, the export and the checks.
#    nohup ./finish245b.sh > build/finish245b.log 2>&1 & (after finish245.sh: the 3D scene again, the orb fading as the lens passes it)
set -eu
cd "$(dirname "$0")"
step(){ echo "== $1 $(date +%H:%M:%S)"; }
enc(){ ffmpeg -v error -y -framerate 25 -i "$1/f%05d.jpg" -vf tpad=stop_mode=clone:stop=3 -c:v libx264 -preset slow -crf 12 -g 50 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart "$2"; }
step agents3d; rm -rf build/cap-agents3d && node capture-page.mjs agents3d/index.html build/cap-agents3d build/cues-agents.json 25 > build/cap-agents3d.log 2>&1
enc build/cap-agents3d film/public/media/agents3d.mp4
step cadence-pages; uv run -q --with numpy --with opencv-python-headless python cadence.py agents3d@20 agents3d@62 || echo "cadence-pages: see above"
step render;   (cd film && CONCURRENCY=6 node render.mjs video Film)
step mix;      uv run -q --with numpy --with scipy --with soundfile python mix.py --film build/render/Film.mov 2>&1 | grep -v "Error opening output\|Invalid argument\|does not contain any stream"
step export;   python3 export.py build/render/Film.mov build/mix.wav
step checks;   ./final-checks.sh "$(ls -t ../../../../landing-demo/sales-film/smart-clearance-sales-film-v3-2026-*.mp4 | grep -v -- '-720p\|-phone' | head -1)" build/mix.wav > build/final-checks.txt 2>&1 || true
step done
