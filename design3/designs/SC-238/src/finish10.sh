#!/usr/bin/env bash
# SC-238 pass 10's finish (the user's notes on the 10:38 master, and the third critic's): once the LTX queue is done and
# its takes are reviewed: the lines measured in the new takes; the distributor's filming shot super-resolved and its
# blank screen tracked; the plan; the camera's view in his tablet; every new or changed clip and window made (the
# fast-forwards sampled again on their own spans); the over-the-shoulder inserts; the 3D scene and the install captured
# again; the stage-mark scan; the master rendered, mixed, exported and checked.
#    nohup ./finish10.sh > build/finish10.log 2>&1 &
set -eu
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue10.sh|[g]en-ltx.py|[q]wen_image_bf16_mac" >/dev/null || [ -f build/hold-gpu ]; do sleep 30; done
step(){ echo "== $1 $(date +%H:%M:%S)"; }
enc(){ ffmpeg -v error -y -framerate 60 -i "$1/f%05d.jpg" -vf tpad=stop_mode=clone:stop=3 -c:v libx264 -preset slow -crf 12 -g 60 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart "$2"; }
step dlg;      uv run -q --python 3.12 --with mlx-whisper --with soundfile --with numpy python dlg.py 2>&1 | grep -v Warning | tail -14
step sr-film;  [ -s build/sr/x-film.mov ] || vtfx/vtfx sr clips/x-film.mp4 build/sr/x-film.mov --width 1920
step track;    uv run -q --with numpy --with opencv-python-headless python track.py build/sr/x-film.mov x-film --check
step plan;     uv run -q python plan.py | tail -1
step xcam;     uv run -q --with numpy --with opencv-python-headless --with pillow python xcam.py m-xcam
step sr;       uv run -q --with numpy --with pillow python -u media.py sr 2>&1 | grep -v "super-resolved$" || true
step make;     uv run -q --with numpy --with pillow python -u media.py make 2>&1 | grep -v ": made$" || true
step screens;  uv run -q --with numpy --with opencv-python-headless --with pillow python -u screens.py x-film-a x-film-b x-film-c f-staff
step agents3d; rm -rf build/cap-agents3d && node capture-page.mjs agents3d/index.html build/cap-agents3d build/cues-agents.json 60 > build/cap-agents3d.log 2>&1
enc build/cap-agents3d film/public/media/agents3d.mp4
step pwa;      rm -rf build/cap-pwa && node capture-page.mjs pwa11/pwa.html build/cap-pwa build/pwa-cues.json 60 > build/cap-pwa.log 2>&1
enc build/cap-pwa film/public/media/pwa.mp4
step ringscan; uv run -q --with numpy --with pillow python ringscan.py | grep -v ": clean" || true
step render;   (cd film && CONCURRENCY=6 node render.mjs video Film)
step mix;      uv run -q --with numpy --with scipy --with soundfile python mix.py --film build/render/Film.mov 2>&1 | grep -v "Error opening output\|Invalid argument\|does not contain any stream"
step export;   python3 export.py build/render/Film.mov build/mix.wav
step checks;   ./final-checks.sh "$(ls -t ../../../../landing-demo/sales-film/smart-clearance-sales-film-v3-2026-*.mp4 | grep -v -- '-720p\|-phone' | head -1)" build/mix.wav > build/final-checks.txt 2>&1 || true
step done
