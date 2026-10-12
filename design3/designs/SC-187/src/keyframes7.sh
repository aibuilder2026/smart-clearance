#!/usr/bin/env bash
# cut 1's five scenes again with the real Munchly label and pack as references (the maintainer: every carton labelled)
set -u
cd "$(dirname "$0")"; HERE="$(pwd)"; D="$(dirname "$HERE")"; V="$D/../../tools/vertex-media"; P154="$D/../SC-154/img"; L="$D/../../system/img/labels"; PACK="$D/../../system/img/pack-chips.webp"
still(){ local k="$1" s="$2"; shift 2; [ -f "$HERE/img/$k.png" ] && { echo "keyframe $k exists"; return; }; local refs=(); for r in "$@"; do refs+=(--ref "$r"); done; (cd "$V" && uv run nano.py still --prompt-file "$HERE/prompts/$k.txt" ${refs[@]+"${refs[@]}"} --seed "$s" --out "$HERE/img/$k.png" --webp "$D/img" --use "SC-187 cut 2 keyframe: cut 1's scene with the real Munchly label and pack as references"); }
RAKESH="$P154/cast-distributor.webp"; GANESH="$HERE/cast/cast-ganesh.png"
still k01-godown-date 187601 "$RAKESH" "$L/MF-2409-117.webp" "$PACK"
still k03-rakesh-label-photo 187603 "$RAKESH" "$L/MF-2409-117.webp" "$PACK"
still k09-rakesh-tally-desk 187609 "$RAKESH" "$L/MF-2409-117.webp" "$PACK"
still k10-landfill-certificate 187610 "$RAKESH" "$L/MF-2409-117.webp" "$PACK"
still k12-close-lane 187612 "$GANESH" "$L/MF-2409-117.webp" "$PACK"
echo "keyframes done"
