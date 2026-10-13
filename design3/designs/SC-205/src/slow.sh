#!/usr/bin/env bash
# SC-205: each b-roll clip retimed to its shot at 25 fps with motion interpolation (no blended ghosts), graded to the
# film's look; 720p sources are scaled with lanczos and a light unsharp. slow.sh <in> <out> <speed> [720] [seconds to keep]
in="$1"; out="$2"; sp="$3"; up="${4:-}"; keep="${5:-}"
vf="setpts=PTS/${sp},minterpolate=fps=25:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"
vf="$vf,scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080"
[ -n "$up" ] && vf="$vf,unsharp=5:5:0.5:5:5:0"
ffmpeg -v error -y ${keep:+-t $keep} -i "$in" -an -vf "$vf" -c:v libx264 -crf 12 -preset slow -pix_fmt yuv420p "$out"
