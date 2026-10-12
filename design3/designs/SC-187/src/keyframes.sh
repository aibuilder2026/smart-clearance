#!/usr/bin/env bash
# SC-187: the cast sheets and keyframes with Nano Banana 2 on Vertex AI, one after another (the image models' quota is a
# few a minute). PNG originals to src/cast and src/img; the WebP that ships, with its sidecar, to ../img.
#   nohup ./keyframes.sh > keyframes.log 2>&1 &
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; D="$(dirname "$HERE")"; V="$D/../../tools/vertex-media"
P154="$D/../SC-154/img"; P158="$D/../SC-158/img"
run(){ (cd "$V" && uv run nano.py "$@"); }
sheet(){ # name seed desc
  [ -f "$HERE/cast/$1.png" ] && { echo "sheet $1 exists"; return; }
  run sheet --name "$1" --desc "$3" --seed "$2" --out "$HERE/cast/$1.png" --webp "$D/img" --use "SC-187 cast: a fictional person, the reference for every keyframe they are in"
}
still(){ # key seed refs...
  local k="$1" s="$2"; shift 2
  [ -f "$HERE/img/$k.png" ] && { echo "keyframe $k exists"; return; }
  local refs=(); for r in "$@"; do refs+=(--ref "$r"); done
  run still --prompt-file "$HERE/prompts/$k.txt" "${refs[@]}" --seed "$s" --out "$HERE/img/$k.png" --webp "$D/img" --use "SC-187 keyframe: the first frame of a Veo clip for the demo film"
}
# the two new people
sheet cast-ganesh 187001 "an Indian man in his mid-forties who runs a small kirana shop: short neat black hair with a little grey at the temples, a trimmed moustache, a small red tilak on his forehead, a cream half-sleeve cotton shirt with a breast pocket and a pen in it, a steel watch; a friendly, alert face"
sheet cast-agrawal 187002 "an Indian man in his early forties who runs a wholesale business in a grain market: a short, well-kept beard, black hair combed back, a grey safari-style half-sleeve shirt with two chest pockets, a gold ring on his right hand, a thin gold chain; a shrewd, cheerful face"
PRIYA="$P154/cast-planner.webp"; RAKESH="$P154/cast-distributor.webp"; KIRANA_HYD="$P154/cast-kirana.webp"
LAKSHMI="$P158/cast-lakshmi.webp"; MEERA="$P158/cast-meera.webp"; NEHA="$P158/cast-neha.webp"
GANESH="$HERE/cast/cast-ganesh.png"; AGRAWAL="$HERE/cast/cast-agrawal.png"
still k01-godown-date 187101 "$RAKESH"
still k02-priya-phone 187102 "$PRIYA"
still k03-rakesh-label-photo 187103 "$RAKESH"
still k04-priya-approve 187104 "$PRIYA"
still k05-kirana-nagpur-offer 187105 "$GANESH"
still k06-agrawal-raipur 187106 "$AGRAWAL"
still k07-staff-sale-gate 187107 "$LAKSHMI"
still k08-feeding-india-van 187108 "$MEERA"
still k09-rakesh-tally-desk 187109 "$RAKESH"
still k10-landfill-certificate 187110 "$RAKESH"
still k11-neha-console 187111 "$NEHA"
still k12-close-lane 187112 "$GANESH"
still k13-lakshmi-godown 187113 "$LAKSHMI"
echo "keyframes done"
