#!/usr/bin/env bash
# SC-187: the live-action clips with Veo 3.1 at 1080p (8 s, no audio) from the approved keyframes, each priced before
# the call ($1.60 at 0.20 a second) and written with its sidecar; a clip that exists is skipped.
#   ./clips.sh c01-godown-date c02-priya-phone …    (run two at a time at most)
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; D="$(dirname "$HERE")"; V="$D/../../tools/vertex-media"
for c in "$@"; do
  k="k${c:1:2}"; key=$(ls "$HERE/img/$k"-*.png 2>/dev/null | grep -v -- '-t[0-9].png' | head -1)
  out="$HERE/clips/$c.mp4"
  [ -f "$out" ] && { echo "clip $c exists"; continue; }
  [ -f "$key" ] || { echo "no keyframe for $c"; continue; }
  seed=$((187200 + 10#${c:1:2}))
  (cd "$V" && uv run veo.py generate --model veo-3.1-generate-001 --res 1080p --duration 8 --image "$key" --prompt-file "$HERE/prompts/$c.txt" \
     --seed "$seed" --max-usd 2 --out "$out" --use "SC-187: a scene of the demo film, image to video from its keyframe")
done
