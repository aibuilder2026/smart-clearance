#!/usr/bin/env bash
cd "$(dirname "$0")"; while pgrep -f "assemble.py --out" >/dev/null; do sleep 15; done
FILM_MUSIC=bed-cut2.wav uv run --with pillow --with numpy python assemble.py --out ../media/smart-clearance-demo-cut2.mp4 --only 3,19 --no-concat > rerender-b.log 2>&1; echo "b done"
