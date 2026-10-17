#!/usr/bin/env bash
# SC-238 pass 11's finish (the fourth critic): once the LTX queue (the wide shot's distributor, the brand's head off the
# lens) and the aerial plates are done: the lines measured; the plan; the camera's view (the after photo he takes); every
# generated clip and talking take made again by VideoToolbox (RIFE held one frame in five on them), every over-the-shoulder
# shot too; the 3D scene and the install captured again; the stage-mark scan; the master rendered, mixed, exported, checked.
#    nohup ./finish11.sh > build/finish11.log 2>&1 &
set -eu
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue11.sh|[g]en-ltx.py|[q]wen_image_bf16_mac" >/dev/null || [ -f build/hold-gpu ]; do sleep 30; done
step(){ echo "== $1 $(date +%H:%M:%S)"; }
enc(){ ffmpeg -v error -y -framerate 60 -i "$1/f%05d.jpg" -vf tpad=stop_mode=clone:stop=3 -c:v libx264 -preset slow -crf 12 -g 60 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart "$2"; }
step dlg;      uv run -q --python 3.12 --with mlx-whisper --with soundfile --with numpy python dlg.py 2>&1 | grep -v "Warning\|Fetching" | tail -14
step plan;     uv run -q python plan.py | tail -1
step xcam;     uv run -q --with numpy --with opencv-python-headless --with pillow python xcam.py m-xcam
step forget;   python3 -c "
import json; from pathlib import Path
M = json.loads(Path('build/media.json').read_text()); p = Path('build/made.json'); made = json.loads(p.read_text())
gone = [k for k in list(made) if k in M and M[k]['kind'] in ('clip', 'talk')]
for k in gone: made.pop(k)
p.write_text(json.dumps(made, indent=1)); print(len(gone), 'clips and takes to make again by VideoToolbox')"
step sr;       uv run -q --with numpy --with pillow python -u media.py sr 2>&1 | grep -v "super-resolved$" || true
step make;     uv run -q --with numpy --with pillow python -u media.py make 2>&1 | grep -v ": made$" | tail -40 || true
step screens;  uv run -q --with numpy --with opencv-python-headless --with pillow python -u screens.py
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
