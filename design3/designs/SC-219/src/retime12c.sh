#!/usr/bin/env bash
# SC-219 cut 12's concept round: the LTX clips made to their shots' lengths at 25 fps and 1920 x 1080 for Remotion
# (public/clips/), a slow move stretched by motion interpolation, a short shot cut from the clip's start.
#   ./retime12c.sh
set -eu
cd "$(dirname "$0")"; OUT=remo12/public/clips; mkdir -p "$OUT"
fit="scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080"
stretch(){ local n="$1" len="$2"; [ -f "clips/$n.mp4" ] || { echo "no clips/$n.mp4"; return; }
  local d; d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "clips/$n.mp4")
  local k; k=$(python3 -c "print(round($len/$d, 4))")
  ffmpeg -v error -y -i "clips/$n.mp4" -vf "$fit,setpts=$k*PTS,minterpolate=fps=25:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" -t "$len" -an -c:v libx264 -crf 14 -pix_fmt yuv420p "$OUT/$n.mp4"
  echo "$n: $d s -> $len s (x$k)"; }
head_(){ local n="$1" len="$2"; [ -f "clips/$n.mp4" ] || { echo "no clips/$n.mp4"; return; }
  ffmpeg -v error -y -i "clips/$n.mp4" -vf "$fit,fps=25" -t "$len" -an -c:v libx264 -crf 14 -pix_fmt yuv420p "$OUT/$n.mp4"; echo "$n: first $len s"; }
stretch dc-a2-aisle 6.6
stretch dc-c2-blade 6.6
head_ dc-a1-pipes 3.6
head_ dc-c1-fibre 3.6
