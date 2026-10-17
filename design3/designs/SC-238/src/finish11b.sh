#!/usr/bin/env bash
# SC-238 pass 11's finish, again from the make step. finish11.sh's make step showed every retimed clip "refused" by
# VideoToolbox and made by RIFE: vtfx read --fps as a whole number (Int("59.9") is nil, a trap, exit 133), so a span
# retimed to its shot never reached the model, and the frames it wrote on a 1/600 s track read back at 600 fps. vtfx now
# takes a decimal rate as a fraction, makes any number of frames between two source frames (three a call, on the same
# pair), and writes on the rate's own timescale. Every clip and talking take is made again, and the run stops before the
# render if any span still falls back.
#    nohup ./finish11b.sh > build/finish11b.log 2>&1 &
set -eu
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue11.sh|[g]en-ltx.py|[q]wen_image_bf16_mac|[f]inish11.sh|[m]edia.py make" >/dev/null || [ -f build/hold-gpu ]; do sleep 30; done
step(){ echo "== $1 $(date +%H:%M:%S)"; }
enc(){ ffmpeg -v error -y -framerate 60 -i "$1/f%05d.jpg" -vf tpad=stop_mode=clone:stop=3 -c:v libx264 -preset slow -crf 12 -g 60 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart "$2"; }
step forget;   python3 -c "
import json; from pathlib import Path
M = json.loads(Path('build/media.json').read_text()); p = Path('build/made.json'); made = json.loads(p.read_text())
keep = {'bin-trail', 'e-orders', 'mango-d08'}          # (made with the fixed vtfx while it was tested)
gone = [k for k in list(made) if k in M and M[k]['kind'] in ('clip', 'talk') and k not in keep]
for k in gone: made.pop(k)
p.write_text(json.dumps(made, indent=1)); print(len(gone), 'clips and takes to make again by VideoToolbox')"
step make;     uv run -q --with numpy --with pillow python -u media.py make > build/make11b.log 2>&1
grep -v ": made$" build/make11b.log | tail -60
if grep -q "refused" build/make11b.log; then echo "!! a span fell back to RIFE: stopping before the render"; grep -B1 "refused" build/make11b.log; exit 1; fi
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
