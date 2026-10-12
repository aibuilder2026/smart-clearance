#!/usr/bin/env bash
# once keyframes5 is done: the food-bank frame again (the first had three hands), then the retaken scenes' clips in two lanes
cd "$(dirname "$0")"; until grep -q "keyframes done" keyframes5.log; do sleep 10; done
HERE="$(pwd)"; D="$(dirname "$HERE")"; V="$D/../../tools/vertex-media"; P158="$D/../SC-158/img"; S="$HERE/screens"; L="$D/../../system/img/labels"
(cd "$V" && uv run nano.py still --prompt-file "$HERE/prompts/k32-foodbank-store.txt" --ref "$P158/cast-meera.webp" --ref "$S/approve--meera-pickups-phone.png" --ref "$L/MF-2410-118.webp" --ref "$D/../../system/img/pack-chips.webp" --seed 187332 --out "$HERE/img/k32-foodbank-store.png" --webp "$D/img" --use "SC-187 cut 2 keyframe: the food bank receiving the sealed cartons, the real label and pack as references") > keyframes6.log 2>&1
echo "k32 done"
./clips.sh c26-agrawal-tablet c22-priya-phone c24-priya-approve > clips3-laneC.log 2>&1 &
./clips.sh c25-kirana-offer c27-staff-sale c31-dark-store > clips3-laneD.log 2>&1 &
wait; echo "clips done"
