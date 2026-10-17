#!/usr/bin/env bash
# SC-238: the master's checks, in one report: its streams (size, rate, length, codec), any black frame (blackdetect,
# 2 frames or more; the opening on the ring is the only one expected), the stretches where nothing moves (the
# business-motion-film skill's frozen-time at 10 fps, the reading holds among them), its loudness (integrated, range,
# true peak), and every spoken line read back from the mix (readback.py).
#    ./final-checks.sh build/out/<master>.mp4 build/mix.wav > build/final-checks.txt
set -eu   # (no pipefail: head closing its pipe early is not a failure)
cd "$(dirname "$0")"
m="$1"; mix="${2:-build/mix.wav}"
SK=~/.claude/skills/business-motion-film/scripts
echo "== streams"
ffprobe -v error -show_entries stream=codec_name,profile,width,height,r_frame_rate,pix_fmt,bit_rate,sample_rate,channels -show_entries format=duration,size -of compact=p=0 "$m"
echo "== frames"
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$m"
echo "== black (≥ 2 frames, under 10% luma)"
ffmpeg -hide_banner -i "$m" -vf "blackdetect=d=0.033:pix_th=0.10" -an -f null - 2>&1 | grep -o "black_start:[0-9.]* black_end:[0-9.]* black_duration:[0-9.]*" || echo "none"
echo "== frozen (10 fps samples under 0.35 luma difference)"
"$SK/frozen-time.sh" "$m" 0.35 | tail -1
echo "== loudness"
"$SK/loudness.sh" "$m" | head -4
echo "== read-back"
uv run -q --python 3.12 --with mlx-whisper --with soundfile --with numpy python readback.py "$mix" build/readback.json | tail -1
