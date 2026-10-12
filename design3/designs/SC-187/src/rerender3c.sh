#!/usr/bin/env bash
# once the clip segments are done: the segments on the office keyframe's ground again, since that frame was re-rendered green
cd "$(dirname "$0")"; while pgrep -f "assemble.py --out ../media/smart-clearance-demo-cut3.mp4 --only 15,24" >/dev/null; do sleep 15; done
rm -f build3/ground-k51-brand-office.png
for f in build3/seg-13-* build3/seg-14-* build3/seg-16-* build3/seg-57-* build3/seg-58-* build3/seg-59-* build3/seg-60-* build3/seg-61-* build3/seg-62-* build3/seg-63-* build3/seg-64-*; do rm -f "$f"; done
FILM_BUILD=build3 FILM_MUSIC=bed-cut2.wav uv run --with pillow --with numpy python assemble.py --out ../media/smart-clearance-demo-cut3.mp4 --only 13,14,16,57,58,59,60,61,62,63,64 --no-concat > render3c.log 2>&1; echo "c done"
