#!/usr/bin/env bash
# after the final concat: the checks, the tracked copies and the film's sidecar
set -e; cd "$(dirname "$0")"; F=../media/smart-clearance-demo-cut2.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact "$F"
ffmpeg -hide_banner -i "$F" -af ebur128=peak=true -f null - 2>&1 | grep -A3 "Integrated loudness" | head -4
# the tracked copies: 1080p under 100 MB, and 720p for phones
ffmpeg -hide_banner -loglevel error -y -i "$F" -c:v libx264 -preset slow -crf 24 -c:a copy -movflags +faststart ../media/smart-clearance-demo.mp4
ffmpeg -hide_banner -loglevel error -y -i "$F" -vf scale=1280:-2 -c:v libx264 -preset slow -crf 25 -c:a aac -b:a 128k -movflags +faststart ../media/smart-clearance-demo-720p.mp4
mkdir -p build && cp "$F" build/master-cut2-crf18.mp4 && rm -f "$F"
ls -la ../media/smart-clearance-demo.mp4 ../media/smart-clearance-demo-720p.mp4 | awk '{print $5, $9}'
echo "finish done"
