#!/usr/bin/env bash
# the first three scenes, from the re-rendered segments, with the voice and the music: a preview for the maintainer
cd "$(dirname "$0")"; until grep -q "b done" rerender-b.out 2>/dev/null; do sleep 15; done
FILM_MUSIC=bed-cut2.wav uv run --with pillow --with numpy python assemble.py --out ../media/preview-cut2-full.mp4 --only 73 > preview.log 2>&1
END=$(python3 -c "import json; print(json.load(open('film.json'))['scenes'][3]['start'])")
ffmpeg -hide_banner -loglevel error -y -i ../media/preview-cut2-full.mp4 -t "$END" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 160k -movflags +faststart ../media/preview-cut2-scenes-1-3.mp4
rm -f ../media/preview-cut2-full.mp4; echo "preview done ($END s)"
