#!/usr/bin/env bash
# the food-bank frame (rendering), then the office and kirana frames again (a second phone, a floating phone), then the clips in two lanes
cd "$(dirname "$0")"; HERE="$(pwd)"; D="$(dirname "$HERE")"; V="$D/../../tools/vertex-media"; P154="$D/../SC-154/img"; S="$HERE/screens"; L="$D/../../system/img/labels"; PACK="$D/../../system/img/pack-chips.webp"
until [ -f "$D/img/k32-foodbank-store.webp" ] || ! pgrep -f "k32-foodbank-store" >/dev/null; do sleep 5; done
still(){ local k="$1" s="$2"; shift 2; [ -f "$HERE/img/$k.png" ] && { echo "keyframe $k exists"; return; }; local refs=(); for r in "$@"; do refs+=(--ref "$r"); done; (cd "$V" && uv run nano.py still --prompt-file "$HERE/prompts/$k.txt" ${refs[@]+"${refs[@]}"} --seed "$s" --out "$HERE/img/$k.png" --webp "$D/img" --use "SC-187 cut 2 keyframe: one phone in hand, the real Munchly label and pack as references"); }
still k22-priya-phone 187422 "$P154/cast-planner.webp" "$S/detect--priya-command-phone.png" "$L/MF-2410-118.webp" "$PACK"
still k25-kirana-offer 187425 "$HERE/cast/cast-ganesh.png" "$S/approve--kirana-ganesh-offer-phone.png" "$L/MF-2409-117.webp" "$PACK"
echo "keyframes done"
./clips.sh c26-agrawal-tablet c24-priya-approve c22-priya-phone > clips3-laneC.log 2>&1 &
./clips.sh c27-staff-sale c31-dark-store c25-kirana-offer > clips3-laneD.log 2>&1 &
wait; echo "clips done"
