#!/usr/bin/env bash
# SC-238: the full-quality pass, once every GPU queue is done and the new takes are reviewed: the plan again; the
# low-resolution clips super-resolved (Apple's x4 model); every clip, talking clip and window made at 60 fps (RIFE or
# VideoToolbox, per source); the over-the-shoulder screens with RIFE; the windows scanned for the recording stage's marks;
# the film rendered (Remotion, ProRes 422 HQ); its sound mixed on the same plan; the deliverables exported.
#    nohup ./finish-quality.sh > build/finish-quality.log 2>&1 &
set -eu
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue[23456]?.sh|[f]inish-gpu.sh" >/dev/null; do sleep 30; done
step(){ echo "== $1 $(date +%H:%M:%S)"; }
step plan;     uv run -q python plan.py | tail -1
step sr;       uv run -q --with numpy --with pillow python media.py sr
step audio;    uv run -q --with numpy --with pillow python media.py audio
step make;     uv run -q --with numpy --with pillow python media.py make
step screens;  uv run -q --with numpy --with opencv-python-headless --with pillow python screens.py
step ringscan; uv run -q --with numpy --with pillow python ringscan.py | grep -v ": clean" || true
step render;   (cd film && CONCURRENCY=6 node render.mjs video Film)
step mix;      uv run -q --with numpy --with scipy --with soundfile python mix.py --film build/render/Film.mov
step export;   python3 export.py build/render/Film.mov build/mix.wav
step done
