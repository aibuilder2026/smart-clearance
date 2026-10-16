#!/usr/bin/env bash
# SC-219 (cut 13): the deliverables from build/film13-silent.mp4 (crf-12 picture) and build/mix13.wav: a crf-17 master and a
# 720p copy for working-demo/ at the repository root, a crf-21 1080p copy and the captions for design3/designs/SC-219/media/.
# The copies in working-demo/ carry the export's date and time in their names.
set -eu
cd "$(dirname "$0")"
B=build; M=../media; ROOT=/Users/arundutta/projects/smart-clearance; WD="$ROOT/working-demo"; STAMP="$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$M" "$WD"
enc(){ ffmpeg -v error -y -i "$B/film13-silent.mp4" -i "$B/mix13.wav" -map 0:v -map 1:a $1 -c:v libx264 -preset slow -crf "$2" \
  -pix_fmt yuv420p -profile:v high -tune film -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest "$3"; }
enc "" 17 "$B/smart-clearance-working-demo-master.mp4"
enc "" 21 "$M/smart-clearance-working-demo.mp4"
enc "-vf scale=1280:720:flags=lanczos" 23 "$M/smart-clearance-working-demo-720p.mp4"
cp "$B/smart-clearance-working-demo.srt" "$M/"
cp "$B/smart-clearance-working-demo-master.mp4" "$WD/smart-clearance-working-demo-$STAMP.mp4"
cp "$M/smart-clearance-working-demo-720p.mp4" "$WD/smart-clearance-working-demo-$STAMP-720p.mp4"
cp "$M/smart-clearance-working-demo.srt" "$WD/smart-clearance-working-demo-$STAMP.srt"
echo "stamp $STAMP"
ls -la "$M" "$WD" | tail -12
