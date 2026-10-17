#!/usr/bin/env bash
# SC-238: the finish, once every GPU queue is done: the plan, any media still to make, the stage-mark scan, the master
# (Remotion, ProRes 422 HQ, 1920 × 1080, 60 fps), its mix on the same plan, and the deliverables (export.py).
#    nohup ./final-render.sh > build/final-render.log 2>&1 &
set -eu
cd "$(dirname "$0")"
while pgrep -f "[g]pu-queue9[bcd]?.sh|[m]edia.py make" >/dev/null || [ -f build/hold-gpu ]; do sleep 30; done
step(){ echo "== $1 $(date +%H:%M:%S)"; }
step plan;     uv run -q python plan.py | tail -1
step make;     uv run -q --with numpy --with pillow python -u media.py make 2>&1 | grep -v ": made$" || true
step ringscan; uv run -q --with numpy --with pillow python ringscan.py | grep -v ": clean" || true
step render;   (cd film && CONCURRENCY=6 node render.mjs video Film)
step mix;      uv run -q --with numpy --with scipy --with soundfile python mix.py --film build/render/Film.mov 2>&1 | grep -v "Error opening output\|Invalid argument\|does not contain any stream"
step export;   python3 export.py build/render/Film.mov build/mix.wav
step done
