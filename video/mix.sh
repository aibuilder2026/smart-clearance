#!/usr/bin/env bash
# Builds the narration track from timeline.json, lays the music bed under it (ducked while the voice speaks),
# then muxes it with out/raw.webm into walkthrough.mp4.
set -euo pipefail
cd "$(dirname "$0")"
FF=${FFMPEG:-ffmpeg}

# 1. one padded wav per segment (audio + silence up to the segment's duration), then concat
python3 - <<'PY'
import json, subprocess, os
segs = json.load(open("timeline.json"))
os.makedirs("out/seg", exist_ok=True)
with open("out/concat.txt", "w") as f:
    for s in segs:
        wav = f"out/seg/{s['id']}.wav"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"narration/{s['id']}.aiff",
                        "-af", f"apad=whole_dur={s['dur']}", "-ar", "48000", "-ac", "2", wav], check=True)
        f.write(f"file 'seg/{s['id']}.wav'\n")
PY
$FF -y -loglevel error -f concat -safe 0 -i out/concat.txt -c:a pcm_s16le out/narration.wav
DUR=$(python3 -c "import json;print(json.load(open('timeline.json'))[-1]['start']+json.load(open('timeline.json'))[-1]['dur'])")

# 2. music bed (out/music.wav, built from an Apple Loop) trimmed to the video, ducked under the voice, mixed
if [ -f out/music.wav ]; then
  $FF -y -loglevel error -i out/narration.wav -i out/music.wav -filter_complex \
    "[1:a]atrim=0:${DUR},asetpts=PTS-STARTPTS,afade=t=out:st=$(python3 -c "print(${DUR}-4)"):d=4,volume=0.5[m];\
     [m][0:a]sidechaincompress=threshold=0.015:ratio=8:attack=40:release=700:makeup=1[md];\
     [0:a][md]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" \
    -map "[a]" -ar 48000 -ac 2 -c:a pcm_s16le out/mix.wav
else
  cp out/narration.wav out/mix.wav
fi
$FF -y -loglevel error -i out/mix.wav -c:a aac -b:a 160k out/narration.m4a

# 3. trim the recording so its clock matches the narration, encode h264 + aac
OFFSET=$(python3 -c "import json;print(json.load(open('out/offset.json'))['offset'])")
$FF -y -loglevel error -ss "$OFFSET" -i out/raw.webm -i out/mix.wav -t "$DUR" \
  -map 0:v -map 1:a -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -r 30 -vf "scale=1920:1080" \
  -c:a aac -b:a 192k -movflags +faststart walkthrough.mp4
$FF -loglevel error -i walkthrough.mp4 -f null - && echo "ok: walkthrough.mp4"
python3 -c "import subprocess;print(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration,size','-of','default=nw=1','walkthrough.mp4'],capture_output=True,text=True).stdout)"
