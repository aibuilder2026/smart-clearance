#!/usr/bin/env bash
# SC-187 cut 2: the keyframes again with the app's own screens on the phones and tablets (the screenshots as
# references) and MUNCHLY cartons, plus three new places. Nano Banana 2, one after another.
#   nohup ./keyframes2.sh > keyframes2b.log 2>&1 &
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; D="$(dirname "$HERE")"; V="$D/../../tools/vertex-media"
P154="$D/../SC-154/img"; P158="$D/../SC-158/img"; S="$HERE/screens"
run(){ (cd "$V" && uv run nano.py "$@"); }
still(){ # key seed refs...
  local k="$1" s="$2"; shift 2
  [ -f "$HERE/img/$k.png" ] && { echo "keyframe $k exists"; return; }
  local refs=(); for r in "$@"; do refs+=(--ref "$r"); done
  run still --prompt-file "$HERE/prompts/$k.txt" ${refs[@]+"${refs[@]}"} --seed "$s" --out "$HERE/img/$k.png" --webp "$D/img" --use "SC-187 cut 2 keyframe: the first frame of a Veo clip for the demo film; the app's own screen on the phone"
}
PRIYA="$P154/cast-planner.webp"; RAKESH="$P154/cast-distributor.webp"
LAKSHMI="$P158/cast-lakshmi.webp"; MEERA="$P158/cast-meera.webp"
GANESH="$HERE/cast/cast-ganesh.png"; AGRAWAL="$HERE/cast/cast-agrawal.png"
still k21-godown-date 187121 "$RAKESH"
still k22-priya-phone 187122 "$PRIYA" "$S/detect--priya-command-phone.png"
still k24-priya-approve 187124 "$PRIYA" "$S/plan--priya-approve-sheet-phone.png"
still k25-kirana-offer 187125 "$GANESH" "$S/approve--kirana-ganesh-offer-phone.png"
still k26-agrawal-tablet 187126 "$AGRAWAL" "$S/approve--agrawal-listing.png"
still k27-staff-sale 187127 "$LAKSHMI" "$S/approve--lakshmi-today-phone.png"
still k28-foodbank-van 187128 "$MEERA" "$S/approve--meera-pickups-phone.png"
still k29-lakshmi-godown 187129 "$LAKSHMI"
still k30-depot 187130
still k31-dark-store 187131
still k32-kitchen 187132
echo "keyframes done"
