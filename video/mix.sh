#!/usr/bin/env bash
# Builds the narration track from timeline.json, then muxes it with out/raw.webm into walkthrough.mp4.
set -euo pipefail
cd "$(dirname "$0")"
FF=${FFMPEG:-ffmpeg}

# 1. one padded wav per segment (audio + silence up to the segment's duration), then concat
python3 - <<'EOF'
import json, subprocess, os
segs = json.load(open("timeline.json"))
os.makedirs("out/seg", exist_ok=True)
with open("out/concat.txt", "w") as f:
    for s in segs:
        wav = f"out/seg/{s['id']}.wav"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"narration/{s['id']}.aiff",
                        "-af", f"apad=whole_dur={s['dur']}", "-ar", "48000", "-ac", "2", wav], check=True)
        f.write(f"file 'seg/{s['id']}.wav'\n")
EOF
$FF -y -loglevel error -f concat -safe 0 -i out/concat.txt -c:a pcm_s16le out/narration.wav
$FF -y -loglevel error -i out/narration.wav -c:a aac -b:a 128k out/narration.m4a

# 2. trim the recording so its clock matches the narration, encode h264 + aac
OFFSET=$(python3 -c "import json;print(json.load(open('out/offset.json'))['offset'])")
$FF -y -loglevel error -ss "$OFFSET" -i out/raw.webm -i out/narration.wav \
  -map 0:v -map 1:a -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -vf "scale=1920:1080" \
  -c:a aac -b:a 160k -movflags +faststart walkthrough.mp4
$FF -loglevel error -i walkthrough.mp4 -f null - && echo "ok: walkthrough.mp4"
$FF -loglevel error -i walkthrough.mp4 2>&1 | true
python3 -c "import subprocess;print(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration,size','-of','default=nw=1','walkthrough.mp4'],capture_output=True,text=True).stdout)"
